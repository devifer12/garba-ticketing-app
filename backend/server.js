const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db.js');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Enhanced CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://localhost:5174', // Alternative Vite port
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Apply CORS middleware first
app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    console.log('Headers:', req.headers);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log('Body:', req.body);
    }
    next();
  });
}

// Database connection
connectDB();

// Import middleware
const verifyFirebaseToken = require('./middlewares/authMiddleware');
const errorHandler = require('./middlewares/errorMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes'); // Clean Google auth routes
const ticketRoutes = require('./routes/ticketRoutes');

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Garba Ticketing App Backend is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    authentication: 'Google Authentication Only',
    endpoints: {
      auth: '/api/auth',
      tickets: '/api/tickets'
    }
  });
});

// API Routes - Simplified structure
app.use('/api/auth', authRoutes); // All authentication routes
app.use('/api/tickets', ticketRoutes); // Ticket routes (protected)

// Protected test route for debugging
app.get('/api/protected', verifyFirebaseToken, (req, res) => {
  res.json({ 
    message: 'Access granted to protected route',
    user: {
      uid: req.user.uid,
      email: req.user.email,
      name: req.user.name || 'No name provided'
    },
    timestamp: new Date().toISOString()
  });
});

// API status route
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    database: 'connected',
    firebase: 'initialized',
    environment: process.env.NODE_ENV || 'development',
    authentication: 'Google Authentication Only',
    cors: {
      origins: corsOptions.origin,
      methods: corsOptions.methods
    },
    routes: {
      auth: {
        signin: 'POST /api/auth/google-signin',
        profile: 'GET /api/auth/me',
        profileAlt: 'GET /api/auth/profile',
        updateProfile: 'PUT /api/auth/profile',
        deleteAccount: 'DELETE /api/auth/account',
        logout: 'POST /api/auth/logout'
      },
      tickets: {
        create: 'POST /api/tickets',
        myTickets: 'GET /api/tickets/my-tickets',
        getTicket: 'GET /api/tickets/:ticketId',
        cancelTicket: 'PATCH /api/tickets/:ticketId/cancel'
      },
      admin: {
        allTickets: 'GET /api/tickets/admin/all',
        updateTicketStatus: 'PATCH /api/tickets/admin/:ticketId/status'
      }
    }
  });
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /api/status',
      'POST /api/auth/google-signin',
      'GET /api/auth/me',
      'GET /api/auth/profile',
      'PUT /api/auth/profile',
      'POST /api/auth/logout',
      'POST /api/tickets',
      'GET /api/tickets/my-tickets',
      'GET /api/protected'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Handle CORS errors
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      error: 'CORS policy violation',
      message: 'Request blocked by CORS policy'
    });
  }
  
  // Handle other errors
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Global error handling middleware (should be last)
app.use(errorHandler);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running for garba-ticketing-app on http://localhost:${PORT}`);
  console.log(`🔐 Authentication: Google Sign-In Only`);
  console.log(`📱 Auth endpoints: http://localhost:${PORT}/api/auth`);
  console.log(`🎫 Ticket endpoints: http://localhost:${PORT}/api/tickets`);
  console.log(`💡 API status: http://localhost:${PORT}/api/status`);
  console.log(`🌐 CORS enabled for: ${corsOptions.origin.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;