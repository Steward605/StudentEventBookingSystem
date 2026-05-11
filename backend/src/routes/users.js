import express from 'express'
import bcrypt from 'bcryptjs'
import { db } from '../db/database.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'
import { requiredEmail, requiredString } from '../utils/validators.js'

const router = express.Router()

const adminUserSelect = `
  SELECT
    u.id,
    u.name,
    u.email,
    u.role,
    u.campus,
    u.interests,
    u.verification_status,
    u.created_at,
    COUNT(DISTINCT b.id) AS booking_count,
    COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.ticket_count ELSE 0 END), 0) AS confirmed_tickets,
    COUNT(DISTINCT e.id) AS hosted_event_count
  FROM users u
  LEFT JOIN bookings b ON b.user_id = u.id
  LEFT JOIN events e ON e.organiser_user_id = u.id
`

const adminUserGroupBy = `
  GROUP BY
    u.id,
    u.name,
    u.email,
    u.role,
    u.campus,
    u.interests,
    u.verification_status,
    u.created_at
`

function getAdminUserById(id) {
  return db
    .prepare(
      `
      ${adminUserSelect}
      WHERE u.id = ?
      ${adminUserGroupBy}
    `
    )
    .get(id)
}

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})

router.get('/all', requireAuth, requireAdmin, (req, res, next) => {
  try {
    const users = db
      .prepare(
        `
        ${adminUserSelect}
        ${adminUserGroupBy}
        ORDER BY datetime(u.created_at) DESC, u.name COLLATE NOCASE ASC
      `
      )
      .all()

    res.json({ users })
  } catch (error) {
    next(error)
  }
})

router.post('/', requireAuth, requireAdmin, (req, res, next) => {
  try {
    const name = requiredString(req.body.name, 'Name')
    const email = requiredEmail(req.body.email)
    const password = requiredString(req.body.password, 'Password')
    const role = req.body.role?.trim() || 'student'
    const campus = req.body.campus?.trim() || 'Hawthorn'
    const interests = req.body.interests?.trim() || ''

    const allowedRoles = ['student', 'admin']
    const allowedStatuses = ['pending', 'verified', 'rejected']

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid user role.' })
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must contain at least 8 characters.' })
    }

    const verificationStatus =
      role === 'admin' ? 'verified' : req.body.verification_status?.trim() || 'pending'

    if (!allowedStatuses.includes(verificationStatus)) {
      return res.status(400).json({ message: 'Invalid verification status.' })
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)

    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' })
    }

    const passwordHash = bcrypt.hashSync(password, 10)

    const result = db
      .prepare(
        `
        INSERT INTO users (
          name,
          email,
          password_hash,
          role,
          campus,
          interests,
          verification_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(name, email, passwordHash, role, campus, interests, verificationStatus)

    const user = getAdminUserById(result.lastInsertRowid)

    res.status(201).json({ user })
  } catch (error) {
    next(error)
  }
})

router.patch('/:id/verification', requireAuth, requireAdmin, (req, res) => {
  const allowedStatuses = ['pending', 'verified', 'rejected']
  const verificationStatus = req.body.verification_status

  if (!allowedStatuses.includes(verificationStatus)) {
    return res.status(400).json({ message: 'Invalid verification status.' })
  }

  const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(req.params.id)

  if (!user) {
    return res.status(404).json({ message: 'User not found.' })
  }

  if (user.role === 'admin') {
    return res.status(400).json({ message: 'Admin accounts are always treated as verified.' })
  }

  db.prepare('UPDATE users SET verification_status = ? WHERE id = ?').run(
    verificationStatus,
    req.params.id
  )

  const updated = getAdminUserById(req.params.id)

  res.json({ user: updated })
})

router.delete('/:id', requireAuth, requireAdmin, (req, res, next) => {
  try {
    const userId = Number(req.params.id)

    if (!Number.isInteger(userId)) {
      return res.status(400).json({ message: 'Invalid user ID.' })
    }

    if (userId === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own admin account.' })
    }

    const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }

    if (user.role === 'admin') {
      const adminCount = db.prepare('SELECT COUNT(*) AS count FROM users WHERE role = ?').get('admin').count

      if (adminCount <= 1) {
        return res.status(400).json({ message: 'At least one admin account must remain.' })
      }
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(userId)

    res.status(204).end()
  } catch (error) {
    next(error)
  }
})

router.put('/me', requireAuth, (req, res, next) => {
  try {
    const name = requiredString(req.body.name, 'Name')
    const email = requiredEmail(req.body.email)
    const campus = req.body.campus?.trim() || 'Hawthorn'
    const interests = req.body.interests?.trim() || ''

    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, req.user.id)

    if (existing) {
      return res.status(409).json({ message: 'This email is already used by another account.' })
    }

    db.prepare(
      `
      UPDATE users
      SET name = ?, email = ?, campus = ?, interests = ?
      WHERE id = ?
    `
    ).run(name, email, campus, interests, req.user.id)

    const user = db
      .prepare(
        `
        SELECT id, name, email, role, campus, interests, verification_status
        FROM users
        WHERE id = ?
      `
      )
      .get(req.user.id)

    res.json({ user })
  } catch (error) {
    next(error)
  }
})

export default router