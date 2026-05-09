import express from 'express';
import { db } from '../db/database.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/overview', requireAuth, (req, res) => {
  const userBookings = db.prepare(`
    SELECT COUNT(*) AS count,
      COALESCE(SUM(ticket_count), 0) AS tickets
    FROM bookings
    WHERE user_id = ? AND status = 'confirmed'
  `).get(req.user.id);

  const upcoming = db.prepare(`
    SELECT COUNT(*) AS count
    FROM bookings b
    JOIN events e ON e.id = b.event_id
    WHERE b.user_id = ? AND b.status = 'confirmed' AND e.event_date >= date('now')
  `).get(req.user.id);

  const totalEvents = db.prepare('SELECT COUNT(*) AS count FROM events').get();

  res.json({
    stats: {
      myBookings: userBookings.count,
      myTickets: userBookings.tickets,
      upcomingEvents: upcoming.count,
      totalEvents: totalEvents.count
    }
  });
});

router.get('/admin-overview', requireAuth, requireAdmin, (req, res) => {
  const eventStats = db.prepare(`
    SELECT
      COUNT(*) AS totalEvents,
      COALESCE(SUM(CASE WHEN seats_left <= 0 THEN 1 ELSE 0 END), 0) AS soldOutEvents,
      COALESCE(SUM(capacity), 0) AS totalCapacity
    FROM (
      SELECT
        e.id,
        e.capacity,
        e.capacity - COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.ticket_count ELSE 0 END), 0) AS seats_left
      FROM events e
      LEFT JOIN bookings b ON b.event_id = e.id
      GROUP BY e.id
    ) AS event_capacity_summary
  `).get();

  const bookingStats = db.prepare(`
    SELECT COUNT(*) AS totalBookings,
      COALESCE(SUM(ticket_count), 0) AS confirmedTickets
    FROM bookings
    WHERE status = 'confirmed'
  `).get();

  const totalStudents = db.prepare(`
    SELECT COUNT(*) AS count
    FROM users
    WHERE role = 'student'
  `).get();

  const recentBookings = db.prepare(`
    SELECT b.id, b.ticket_count, b.status, b.booking_reference, b.created_at,
      u.name AS student_name, u.email AS student_email,
      e.title AS event_title, e.event_date, e.start_time
    FROM bookings b
    JOIN users u ON u.id = b.user_id
    JOIN events e ON e.id = b.event_id
    ORDER BY b.created_at DESC
    LIMIT 5
  `).all();

  res.json({
    stats: {
      totalEvents: eventStats.totalEvents,
      soldOutEvents: eventStats.soldOutEvents || 0,
      totalCapacity: eventStats.totalCapacity,
      totalBookings: bookingStats.totalBookings,
      confirmedTickets: bookingStats.confirmedTickets,
      totalStudents: totalStudents.count
    },
    recentBookings
  });
});

export default router;