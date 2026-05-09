import express from 'express';
import { db } from '../db/database.js';
import { optionalAuth, requireAdmin, requireAuth } from '../middleware/auth.js';
import { optionalNumber, requiredPositiveInteger, requiredString } from '../utils/validators.js';

const router = express.Router();

router.get('/', optionalAuth, (req, res) => {
  const search = req.query.search?.trim().toLowerCase() || '';
  const category = req.query.category?.trim() || '';
  const freeOnly = req.query.freeOnly === 'true';
  const includeAll = req.query.includeAll === 'true' && req.user?.role === 'admin';
  const allowedAvailabilityFilters = ['available', 'soldOut'];
  const availability = allowedAvailabilityFilters.includes(req.query.availability) ? req.query.availability : 'all';

  function parsePositiveInteger(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }

  const page = parsePositiveInteger(req.query.page, 1);
  const limit = Math.min(parsePositiveInteger(req.query.limit, 12), 48);
  const offset = (page - 1) * limit;
  const bookedTicketsSql = `COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.ticket_count ELSE 0 END), 0)`;
  const seatsLeftSql = `e.capacity - ${bookedTicketsSql}`;
  let fromWhereSql = `
    FROM events e
    LEFT JOIN bookings b ON b.event_id = e.id
    LEFT JOIN venues v ON v.id = e.venue_id
    WHERE 1 = 1
  `;
  const params = [];

  if (!includeAll) {
    fromWhereSql += ` AND e.status = 'published'`;
  }
  if (category) {
    fromWhereSql += ` AND e.category = ?`;
    params.push(category);
  }
  if (freeOnly) {
    fromWhereSql += ` AND e.price = 0`;
  }
  if (search) {
    fromWhereSql += `
      AND (
        LOWER(e.title) LIKE ?
        OR LOWER(e.description) LIKE ?
        OR LOWER(e.location) LIKE ?
        OR LOWER(e.city) LIKE ?
        OR LOWER(v.name) LIKE ?
      )
    `;
    const wildcardSearch = `%${search}%`;
    params.push(wildcardSearch, wildcardSearch, wildcardSearch, wildcardSearch, wildcardSearch);
  }

  const groupBySql = ` GROUP BY e.id`;
  let havingSql = '';

  if (availability === 'available') {
    havingSql = ` HAVING ${seatsLeftSql} > 0`;
  }

  if (availability === 'soldOut') {
    havingSql = ` HAVING ${seatsLeftSql} <= 0`;
  }

  const totalItems = db.prepare(`
    SELECT COUNT(*) AS count
    FROM (
      SELECT e.id
      ${fromWhereSql}
      ${groupBySql}
      ${havingSql}
    ) AS filtered_events
  `).get(...params).count;
  const events = db.prepare(`
    SELECT
      e.*,
      v.name AS venue_name,
      v.campus AS venue_campus,
      v.building AS venue_building,
      v.room AS venue_room,
      v.venue_type,
      v.facilities AS venue_facilities,
      ${bookedTicketsSql} AS booked_tickets,
      ${seatsLeftSql} AS seats_left
    ${fromWhereSql}
    ${groupBySql}
    ${havingSql}
    ORDER BY e.event_date ASC, e.start_time ASC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);
  const categoryRows = db.prepare(`
    SELECT DISTINCT category
    FROM events
    WHERE ${includeAll ? '1 = 1' : "status = 'published'"}
    ORDER BY category
  `).all();
  const categories = categoryRows.map(row => row.category);
  const summary = db.prepare(`
    SELECT
      COUNT(*) AS totalEvents,
      COALESCE(SUM(CASE WHEN seats_left > 0 THEN 1 ELSE 0 END), 0) AS availableEvents,
      COALESCE(SUM(CASE WHEN seats_left <= 0 THEN 1 ELSE 0 END), 0) AS soldOutEvents
    FROM (
      SELECT
        e.id,
        e.capacity - COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.ticket_count ELSE 0 END), 0) AS seats_left
      FROM events e
      LEFT JOIN bookings b ON b.event_id = e.id
      WHERE ${includeAll ? '1 = 1' : "e.status = 'published'"}
      GROUP BY e.id
    ) AS event_capacity_summary
  `).get();

  res.json({
    events,
    categories,
    summary: {
      totalEvents: summary.totalEvents,
      availableEvents: summary.availableEvents,
      soldOutEvents: summary.soldOutEvents,
      totalCategories: categories.length
    },
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.max(Math.ceil(totalItems / limit), 1)
    }
  });
});

router.get('/:id', optionalAuth, (req, res) => {
  const event = db.prepare(`
    SELECT
      e.*,
      v.name AS venue_name,
      v.campus AS venue_campus,
      v.building AS venue_building,
      v.room AS venue_room,
      v.venue_type,
      v.facilities AS venue_facilities,
      v.accessibility_notes AS venue_accessibility_notes,
      u.name AS organiser_student_name,
      u.email AS organiser_student_email,
      COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.ticket_count ELSE 0 END), 0) AS booked_tickets,
      e.capacity - COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.ticket_count ELSE 0 END), 0) AS seats_left
    FROM events e
    LEFT JOIN venues v ON v.id = e.venue_id
    LEFT JOIN users u ON u.id = e.organiser_user_id
    LEFT JOIN bookings b ON b.event_id = e.id
    WHERE e.id = ?
    GROUP BY e.id
  `).get(req.params.id);

  if (!event) {
    return res.status(404).json({ message: 'Event not found.' });
  }

  const canViewPrivateEvent =
    req.user?.role === 'admin' ||
    (req.user?.role === 'student' && event.organiser_user_id === req.user.id);

  if (event.status !== 'published' && !canViewPrivateEvent) {
    return res.status(404).json({ message: 'Event not found.' });
  }

  res.json({ event });
});

router.post('/', requireAuth, requireAdmin, (req, res, next) => {
  try {
    const event = parseEventPayload(req.body);

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
      event.location,
      event.city,
      event.event_date,
      event.start_time,
      event.end_time,
      event.capacity,
      event.price,
      event.image_url,
      event.organiser,
      event.accessibility_notes,
      req.user.id,
      event.venue_id,
      event.status,
      null
    );

    const created = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ event: created });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAuth, requireAdmin, (req, res, next) => {
  try {
    const existing = db.prepare('SELECT id FROM events WHERE id = ?').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    const event = parseEventPayload(req.body);

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
      WHERE id = ?
    `).run(
      event.title,
      event.category,
      event.description,
      event.location,
      event.city,
      event.event_date,
      event.start_time,
      event.end_time,
      event.capacity,
      event.price,
      event.image_url,
      event.organiser,
      event.accessibility_notes,
      event.venue_id,
      event.status,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);

    res.json({ event: updated });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  const result = db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ message: 'Event not found.' });
  }

  res.status(204).send();
});

function parseEventPayload(body) {
  const status = ['draft', 'published', 'cancelled'].includes(body.status) ? body.status : 'published';
  const venueId = body.venue_id ? Number.parseInt(body.venue_id, 10) : null;

  const event = {
    title: requiredString(body.title, 'Title'),
    category: requiredString(body.category, 'Category'),
    description: requiredString(body.description, 'Description'),
    location: requiredString(body.location, 'Location'),
    city: requiredString(body.city, 'City'),
    event_date: requiredString(body.event_date, 'Event date'),
    start_time: requiredString(body.start_time, 'Start time'),
    end_time: requiredString(body.end_time, 'End time'),
    capacity: requiredPositiveInteger(body.capacity, 'Capacity'),
    price: optionalNumber(body.price, 0),
    image_url: body.image_url?.trim() || '',
    organiser: requiredString(body.organiser, 'Organiser'),
    accessibility_notes: body.accessibility_notes?.trim() || 'No additional accessibility notes provided.',
    venue_id: Number.isInteger(venueId) && venueId > 0 ? venueId : null,
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

export default router;