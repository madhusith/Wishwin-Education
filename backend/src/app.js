const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: frontendUrl,
  credentials: true,
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (Section Step A3)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Wishwin LMS API',
  });
});

module.exports = app;
