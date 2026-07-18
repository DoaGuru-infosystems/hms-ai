const { getTenantPool } = require('../config/tenantDb');

/**
 * attachTenantDB - Express middleware to dynamically attach the correct
 * database connection pool to the request object (req.db) based on the
 * hospitalId found in the authenticated user's JWT token payload.
 */
const attachTenantDB = async (req, res, next) => {
  try {
    // Ensure the user has been authenticated by authMiddleware first
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated. Please log in.' });
    }

    // Super Admin routes might not need a tenant DB, they query the Master DB directly.
    // If the role is Super Admin, we can optionally bypass or set req.db to master pool.
    // But for safety, we'll explicitly handle Super Admin in their own routes.
    if (req.user.role === 'Super Admin') {
      return next(); // Let Super Admin controller handle its own DB connection (Master)
    }

    const hospitalId = req.user.hospitalId;
    if (!hospitalId) {
      return res.status(400).json({ error: 'No Hospital ID associated with this session. Access denied.' });
    }

    // Retrieve the dynamic connection pool for this specific tenant
    const pool = await getTenantPool(hospitalId);
    
    // Attach the connection pool to the request so subsequent controllers can use it
    req.db = pool;
    
    next();
  } catch (error) {
    console.error("Tenant Routing Error:", error.message);
    // Determine if it's a known error from our tenantDb.js (like suspended account)
    if (error.message.includes('suspended') || error.message.includes('denied') || error.message.includes('not found')) {
      return res.status(403).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to connect to the hospital database.' });
  }
};

module.exports = { attachTenantDB };
