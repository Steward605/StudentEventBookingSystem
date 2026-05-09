import express from 'express';

import { db } from '../db/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  const venues = db.prepare(`
    SELECT
      id,
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
    FROM venues
    WHERE is_active = 1
    ORDER BY campus COLLATE NOCASE ASC, name COLLATE NOCASE ASC
  `).all();

  res.json({ venues });
});

router.get('/:id', (req, res) => {
  const venue = db.prepare(`
    SELECT
      id,
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
    FROM venues
    WHERE id = ? AND is_active = 1
  `).get(req.params.id);

  if (!venue) {
    return res.status(404).json({ message: 'Venue not found.' });
  }

  res.json({ venue });
});

export default router;