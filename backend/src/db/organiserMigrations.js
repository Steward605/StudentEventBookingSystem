import { db } from './database.js';

function columnExists(tableName, columnName) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return columns.some(column => column.name === columnName);
}

function addColumnIfMissing(tableName, columnName, definition) {
  if (!columnExists(tableName, columnName)) {
    db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`).run();
  }
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
      @is_active
    )
  `);

  const venues = [
    {
      name: 'Innovation Studio',
      campus: 'Sarawak',
      building: 'School of ICT',
      room: 'ICT-201',
      city: 'Kuching',
      capacity: 80,
      venue_type: 'Studio',
      facilities: 'Projector, whiteboard, movable tables, high-speed Wi-Fi',
      accessibility_notes: 'Wheelchair accessible. Lift access available.',
      image_url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
      is_active: 1
    },
    {
      name: 'Main Auditorium',
      campus: 'Sarawak',
      building: 'Main Block',
      room: 'AUD-001',
      city: 'Kuching',
      capacity: 250,
      venue_type: 'Auditorium',
      facilities: 'Stage, PA system, projector, fixed seating',
      accessibility_notes: 'Wheelchair accessible front-row area. Accessible toilets nearby.',
      image_url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
      is_active: 1
    },
    {
      name: 'Computer Lab 4',
      campus: 'Sarawak',
      building: 'School of ICT',
      room: 'LAB-404',
      city: 'Kuching',
      capacity: 45,
      venue_type: 'Computer Lab',
      facilities: 'Desktop computers, projector, lab network, whiteboard',
      accessibility_notes: 'Wheelchair accessible. Adjustable front desk available.',
      image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
      is_active: 1
    },
    {
      name: 'Student Lounge',
      campus: 'Sarawak',
      building: 'Student Hub',
      room: 'Lounge A',
      city: 'Kuching',
      capacity: 60,
      venue_type: 'Lounge',
      facilities: 'Casual seating, TV display, Wi-Fi, pantry access',
      accessibility_notes: 'Ground-floor venue with step-free entry.',
      image_url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80',
      is_active: 1
    },
    {
      name: 'Seminar Room B',
      campus: 'Sarawak',
      building: 'Academic Block',
      room: 'B-105',
      city: 'Kuching',
      capacity: 35,
      venue_type: 'Seminar Room',
      facilities: 'Projector, seminar tables, whiteboard, Wi-Fi',
      accessibility_notes: 'Wheelchair accessible via side entrance.',
      image_url: 'https://images.unsplash.com/photo-1560439514-4e9645039924?auto=format&fit=crop&w=1200&q=80',
      is_active: 1
    }
  ];

  const transaction = db.transaction(items => {
    items.forEach(venue => insert.run(venue));
  });

  transaction(venues);
}

function backfillExistingEvents() {
  const firstVenue = db.prepare('SELECT id, name, city, capacity, accessibility_notes FROM venues ORDER BY id LIMIT 1').get();
  if (!firstVenue) {
    return;
  }
  db.prepare(`
    UPDATE events
    SET venue_id = COALESCE(venue_id, ?),
        status = COALESCE(status, 'published'),
        organiser_user_id = COALESCE(organiser_user_id, created_by),
        location = COALESCE(NULLIF(location, ''), ?),
        city = COALESCE(NULLIF(city, ''), ?)
  `).run(firstVenue.id, firstVenue.name, firstVenue.city);
}

function verifySeedStudentForDemo() {
  db.prepare(`
    UPDATE users
    SET verification_status = 'verified',
        verified_at = COALESCE(verified_at, CURRENT_TIMESTAMP)
    WHERE email = 'student@email.com'
      AND role = 'student'
      AND verification_status = 'pending'
  `).run();
}

export function runOrganiserMigrations() {
  db.exec(`
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
  `);

  addColumnIfMissing('users', 'verification_status', "TEXT NOT NULL DEFAULT 'pending'");
  addColumnIfMissing('users', 'verified_at', 'TEXT DEFAULT NULL');
  addColumnIfMissing('events', 'venue_id', 'INTEGER REFERENCES venues(id) ON DELETE SET NULL');
  addColumnIfMissing('events', 'status', "TEXT NOT NULL DEFAULT 'published'");
  addColumnIfMissing('events', 'organiser_user_id', 'INTEGER REFERENCES users(id) ON DELETE SET NULL');
  seedVenues();
  backfillExistingEvents();
  verifySeedStudentForDemo();
}