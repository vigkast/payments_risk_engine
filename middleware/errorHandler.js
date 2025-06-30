// Error handling middleware
function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Handle Joi validation errors
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.details.map(detail => detail.message)
    });
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: [err.message]
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      details: [err.message]
    });
  }

  // Handle tenant not found errors
  if (err.message === 'Invalid tenant') {
    return res.status(404).json({
      error: 'Tenant not found',
      details: ['The specified tenant does not exist']
    });
  }

  // Default error response
  res.status(500).json({
    error: 'Internal server error',
    details: ['An unexpected error occurred']
  });
}

// 404 handler for undefined routes
function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Route not found',
    details: [`${req.method} ${req.path} is not a valid endpoint`]
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
}; 