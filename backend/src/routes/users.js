import express from 'express';
import { db } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { requiredEmail, requiredString } from '../utils/validators.js';

const router = express.Router();

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
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
