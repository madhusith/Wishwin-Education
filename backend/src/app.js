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

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows cross-origin PDF viewing
}));

// CORS configuration
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: frontendUrl,
  credentials: true,
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads locally for dev mode
app.use('/uploads', express.static(require('path').join(__dirname, '../uploads')));

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

module.exports = app;
