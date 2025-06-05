const express = require('express');
const { connectDB } = require('./config/db.js'); // Using your existing file
const app = express();
const verifyFirebaseToken = require('./middlewares/authMiddleware');


// Middleware
app.use(express.json());

// Database connection
connectDB(); // This calls your updated db.js

// Import routes (after DB connection)
const userRoutes = require('./routes/userRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const errorHandler = require('./middlewares/errorMiddleware');
const authRoutes = require('./routes/authRoutes');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use(errorHandler);
app.use('/api/auth', authRoutes);

// Add after connectDB() in server.js
const User = require('./models/User');

const Ticket = require('./models/Tickets');

// Add a protected test route
app.get('/api/protected', verifyFirebaseToken, (req, res) => {
  res.json({ 
    message: 'Access granted',
    user: req.user 
  });
});

// Test route
app.get('/', (req, res) => {
  res.send('Garba Ticketing App Backend is running!');
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running for garba-ticketing-app on http://localhost:${PORT}`);
});