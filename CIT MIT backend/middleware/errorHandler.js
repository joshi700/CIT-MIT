function errorHandler(err, req, res, next) {
  console.error('Server error:', err.message);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      code: err.code || 'SERVER_ERROR',
    },
  });
}

module.exports = errorHandler;
