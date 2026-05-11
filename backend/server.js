import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './src/routes/auth.js';
import eventRoutes from './src/routes/events.js';
import bookingRoutes from './src/routes/bookings.js';
import userRoutes from './src/routes/users.js';
import statsRoutes from './src/routes/stats.js';
import externalRoutes from './src/routes/external.js';
import venueRoutes from './src/routes/venues.js';
import myEventRoutes from './src/routes/myEvents.js';
import { initialiseDatabase } from './src/db/database.js';
import { notFound, errorHandler } from './src/middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

initialiseDatabase();

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://localhost,capacitor://localhost').split(',').map(origin => origin.trim()).filter(Boolean);
initialiseDatabase();
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked request from origin: ${origin}`));
  }
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Student Event Booking System API' });
});
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/external', externalRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/my-events', myEventRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Student Event Booking System API running on http://localhost:${PORT}`);
});