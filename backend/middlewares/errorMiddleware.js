const errorHandler = (err, req, res, next) => {
  console.error('Error Stack:', err.stack);
  console.error('Error Details:', {
    message: err.message,
    code: err.code,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Firebase Auth errors
  if (err.code && err.code.startsWith('auth/')) {
    const firebaseErrors = {
      'auth/id-token-expired': 'Token expired. Please sign in again.',
      'auth/invalid-id-token': 'Invalid token. Please sign in again.',
      'auth/user-not-found': 'User not found.',
      'auth/email-already-exists': 'Email already exists.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/user-disabled': 'User account has been disabled.',
      'auth/too-many-requests': 'Too many requests. Please try again later.'
    };

    return res.status(401).json({
      error: firebaseErrors[err.code] || 'Authentication error',
      code: err.code
    });
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    
    let message = `Duplicate field value: ${field}`;
    if (field === 'email') {
      message = 'This email is already registered. Please use a different email or sign in.';
    } else if (field === 'phone') {
      message = 'This phone number is already registered. Please use a different number.';
    }
    
    return res.status(400).json({ 
      error: message,
      field: field,
      value: value
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(el => ({
      field: el.path,
      message: el.message,
      value: el.value
    }));
    
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors
    });
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format',
      field: err.path,
      value: err.value
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token format'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired. Please sign in again.'
    });
  }

  // Network/connection errors
  if (err.code === 'ECONNREFUSED') {
    console.error('Database connection error:', err.message);
    return res.status(503).json({
      error: 'Service temporarily unavailable. Please try again later.'
    });
  }

  // Rate limiting errors
  if (err.status === 429) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: err.retryAfter || 60
    });
  }

  // Default to 500 server error
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'development' 
    ? err.message 
    : 'Something went wrong on our end. Please try again.';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  });
};

module.exports = errorHandler;