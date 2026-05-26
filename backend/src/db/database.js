import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../../data');
const dbFile = process.env.DB_FILE || path.join(dataDir, 'student_event_booking_system.sqlite');
const assetBaseUrl = (process.env.PUBLIC_ASSET_BASE_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, '');

const venueImageFiles = {
  'Innovation Studio': 'workshop-room.jpg',
  'Main Auditorium': 'auditorium.jpg',
  'Computer Lab 4': 'computer-lab.jpg',
  'Student Lounge': 'casual-event-space.jpg',
  'Campus Green': 'outdoor-space.jpg',
  'Career Hub': 'career-event-room.jpg',
  'Seminar Room B': 'seminar-room.jpg',
  'Central Courtyard': 'outdoor-courtyard.jpg'
};

const eventCategoryImageCount = 5;

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(dbFile);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function dateFromToday(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function assetUrl(fileName) {
  return `${assetBaseUrl}/assets/${fileName}`;
}

function venueImageUrl(venueName) {
  return assetUrl(venueImageFiles[venueName]);
}

function categoryImageUrls(categoryName) {
  const slug = categoryName.toLowerCase().replace(/\s+/g, '-');
  return Array.from(
    { length: eventCategoryImageCount },
    (_, index) => assetUrl(`categoryImagePools-${slug}${index + 1}.jpg`)
  );
}

function getColumnNames(tableName) {
  return db.prepare(`PRAGMA table_info(${tableName})`).all().map(column => column.name);
}

function ensureColumn(tableName, columnName, definition) {
  const columns = getColumnNames(tableName);

  if (!columns.includes(columnName)) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

function runMigrations() {
  ensureColumn('users', 'verification_status', "TEXT NOT NULL DEFAULT 'pending'");
  ensureColumn('events', 'venue_id', 'INTEGER');
  ensureColumn('events', 'status', "TEXT NOT NULL DEFAULT 'published'");
  ensureColumn('events', 'organiser_user_id', 'INTEGER');

  db.prepare(`
    UPDATE users
    SET verification_status = 'verified'
    WHERE role = 'admin'
  `).run();

  db.prepare(`
    UPDATE users
    SET verification_status = 'verified'
    WHERE email = 'student@email.com'
  `).run();

  db.prepare(`
    UPDATE events
    SET status = 'published'
    WHERE status IS NULL OR status = ''
  `).run();
}

export function initialiseDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      campus TEXT DEFAULT 'Hawthorn',
      interests TEXT DEFAULT '',
      verification_status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS venues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      campus TEXT NOT NULL,
      building TEXT NOT NULL,
      room TEXT NOT NULL,
      city TEXT NOT NULL,
      capacity INTEGER NOT NULL CHECK(capacity > 0),
      venue_type TEXT NOT NULL,
      facilities TEXT DEFAULT '',
      accessibility_notes TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      location TEXT NOT NULL,
      city TEXT NOT NULL,
      event_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      image_url TEXT NOT NULL,
      organiser TEXT NOT NULL,
      accessibility_notes TEXT DEFAULT '',
      created_by INTEGER,
      venue_id INTEGER,
      status TEXT NOT NULL DEFAULT 'published',
      organiser_user_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL,
      FOREIGN KEY (organiser_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      event_id INTEGER NOT NULL,
      ticket_count INTEGER NOT NULL CHECK(ticket_count > 0),
      attendee_name TEXT NOT NULL,
      attendee_email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      booking_reference TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );
  `);

  runMigrations();
  seedUsers();
  seedVenues();
  syncVenueImageUrls();
  seedEvents();
  syncSeedEventImageUrls();
}

function seedUsers() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;

  if (count > 0) {
    return;
  }

  const insert = db.prepare(`
    INSERT INTO users (
      name,
      email,
      password_hash,
      role,
      campus,
      interests,
      verification_status
    )
    VALUES (
      @name,
      @email,
      @password_hash,
      @role,
      @campus,
      @interests,
      @verification_status
    )
  `);

  const users = [
    {
      name: 'Admin Coordinator',
      email: 'admin@email.com',
      password_hash: bcrypt.hashSync('Admin123!', 10),
      role: 'admin',
      campus: 'Hawthorn',
      interests: 'Student leadership, technology, design',
      verification_status: 'verified'
    },
    {
      name: 'Maya Chen',
      email: 'student@email.com',
      password_hash: bcrypt.hashSync('Student123!', 10),
      role: 'student',
      campus: 'Sarawak',
      interests: 'Design, entrepreneurship, community events',
      verification_status: 'verified'
    },
    {
      name: 'Daniel Tan',
      email: 'pending@student.com',
      password_hash: bcrypt.hashSync('Student123!', 10),
      role: 'student',
      campus: 'Sarawak',
      interests: 'Sports, technology, volunteering',
      verification_status: 'pending'
    }
  ];

  const transaction = db.transaction(items => items.forEach(user => insert.run(user)));
  transaction(users);
}

function seedVenues() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM venues').get().count;

  if (count > 0) {
    return;
  }

  const insert = db.prepare(`
    INSERT INTO venues (
      name,
      campus,
      building,
      room,
      city,
      capacity,
      venue_type,
      facilities,
      accessibility_notes,
      image_url,
      is_active
    )
    VALUES (
      @name,
      @campus,
      @building,
      @room,
      @city,
      @capacity,
      @venue_type,
      @facilities,
      @accessibility_notes,
      @image_url,
      1
    )
  `);

  const venues = [
    {
      name: 'Innovation Studio',
      campus: 'Sarawak',
      building: 'ICT Building',
      room: 'IS-201',
      city: 'Kuching',
      capacity: 60,
      venue_type: 'Workshop room',
      facilities: 'Projector, whiteboard, movable tables, Wi-Fi',
      accessibility_notes: 'Lift access and wheelchair-friendly entrance available.',
      image_url: venueImageUrl('Innovation Studio')
    },
    {
      name: 'Main Auditorium',
      campus: 'Sarawak',
      building: 'Student Hub',
      room: 'AUD-001',
      city: 'Kuching',
      capacity: 220,
      venue_type: 'Auditorium',
      facilities: 'Stage, projector, sound system, fixed seating',
      accessibility_notes: 'Wheelchair spaces available near main entrance.',
      image_url: venueImageUrl('Main Auditorium')
    },
    {
      name: 'Computer Lab 4',
      campus: 'Sarawak',
      building: 'ICT Building',
      room: 'LAB-104',
      city: 'Kuching',
      capacity: 40,
      venue_type: 'Computer lab',
      facilities: 'Desktop computers, projector, coding software, Wi-Fi',
      accessibility_notes: 'Accessible by lift. Adjustable desk available on request.',
      image_url: venueImageUrl('Computer Lab 4')
    },
    {
      name: 'Student Lounge',
      campus: 'Sarawak',
      building: 'Student Hub',
      room: 'SL-110',
      city: 'Kuching',
      capacity: 80,
      venue_type: 'Casual event space',
      facilities: 'Sofa seating, small stage, portable screen, Wi-Fi',
      accessibility_notes: 'Ground-floor access available.',
      image_url: venueImageUrl('Student Lounge')
    },
    {
      name: 'Campus Green',
      campus: 'Sarawak',
      building: 'Outdoor Campus Area',
      room: 'GREEN-01',
      city: 'Kuching',
      capacity: 180,
      venue_type: 'Outdoor space',
      facilities: 'Open field, portable booth space, outdoor lighting',
      accessibility_notes: 'Step-free access available from the main campus path.',
      image_url: venueImageUrl('Campus Green')
    },
    {
      name: 'Career Hub',
      campus: 'Sarawak',
      building: 'Student Services Centre',
      room: 'CH-205',
      city: 'Kuching',
      capacity: 70,
      venue_type: 'Career event room',
      facilities: 'Projector, interview booths, presentation screen, Wi-Fi',
      accessibility_notes: 'Lift access and accessible washroom nearby.',
      image_url: venueImageUrl('Career Hub')
    },
    {
      name: 'Seminar Room B',
      campus: 'Hawthorn',
      building: 'Academic Centre',
      room: 'B-302',
      city: 'Hawthorn',
      capacity: 55,
      venue_type: 'Seminar room',
      facilities: 'Projector, lectern, hybrid meeting camera, Wi-Fi',
      accessibility_notes: 'Accessible lift and automatic doors available.',
      image_url: venueImageUrl('Seminar Room B')
    },
    {
      name: 'Central Courtyard',
      campus: 'Hawthorn',
      building: 'Central Campus',
      room: 'COURT-01',
      city: 'Hawthorn',
      capacity: 150,
      venue_type: 'Outdoor courtyard',
      facilities: 'Outdoor seating, portable stage area, power access',
      accessibility_notes: 'Step-free courtyard access available.',
      image_url: venueImageUrl('Central Courtyard')
    }
  ];

  const transaction = db.transaction(items => items.forEach(venue => insert.run(venue)));
  transaction(venues);
}

function syncVenueImageUrls() {
  const update = db.prepare('UPDATE venues SET image_url = ? WHERE name = ?');
  const transaction = db.transaction(() => {
    Object.entries(venueImageFiles).forEach(([venueName, fileName]) => {
      update.run(assetUrl(fileName), venueName);
    });
  });

  transaction();
}

function syncSeedEventImageUrls() {
  const seededEvents = db.prepare(`
    SELECT id, category
    FROM events
    WHERE description LIKE 'A student event designed for testing event browsing,%'
    ORDER BY id
  `).all();

  const categoryCounters = new Map();
  const update = db.prepare('UPDATE events SET image_url = ? WHERE id = ?');
  const transaction = db.transaction(events => {
    events.forEach(event => {
      const currentCount = categoryCounters.get(event.category) || 0;
      const imagePool = categoryImageUrls(event.category);

      update.run(imagePool[currentCount % imagePool.length], event.id);
      categoryCounters.set(event.category, currentCount + 1);
    });
  });

  transaction(seededEvents);
}

function seedEvents() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM events').get().count;

  if (count > 0) {
    return;
  }

  const admin = db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get('admin');

  const insert = db.prepare(`
    INSERT INTO events (
      title,
      category,
      description,
      location,
      city,
      event_date,
      start_time,
      end_time,
      capacity,
      price,
      image_url,
      organiser,
      accessibility_notes,
      created_by,
      venue_id,
      status,
      organiser_user_id
    )
    VALUES (
      @title,
      @category,
      @description,
      @location,
      @city,
      @event_date,
      @start_time,
      @end_time,
      @capacity,
      @price,
      @image_url,
      @organiser,
      @accessibility_notes,
      @created_by,
      @venue_id,
      @status,
      @organiser_user_id
    )
  `);

  const categories = [
    'Design',
    'Technology',
    'Career',
    'Community',
    'Wellbeing',
    'Entrepreneurship',
    'Academic',
    'Sports'
  ];

  const cities = [
    'Kuching',
    'Kuala Lumpur',
    'Melbourne',
    'Hawthorn',
    'Sydney'
  ];

  const venueNames = [
    'Innovation Studio',
    'Main Auditorium',
    'Computer Lab 4',
    'Student Lounge',
    'Campus Green',
    'Career Hub',
    'Seminar Room B',
    'Central Courtyard'
  ];

  const organisers = [
    'School of ICT',
    'Student Council',
    'Career Services',
    'ICT Society',
    'Entrepreneurship Club',
    'Student Wellbeing Team'
  ];

  const categoryImagePools = {
    Design: categoryImageUrls('Design'),
    Technology: categoryImageUrls('Technology'),
    Career: categoryImageUrls('Career'),
    Community: categoryImageUrls('Community'),
    Wellbeing: categoryImageUrls('Wellbeing'),
    Entrepreneurship: categoryImageUrls('Entrepreneurship'),
    Academic: categoryImageUrls('Academic'),
    Sports: categoryImageUrls('Sports')
  };

  const titleThemes = [
    'Future Interfaces',
    'Startup Pitch',
    'AI for Social Good',
    'Wellbeing Morning',
    'Cultural Food',
    'Portfolio Review',
    'Student Innovation',
    'Campus Connect',
    'Leadership Lab',
    'Career Booster',
    'Creative Coding',
    'Digital Futures',
    'Industry Insights',
    'Green Campus',
    'Global Voices'
  ];

  const titleFormats = [
    'Showcase',
    'Workshop',
    'Forum',
    'Bootcamp',
    'Meetup',
    'Challenge',
    'Festival',
    'Clinic'
  ];

  const venueRows = db.prepare('SELECT * FROM venues ORDER BY id').all();

  const venueByName = new Map(
    venueRows.map(venue => [venue.name, venue])
  );

  const events = Array.from({ length: 120 }, (_, index) => {
    const eventNumber = index + 1;
    const category = categories[index % categories.length];
    const fallbackCity = cities[index % cities.length];
    const venueName = venueNames[index % venueNames.length];
    const venue = venueByName.get(venueName) || venueRows[index % venueRows.length] || null;
    const organiser = organisers[index % organisers.length];
    const startHour = 8 + (index % 10);
    const endHour = startHour + 2;
    const theme = titleThemes[index % titleThemes.length];
    const format = titleFormats[Math.floor(index / titleThemes.length) % titleFormats.length];
    const imagePool = categoryImagePools[category] || categoryImagePools.Technology;
    const imageUrl = imagePool[Math.floor(index / categories.length) % imagePool.length];

    const maxVenueCapacity = venue?.capacity || 200;
    const plannedCapacity = 40 + (index % 160);
    const capacity = Math.min(plannedCapacity, maxVenueCapacity);

    return {
      title: `${theme} ${format}`,
      category,
      description: `A student event designed for testing event browsing, booking, filtering, and pagination. This is seeded event ${eventNumber}.`,
      location: venue ? `${venue.name}, ${venue.building} ${venue.room}` : `${venueName}, Room ${100 + eventNumber}`,
      city: venue?.city || fallbackCity,
      event_date: dateFromToday(3 + index),
      start_time: `${String(startHour).padStart(2, '0')}:00`,
      end_time: `${String(endHour).padStart(2, '0')}:00`,
      capacity,
      price: index % 4 === 0 ? 0 : Number((5 + (index % 25)).toFixed(2)),
      image_url: imageUrl,
      organiser,
      accessibility_notes: venue?.accessibility_notes || 'Wheelchair accessible venue. Contact organiser for additional accessibility support.',
      created_by: admin?.id || null,
      venue_id: venue?.id || null,
      status: 'published',
      organiser_user_id: null
    };
  });

  const transaction = db.transaction(items => items.forEach(event => insert.run(event)));
  transaction(events);
}
