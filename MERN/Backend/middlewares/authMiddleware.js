/**
 * authMiddleware.js
 * JWT-based authentication and role-based access control middleware.
 * Phase 1 — MedBrainix HMS Security Hardening
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'medbainix_hms_secret_2026_xK9!qZ';

/**
 * protect — verifies JWT from Authorization header.
 * Falls back to legacy x-user-role / x-user-id headers for
 * backward compatibility with existing HMS modules.
 */
module.exports = {
  protect: (req, res, next) => {
    const authHeader = req.headers['authorization'];

    // ── JWT path (new standard) ──
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = {
          id:   decoded.id   || decoded.sub,
          role: decoded.role || 'Guest',
          name: decoded.name || 'Unknown',
        };
        return next();
      } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token. Please login again.' });
      }
    }

    // ── Legacy header path (backward-compatible with existing HMS modules) ──
    const userRole = req.headers['x-user-role'];
    const userId   = req.headers['x-user-id'];

    if (userRole && userId) {
      req.user = { id: userId, role: userRole, name: req.headers['x-user-name'] || 'User' };
      return next();
    }

    // ── No credentials ──
    return res.status(401).json({ error: 'Unauthorized. Please provide a valid session token.' });
  },

  /**
   * restrictTo — gates a route to specific roles.
   * Usage: router.post('/dispatch', protect, restrictTo('Administrator','Receptionist'), ctrl.createDispatch)
   */
  restrictTo: (...roles) => {
    return (req, res, next) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({
          error: `Access Denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user?.role || 'None'}`
        });
      }
      next();
    };
  },

  /**
   * signToken — helper used by authController to issue tokens on login.
   */
  signToken: (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    });
  }
};
