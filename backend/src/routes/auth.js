import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';
import { createToken } from '../middleware/auth.js';
import { requiredEmail, requiredString } from '../utils/validators.js';

const router = express.Router();

router.post('/register', (req, res, next) => {
  try {
    const name = requiredString(req.body.name, 'Name');
    const email = requiredEmail(req.body.email);
    const password = requiredString(req.body.password, 'Password');
    const campus = req.body.campus?.trim() || 'Hawthorn';
    const interests = req.body.interests?.trim() || '';

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must contain at least 8 characters.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, campus, interests)
      VALUES (?, ?, ?, 'student', ?, ?)
    `).run(name, email, password_hash, campus, interests);

    const user = db.prepare('SELECT id, name, email, role, campus, interests FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ user, token: createToken(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/login', (req, res, next) => {
  try {
    const email = requiredEmail(req.body.email);
    const password = requiredString(req.body.password, 'Password');
    const userRecord = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!userRecord || !bcrypt.compareSync(password, userRecord.password_hash)) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role,
      campus: userRecord.campus,
      interests: userRecord.interests
    };

    res.json({ user, token: createToken(user) });
  } catch (error) {
    next(error);
  }
});

export default router;
