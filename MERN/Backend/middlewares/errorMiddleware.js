/**
 * Centralized global error handling middleware.
 * Intercepts uncaught exceptions and formats standard JSON responses.
 */
module.exports = (err, req, res, next) => {
  console.error('🔥 [Backend Runtime Error]:', err.stack || err.message);
  
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
