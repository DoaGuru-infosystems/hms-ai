/**
 * Centralized request logger middleware.
 * Displays clean console outputs detailing HTTP method, URL path, response status code, and execution duration.
 */
module.exports = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const size = res.get('Content-Length') || 0;
    console.log(`[${new Date().toISOString()}] 📡 ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms) - ${size}B`);
  });
  next();
};
