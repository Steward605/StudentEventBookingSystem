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

  const events = [
    {
      title: 'Future Interfaces Showcase',
      category: 'Design',
      description: 'Students show interface prototypes and receive feedback from classmates and lecturers.',
      location: 'Innovation Studio, Building A',
      city: 'Kuching',
      event_date: dateFromToday(7),
      start_time: '10:00',
      end_time: '13:00',
      capacity: 120,
      price: 0,
      image_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
      organiser: 'School of ICT',
      accessibility_notes: 'Wheelchair accessible venue, captioned presentation slides, quiet seating area available.',
      created_by: admin?.id || null
    },
    {
      title: 'Startup Pitch Night',
      category: 'Entrepreneurship',
      description: 'Student teams pitch early ideas and receive comments from mentors about the problem, target users, and presentation.',
      location: 'Auditorium Hall 2',
      city: 'Kuching',
      event_date: dateFromToday(11),
      start_time: '18:30',
      end_time: '21:00',
      capacity: 200,
      price: 12,
      image_url: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80',
      organiser: 'Entrepreneurship Club',
      accessibility_notes: 'Step-free entry and front-row priority seating on request.',
      created_by: admin?.id || null
    },
    {
      title: 'AI for Social Good Workshop',
      category: 'Technology',
      description: 'A practical workshop where students discuss ethical AI use, plan a simple dataset, and sketch a small prototype idea.',
      location: 'Computer Lab 4',
      city: 'Kuching',
      event_date: dateFromToday(15),
      start_time: '14:00',
      end_time: '17:30',
      capacity: 45,
      price: 8,
      image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
      organiser: 'ICT Society',
      accessibility_notes: 'Lab machines include screen magnification settings; participants may bring personal laptops.',
      created_by: admin?.id || null
    },
    {
      title: 'Wellbeing Morning Run',
      category: 'Wellbeing',
      description: 'A relaxed campus run with warm-up guidance, water stations, and breakfast after the session.',
      location: 'Campus Green Entrance',
      city: 'Kuching',
      event_date: dateFromToday(17),
      start_time: '07:00',
      end_time: '09:00',
      capacity: 80,
      price: 5,
      image_url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=80',
      organiser: 'Student Wellbeing Team',
      accessibility_notes: 'Alternative walking route available; volunteers support participants with mobility needs.',
      created_by: admin?.id || null
    },
    {
      title: 'Cultural Food Festival',
      category: 'Community',
      description: 'A student event with food booths, performances, and cultural sharing from different societies.',
      location: 'Central Courtyard',
      city: 'Kuching',
      event_date: dateFromToday(22),
      start_time: '16:00',
      end_time: '20:30',
      capacity: 350,
      price: 3,
      image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80',
      organiser: 'Student Council',
      accessibility_notes: 'Food allergen cards are displayed at each booth; wide walkways are maintained.',
      created_by: admin?.id || null
    },
    {
      title: 'Portfolio Review Clinic',
      category: 'Career',
      description: 'Small-group portfolio review for students applying to design, software, and data roles.',
      location: 'Career Hub',
      city: 'Kuching',
      event_date: dateFromToday(35),
      start_time: '11:00',
      end_time: '15:00',
      capacity: 60,
      price: 0,
      image_url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
      organiser: 'Career Services',
      accessibility_notes: 'Digital portfolio reviews available for students who prefer online feedback.',
      created_by: admin?.id || null
    }
  ];

  const transaction = db.transaction(items => items.forEach(event => insert.run(event)));
  transaction(events);
}
