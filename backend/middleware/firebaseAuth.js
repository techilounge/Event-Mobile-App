const { auth } = require('../config/firebase');
const db = require('../db/adapter');

/**
 * Middleware to verify Firebase ID tokens
 * Replaces JWT authentication when using Firebase
 */
const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access denied',
      message: 'No token provided. Please include a valid Firebase ID token in the Authorization header.'
    });
  }

  try {
    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);
    
    // Get user data from Firestore (if exists)
    let userData = null;
    try {
      userData = await db.getUserById(decodedToken.uid);
    } catch (dbError) {
      // User might not exist in Firestore yet - that's okay
      // They'll be created when they first interact with the app
      console.log('User not found in Firestore, will be created on first use');
    }
    
    // If user doesn't exist in Firestore, get basic info from Firebase Auth
    if (!userData) {
      try {
        const firebaseUser = await auth.getUser(decodedToken.uid);
        userData = {
          id: decodedToken.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          role: 'attendee', // Default role
        };
      } catch (error) {
        console.error('Error getting Firebase user:', error);
      }
    }
    
    // Attach user info to request object
    req.user = {
      id: decodedToken.uid,
      uid: decodedToken.uid,
      email: decodedToken.email || userData?.email,
      emailVerified: decodedToken.email_verified || false,
      name: userData?.name || decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
      role: userData?.role || decodedToken.role || 'attendee',
    };
    
    next();
  } catch (error) {
    console.error('Firebase token verification error:', error);
    return res.status(403).json({ 
      error: 'Invalid or expired token',
      message: 'Your session has expired or the token is invalid. Please login again.'
    });
  }
};

/**
 * Optional Firebase authentication
 * Doesn't fail if no token, but attaches user if token is valid
 */
const optionalFirebaseAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(); // Continue without authentication
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    const userData = await db.getUserById(decodedToken.uid);
    
    req.user = {
      id: decodedToken.uid,
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: userData?.role || 'attendee',
    };
  } catch (error) {
    // Continue without authentication for optional auth
  }
  
  next();
};

module.exports = {
  verifyFirebaseToken,
  optionalFirebaseAuth,
};

