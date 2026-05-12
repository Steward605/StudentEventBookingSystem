import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is missing. Create backend/.env from backend/.env.example and set JWT_SECRET.');
}

const publicUserColumns = `
  id,
  name,
  email,
  role,
  campus,
  interests,
  verification_status
`;

export function createToken(user) {
  const expiresIn = user.role === 'admin' ? '15m' : '8h';
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      verification_status: user.verification_status
    },
    JWT_SECRET,
    { expiresIn }
  );
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication token is required.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare(`SELECT ${publicUserColumns} FROM users WHERE id = ?`).get(payload.id);

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired authentication token.' });
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare(`SELECT ${publicUserColumns} FROM users WHERE id = ?`).get(payload.id);

    if (user) {
      req.user = user;
    }
  } catch {
    req.user = null;
  }

  next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin permission is required.' });
  }

  next();
}

export function requireStudent(req, res, next) {
  if (req.user?.role !== 'student') {
    return res.status(403).json({ message: 'Student permission is required.' });
  }

  next();
}

export function requireVerifiedStudent(req, res, next) {
  if (req.user?.role !== 'student') {
    return res.status(403).json({ message: 'Only student accounts can use organiser tools.' });
  }

  if (req.user?.verification_status !== 'verified') {
    return res.status(403).json({ message: 'Your student account must be verified before hosting events.' });
  }

  next();
}