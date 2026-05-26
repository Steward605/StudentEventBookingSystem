import express from 'express';
import { db } from '../db/database.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { requiredEmail, requiredPositiveInteger, requiredString } from '../utils/validators.js';

const router = express.Router();
router.get('/', requireAuth, (req, res) => {
  const allowedStatuses = ['confirmed', 'cancelled'];
  const status = allowedStatuses.includes(req.query.status) ? req.query.status : 'all';
  const shouldPaginate = req.query.page !== undefined || req.query.limit !== undefined;

  function parsePositiveInteger(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }

  const page = parsePositiveInteger(req.query.page, 1);
  const limit = Math.min(parsePositiveInteger(req.query.limit, 6), 24);
  const offset = (page - 1) * limit;
  let whereSql = 'WHERE b.user_id = ?';
  const params = [req.user.id];

  if (status !== 'all') {
    whereSql += ' AND b.status = ?';
    params.push(status);
  }

  const totalItems = db.prepare(`
    SELECT COUNT(*) AS count
    FROM bookings b
    ${whereSql}
  `).get(...params).count;

  const paginationSql = shouldPaginate ? 'LIMIT ? OFFSET ?' : '';
  const bookingParams = shouldPaginate ? [...params, limit, offset] : params;

  const bookings = db.prepare(`
    SELECT
      b.*,
      b.ticket_count AS seat_count,
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
    ${whereSql}
    ORDER BY e.event_date DESC, e.start_time DESC, b.created_at DESC
    ${paginationSql}
  `).all(...bookingParams);

  const summary = db.prepare(`
    SELECT
      COUNT(*) AS totalRecords,
      COALESCE(SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END), 0) AS confirmedRecords,
      COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0) AS cancelledRecords,
      COALESCE(SUM(CASE WHEN status = 'confirmed' THEN ticket_count ELSE 0 END), 0) AS confirmedSeats
    FROM bookings
    WHERE user_id = ?
  `).get(req.user.id);

  res.json({
    bookings,
    summary,
    pagination: {
      page,
      limit: shouldPaginate ? limit : Math.max(bookings.length, 1),
      totalItems,
      totalPages: shouldPaginate ? Math.max(Math.ceil(totalItems / limit), 1) : 1
    }
  });
});
router.get('/all', requireAuth, requireAdmin, (req, res) => {
  const allowedStatuses = ['confirmed', 'cancelled'];
  const status = allowedStatuses.includes(req.query.status) ? req.query.status : 'all';
  const search = req.query.search?.trim().toLowerCase() || '';
  const shouldPaginate = req.query.page !== undefined || req.query.limit !== undefined;

  function parsePositiveInteger(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }

  const page = parsePositiveInteger(req.query.page, 1);
  const limit = Math.min(parsePositiveInteger(req.query.limit, 8), 32);
  const offset = (page - 1) * limit;
  let whereSql = 'WHERE 1 = 1';
  const params = [];

  if (status !== 'all') {
    whereSql += ' AND b.status = ?';
    params.push(status);
  }

  if (search) {
    whereSql += `
      AND (
        LOWER(b.booking_reference) LIKE ?
        OR LOWER(b.status) LIKE ?
        OR LOWER(u.name) LIKE ?
        OR LOWER(u.email) LIKE ?
        OR LOWER(e.title) LIKE ?
        OR LOWER(e.category) LIKE ?
        OR LOWER(e.location) LIKE ?
        OR LOWER(e.city) LIKE ?
      )
    `;
    const wildcardSearch = `%${search}%`;
    params.push(wildcardSearch, wildcardSearch, wildcardSearch, wildcardSearch, wildcardSearch, wildcardSearch, wildcardSearch, wildcardSearch);
  }

  const totalItems = db.prepare(`
    SELECT COUNT(*) AS count
    FROM bookings b
    JOIN users u ON u.id = b.user_id
    JOIN events e ON e.id = b.event_id
    ${whereSql}
  `).get(...params).count;

  const paginationSql = shouldPaginate ? 'LIMIT ? OFFSET ?' : '';
  const bookingParams = shouldPaginate ? [...params, limit, offset] : params;
  const bookings = db.prepare(`
    SELECT
      b.*,
      b.ticket_count AS seat_count,
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
    ${whereSql}
    ORDER BY b.created_at DESC
    ${paginationSql}
  `).all(...bookingParams);

  const summary = db.prepare(`
    SELECT
      COUNT(*) AS totalRecords,
      COALESCE(SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END), 0) AS confirmedRecords,
      COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0) AS cancelledRecords,
      COALESCE(SUM(CASE WHEN status = 'confirmed' THEN ticket_count ELSE 0 END), 0) AS reservedSeats
    FROM bookings
  `).get();

  res.json({
    bookings,
    summary,
    pagination: {
      page,
      limit: shouldPaginate ? limit : Math.max(bookings.length, 1),
      totalItems,
      totalPages: shouldPaginate ? Math.max(Math.ceil(totalItems / limit), 1) : 1
    }
  });
});

router.delete('/:id/record', requireAuth, requireAdmin, (req, res) => {
  const booking = db.prepare('SELECT id, status FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) {
    return res.status(404).json({ message: 'Booking record not found.' });
  }
  if (booking.status !== 'cancelled') {
    return res.status(409).json({ message: 'Only cancelled booking records can be removed.' });
  }
  db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);
  res.status(204).send();
});


router.post('/', requireAuth, (req, res, next) => {
  if (req.user.role === 'admin') {
    return res.status(403).json({ message: 'Admin accounts cannot reserve seats for events.' });
  }
  try {
    const eventId = requiredPositiveInteger(req.body.event_id, 'Event ID');
    const seatCount = requiredPositiveInteger(req.body.seat_count ?? req.body.ticket_count, 'Seat count');
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

      if (seatsLeft < seatCount) {
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
      `).run(req.user.id, eventId, seatCount, attendeeName, attendeeEmail, reference);
      return result.lastInsertRowid;
    });

    const newBookingId = bookEventTransaction();
    const booking = db.prepare(`
      SELECT
        b.*,
        b.ticket_count AS seat_count,
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
