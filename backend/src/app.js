const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/authRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const adminRoutes = require('./routes/adminRoutes');
const classRoutes = require('./routes/classRoutes');
const liveClassRoutes = require('./routes/liveClassRoutes');
const recordedLessonRoutes = require('./routes/recordedLessonRoutes');
const materialRoutes = require('./routes/materialRoutes');
const quizRoutes = require('./routes/quizRoutes');
const parentRoutes = require('./routes/parentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows cross-origin PDF viewing
  crossOriginEmbedderPolicy: false,
  xFrameOptions: false, // Disables X-Frame-Options to allow frontend PDF preview iframe
  contentSecurityPolicy: false, // Disables default CSP that blocks iframe embedding
}));

// CORS configuration (Allows local dev, Vercel preview & production domains)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5001',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost')
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive during staging/testing
  },
  credentials: true,
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads locally for dev mode
app.use(
  '/uploads',
  (req, res, next) => {
    res.removeHeader('X-Frame-Options');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(require('path').join(__dirname, '../uploads'))
);

// Health check endpoint (Step A3)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Wishwin LMS API',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/live-classes', liveClassRoutes);
app.use('/api/live', liveClassRoutes);
app.use('/api/recordings', recordedLessonRoutes);
app.use('/api/recorded-lessons', recordedLessonRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/learning-materials', materialRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/payments', paymentRoutes);

module.exports = app;
