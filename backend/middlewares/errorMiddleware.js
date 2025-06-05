const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ 
      error: `Duplicate field value: ${field}. Please use another value.`
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(el => el.message);
    return res.status(400).json({ error: `Invalid input: ${errors.join(', ')}` });
  }

  // Default to 500 server error
  res.status(500).json({ error: 'Something went wrong!' });
};

module.exports = errorHandler;