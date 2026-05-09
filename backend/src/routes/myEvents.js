import express from 'express';
import { db } from '../db/database.js';
import { requireAuth, requireVerifiedStudent } from '../middleware/auth.js';
import { optionalNumber, requiredPositiveInteger, requiredString } from '../utils/validators.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireVerifiedStudent);
router.get('/', (req, res) => {
  const events = db.prepare(`
    SELECT
      e.*,
      v.name AS venue_name,
      v.campus AS venue_campus,
      v.building AS venue_building,
      v.room AS venue_room,
      v.venue_type,
      v.facilities AS venue_facilities,
      COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.ticket_count ELSE 0 END), 0) AS booked_tickets,
      e.capacity - COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.ticket_count ELSE 0 END), 0) AS seats_left
    FROM events e
    LEFT JOIN venues v ON v.id = e.venue_id
    LEFT JOIN bookings b ON b.event_id = e.id
    WHERE e.organiser_user_id = ?
    GROUP BY e.id
    ORDER BY e.event_date ASC, e.start_time ASC
  `).all(req.user.id);
  res.json({ events });
});
router.get('/:id', (req, res) => {
  const event = db.prepare(`
    SELECT
      e.*,
      v.name AS venue_name,
      v.campus AS venue_campus,
      v.building AS venue_building,
      v.room AS venue_room,
      v.venue_type,
      v.facilities AS venue_facilities,
      v.capacity AS venue_capacity,
      v.accessibility_notes AS venue_accessibility_notes,
      COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.ticket_count ELSE 0 END), 0) AS booked_tickets,
      e.capacity - COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.ticket_count ELSE 0 END), 0) AS seats_left
    FROM events e
    LEFT JOIN venues v ON v.id = e.venue_id
    LEFT JOIN bookings b ON b.event_id = e.id
    WHERE e.id = ? AND e.organiser_user_id = ?
    GROUP BY e.id
  `).get(req.params.id, req.user.id);
  if (!event) {
    return res.status(404).json({ message: 'Event not found.' });
  }
  res.json({ event });
});
router.post('/', (req, res, next) => {
  try {
    const event = parseStudentEventPayload(req.body);
    const venue = getVenueOrThrow(event.venue_id);
    validateVenueCapacity(venue, event.capacity);
    validateVenueAvailability({
      venueId: event.venue_id,
      eventDate: event.event_date,
      startTime: event.start_time,
      endTime: event.end_time
    });
    const result = db.prepare(`
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      event.title,
      event.category,
      event.description,
      buildVenueLocation(venue),
      venue.city,
      event.event_date,
      event.start_time,
      event.end_time,
      event.capacity,
      event.price,
      event.image_url,
      req.user.name,
      event.accessibility_notes,
      req.user.id,
      event.venue_id,
      event.status,
      req.user.id
    );
    const created = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ event: created });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const existing = db.prepare(`
      SELECT
        e.*,
        COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.ticket_count ELSE 0 END), 0) AS booked_tickets
      FROM events e
      LEFT JOIN bookings b ON b.event_id = e.id
      WHERE e.id = ? AND e.organiser_user_id = ?
      GROUP BY e.id
    `).get(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ message: 'Event not found.' });
    }
    const event = parseStudentEventPayload(req.body);
    const venue = getVenueOrThrow(event.venue_id);
    validateVenueCapacity(venue, event.capacity);
    if (Number(existing.booked_tickets || 0) > event.capacity) {
      return res.status(409).json({
        message: `Capacity cannot be lower than the current confirmed ticket count (${existing.booked_tickets}).`
      });
    }
    validateVenueAvailability({
      venueId: event.venue_id,
      eventDate: event.event_date,
      startTime: event.start_time,
      endTime: event.end_time,
      currentEventId: existing.id
    });
    db.prepare(`
      UPDATE events
      SET
        title = ?,
        category = ?,
        description = ?,
        location = ?,
        city = ?,
        event_date = ?,
        start_time = ?,
        end_time = ?,
        capacity = ?,
        price = ?,
        image_url = ?,
        organiser = ?,
        accessibility_notes = ?,
        venue_id = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND organiser_user_id = ?
    `).run(event.title, event.category, event.description, buildVenueLocation(venue), venue.city, event.event_date, event.start_time, event.end_time, event.capacity, event.price, event.image_url, req.user.name, event.accessibility_notes, event.venue_id, event.status, req.params.id, req.user.id);
    const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
    res.json({ event: updated });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare(`
    SELECT id
    FROM events
    WHERE id = ? AND organiser_user_id = ?
  `).get(req.params.id, req.user.id);
  if (!existing) {
    return res.status(404).json({ message: 'Event not found.' });
  }
  db.prepare(`
    UPDATE events
    SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND organiser_user_id = ?
  `).run(req.params.id, req.user.id);
  res.status(204).send();
});

router.get('/:id/attendees', (req, res) => {
  const event = db.prepare(`
    SELECT id
    FROM events
    WHERE id = ? AND organiser_user_id = ?
  `).get(req.params.id, req.user.id);
  if (!event) {
    return res.status(404).json({ message: 'Event not found.' });
  }
  const attendees = db.prepare(`
    SELECT
      b.id,
      b.ticket_count,
      b.attendee_name,
      b.attendee_email,
      b.status,
      b.booking_reference,
      b.created_at,
      u.name AS account_name,
      u.email AS account_email
    FROM bookings b
    JOIN users u ON u.id = b.user_id
    WHERE b.event_id = ?
    ORDER BY datetime(b.created_at) DESC
  `).all(req.params.id);
  res.json({ attendees });
});

function parseStudentEventPayload(body) {
  const status = ['draft', 'published'].includes(body.status) ? body.status : 'draft';
  const event = {
    title: requiredString(body.title, 'Title'),
    category: requiredString(body.category, 'Category'),
    description: requiredString(body.description, 'Description'),
    venue_id: requiredPositiveInteger(body.venue_id, 'Venue'),
    event_date: requiredString(body.event_date, 'Event date'),
    start_time: requiredString(body.start_time, 'Start time'),
    end_time: requiredString(body.end_time, 'End time'),
    capacity: requiredPositiveInteger(body.capacity, 'Capacity'),
    price: optionalNumber(body.price, 0),
    image_url: body.image_url?.trim() || '',
    accessibility_notes: body.accessibility_notes?.trim() || 'No additional accessibility notes provided.',
    status
  };
  if (event.end_time <= event.start_time) {
    const error = new Error('End time must be after start time.');
    error.status = 400;
    throw error;
  }
  if (event.price < 0) {
    const error = new Error('Price cannot be negative.');
    error.status = 400;
    throw error;
  }
  return event;
}

function getVenueOrThrow(venueId) {
  const venue = db.prepare(`
    SELECT *
    FROM venues
    WHERE id = ? AND is_active = 1
  `).get(venueId);
  if (!venue) {
    const error = new Error('Selected venue is not available.');
    error.status = 404;
    throw error;
  }
  return venue;
}

function validateVenueCapacity(venue, eventCapacity) {
  if (eventCapacity > venue.capacity) {
    const error = new Error(`Capacity cannot exceed the selected venue capacity of ${venue.capacity}.`);
    error.status = 409;
    throw error;
  }
}

function validateVenueAvailability({ venueId, eventDate, startTime, endTime, currentEventId = null }) {
  const conflict = db.prepare(`
    SELECT
      id,
      title,
      start_time,
      end_time
    FROM events
    WHERE venue_id = ?
      AND event_date = ?
      AND status != 'cancelled'
      AND id != COALESCE(?, -1)
      AND NOT (end_time <= ? OR start_time >= ?)
    LIMIT 1
  `).get(venueId, eventDate, currentEventId, startTime, endTime);
  if (conflict) {
    const error = new Error(`Venue is already booked by "${conflict.title}" from ${conflict.start_time} to ${conflict.end_time}.`);
    error.status = 409;
    throw error;
  }
}

function buildVenueLocation(venue) {
  return `${venue.name}, ${venue.building} ${venue.room}`;
}

export default router;