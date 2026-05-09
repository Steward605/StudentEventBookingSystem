import express from 'express';
import { db } from '../db/database.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { requiredEmail, requiredPositiveInteger, requiredString } from '../utils/validators.js';

const router = express.Router();
router.get('/', requireAuth, (req, res) => {
  const bookings = db.prepare(`
    SELECT
      b.*,
      e.title,
      e.category,
      e.location,
      e.city,
      e.event_date,
      e.start_time,
      e.end_time,
      e.price,
      e.image_url,
      e.status AS event_status,
      v.name AS venue_name
    FROM bookings b
    JOIN events e ON e.id = b.event_id
    LEFT JOIN venues v ON v.id = e.venue_id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
  `).all(req.user.id);
  res.json({ bookings });
});
router.get('/all', requireAuth, requireAdmin, (req, res) => {
  const bookings = db.prepare(`
    SELECT
      b.*,
      u.name AS student_name,
      u.email AS student_email,
      e.title,
      e.category,
      e.location,
      e.city,
      e.event_date,
      e.start_time,
      e.end_time,
      e.price,
      e.image_url,
      e.status AS event_status,
      v.name AS venue_name
    FROM bookings b
    JOIN users u ON u.id = b.user_id
    JOIN events e ON e.id = b.event_id
    LEFT JOIN venues v ON v.id = e.venue_id
    ORDER BY b.created_at DESC
  `).all();
  res.json({ bookings });
});

router.post('/', requireAuth, (req, res, next) => {
  if (req.user.role === 'admin') {
    return res.status(403).json({ message: 'Admin accounts cannot book event tickets.' });
  }
  try {
    const eventId = requiredPositiveInteger(req.body.event_id, 'Event ID');
    const ticketCount = requiredPositiveInteger(req.body.ticket_count, 'Ticket count');
    const attendeeName = requiredString(req.body.attendee_name, 'Attendee name');
    const attendeeEmail = requiredEmail(req.body.attendee_email);
    const bookEventTransaction = db.transaction(() => {
      const event = db.prepare(`
        SELECT
          e.id,
          e.capacity,
          e.status,
          e.organiser_user_id,
          COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.ticket_count ELSE 0 END), 0) AS booked
        FROM events e
        LEFT JOIN bookings b ON b.event_id = e.id
        WHERE e.id = ?
        GROUP BY e.id
      `).get(eventId);

      if (!event) {
        const error = new Error('Event not found.');
        error.status = 404;
        throw error;
      }
      if (event.status !== 'published') {
        const error = new Error('This event is not open for booking.');
        error.status = 409;
        throw error;
      }
      if (event.organiser_user_id === req.user.id) {
        const error = new Error('You cannot book your own hosted event.');
        error.status = 403;
        throw error;
      }

      const seatsLeft = event.capacity - event.booked;

      if (seatsLeft < ticketCount) {
        const error = new Error(`Only ${seatsLeft} seat(s) are left for this event.`);
        error.status = 409;
        throw error;
      }

      const reference = generateReference();
      const result = db.prepare(`
        INSERT INTO bookings (
          user_id,
          event_id,
          ticket_count,
          attendee_name,
          attendee_email,
          booking_reference
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(req.user.id, eventId, ticketCount, attendeeName, attendeeEmail, reference);
      return result.lastInsertRowid;
    });

    const newBookingId = bookEventTransaction();
    const booking = db.prepare(`
      SELECT
        b.*,
        e.title,
        e.location,
        e.event_date,
        e.start_time,
        e.price
      FROM bookings b
      JOIN events e ON e.id = b.event_id
      WHERE b.id = ?
    `).get(newBookingId);
    res.status(201).json({ booking });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, (req, res) => {
  const booking = req.user.role === 'admin'
    ? db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id)
    : db.prepare('SELECT * FROM bookings WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!booking) {
    return res.status(404).json({ message: 'Booking not found.' });
  }
  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run('cancelled', req.params.id);
  res.status(204).send();
});

function generateReference() {
  return `EVH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export default router;