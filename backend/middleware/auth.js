const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate JWT tokens
 * Verifies the access token from Authorization header
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access denied',
      message: 'No token provided. Please include a valid JWT token in the Authorization header.'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Invalid or expired token',
        message: 'Your session has expired or the token is invalid. Please login again.'
      });
    }

    // Attach user info to request object
    req.user = decoded;
    next();
  });
};

/**
 * Middleware to verify refresh token
 */
const authenticateRefreshToken = (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ 
      error: 'Access denied',
      message: 'No refresh token provided.'
    });
  }

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Invalid or expired refresh token',
        message: 'Your refresh token has expired. Please login again.'
      });
    }

    req.user = decoded;
    next();
  });
};

/**
 * Optional authentication - doesn't fail if no token, but attaches user if token is valid
 * Useful for endpoints that work both authenticated and unauthenticated
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(); // Continue without authentication
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (!err) {
      req.user = decoded;
    }
    // Continue regardless of token validity for optional auth
    next();
  });
};

/**
 * Middleware to check if user has required role
 * Use after authenticateToken
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'You do not have permission to access this resource.'
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authenticateRefreshToken,
  optionalAuth,
  requireRole
};

