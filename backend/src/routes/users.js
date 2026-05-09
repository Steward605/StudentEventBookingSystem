import express from 'express';
import { db } from '../db/database.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { requiredEmail, requiredString } from '../utils/validators.js';

const router = express.Router();

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.get('/all', requireAuth, requireAdmin, (req, res, next) => {
  try {
    const users = db.prepare(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.campus,
        u.interests,
        u.created_at,
        COUNT(b.id) AS booking_count,
        COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.ticket_count ELSE 0 END), 0) AS confirmed_tickets
      FROM users u
      LEFT JOIN bookings b ON b.user_id = u.id
      GROUP BY
        u.id,
        u.name,
        u.email,
        u.role,
        u.campus,
        u.interests,
        u.created_at
      ORDER BY datetime(u.created_at) DESC, u.name COLLATE NOCASE ASC
    `).all();

    res.json({ users });
  } catch (error) {
    next(error);
  }
});

router.put('/me', requireAuth, (req, res, next) => {
  try {
    const name = requiredString(req.body.name, 'Name');
    const email = requiredEmail(req.body.email);
    const campus = req.body.campus?.trim() || 'Hawthorn';
    const interests = req.body.interests?.trim() || '';
    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, req.user.id);
    if (existing) {
      return res.status(409).json({ message: 'This email is already used by another account.' });
    }
    db.prepare(`
      UPDATE users
      SET name = ?, email = ?, campus = ?, interests = ?
      WHERE id = ?
    `).run(name, email, campus, interests, req.user.id);
    const user = db.prepare('SELECT id, name, email, role, campus, interests FROM users WHERE id = ?').get(req.user.id);
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

export default router;