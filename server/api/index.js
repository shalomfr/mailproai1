const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('../src/config/database');
const authRoutes = require('../src/routes/auth');
const accountRoutes = require('../src/routes/accounts');
const providerRoutes = require('../src/routes/providers');
const { errorHandler, notFound } = require('../src/middleware/errorHandler');

const app = express();

// Connect to Database
connectDB();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-vercel-domain.vercel.app']
    : ['http://localhost:3000'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// General Middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'שרת פועל תקין',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/providers', providerRoutes);

// Root endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'ברוכים הבאים למנהל חשבונות המייל',
    version: '1.0.0'
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// 404 Handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Export for Vercel
module.exports = app; 