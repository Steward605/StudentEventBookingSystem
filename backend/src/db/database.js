import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../../data');
const dbFile = process.env.DB_FILE || path.join(dataDir, 'student_event_booking_system.sqlite');

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
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
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

  seedUsers();
  seedEvents();
}

function seedUsers() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, campus, interests)
    VALUES (@name, @email, @password_hash, @role, @campus, @interests)
  `);

  const users = [
    {
      name: 'Admin Coordinator',
      email: 'admin@email.com',
      password_hash: bcrypt.hashSync('Admin123!', 10),
      role: 'admin',
      campus: 'Hawthorn',
      interests: 'Student leadership, technology, design'
    },
    {
      name: 'Maya Chen',
      email: 'student@email.com',
      password_hash: bcrypt.hashSync('Student123!', 10),
      role: 'student',
      campus: 'Sarawak',
      interests: 'Design, entrepreneurship, community events'
    }
  ];

  const transaction = db.transaction(items => items.forEach(user => insert.run(user)));
  transaction(users);
}

function seedEvents() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM events').get().count;
  if (count > 0) return;

  const admin = db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get('admin');
  const insert = db.prepare(`
    INSERT INTO events (
      title, category, description, location, city, event_date, start_time, end_time,
      capacity, price, image_url, organiser, accessibility_notes, created_by
    ) VALUES (
      @title, @category, @description, @location, @city, @event_date, @start_time, @end_time,
      @capacity, @price, @image_url, @organiser, @accessibility_notes, @created_by
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

  const venues = [
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
    Design: [
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80'
    ],
    Technology: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80'
    ],
    Career: [
      'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80'
    ],
    Community: [
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80'
    ],
    Wellbeing: [
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80'
    ],
    Entrepreneurship: [
      'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'
    ],
    Academic: [
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1200&q=80'
    ],
    Sports: [
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=1200&q=80'
    ]
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

  const events = Array.from({ length: 120 }, (_, index) => {
    const eventNumber = index + 1;
    const category = categories[index % categories.length];
    const city = cities[index % cities.length];
    const venue = venues[index % venues.length];
    const organiser = organisers[index % organisers.length];
    const startHour = 8 + (index % 10);
    const endHour = startHour + 2;
    const theme = titleThemes[index % titleThemes.length];
    const format = titleFormats[Math.floor(index / titleThemes.length) % titleFormats.length];
    const imagePool = categoryImagePools[category] || categoryImagePools.Technology;
    const imageUrl = imagePool[Math.floor(index / categories.length) % imagePool.length];

    return {
      title: `${theme} ${format}`,
      category,
      description: `A student event designed for testing event browsing, booking, filtering, and pagination. This is seeded event ${eventNumber}.`,
      location: `${venue}, Room ${100 + eventNumber}`,
      city,
      event_date: dateFromToday(3 + index),
      start_time: `${String(startHour).padStart(2, '0')}:00`,
      end_time: `${String(endHour).padStart(2, '0')}:00`,
      capacity: 40 + (index % 160),
      price: index % 4 === 0 ? 0 : Number((5 + (index % 25)).toFixed(2)),
      image_url: imageUrl,
      organiser,
      accessibility_notes: 'Wheelchair accessible venue. Contact organiser for additional accessibility support.',
      created_by: admin?.id || null
    };
  });

  const transaction = db.transaction(items => items.forEach(event => insert.run(event)));
  transaction(events);
}
