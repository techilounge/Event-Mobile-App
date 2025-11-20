const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { authenticateToken, authenticateRefreshToken } = require('../middleware/auth');
const db = require('../db/adapter');
const USE_FIREBASE = process.env.USE_FIREBASE === 'true';
const firebaseConfig = require('../config/firebase');

const router = express.Router();

// Helper function to generate tokens
const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role || 'attendee', // Default role
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

  return { accessToken, refreshToken };
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('role')
      .optional()
      .isIn(['attendee', 'organizer', 'sponsor'])
      .withMessage('Role must be one of: attendee, organizer, sponsor'),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { email, password, name, role = 'attendee' } = req.body;

      // Check if user already exists
      const existingUser = await db.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          error: 'User already exists',
          message: 'An account with this email already exists.',
        });
      }

      // If using Firebase, create user in Firebase Auth first
      let firebaseUid = null;
      if (USE_FIREBASE) {
        try {
          const firebaseUser = await firebaseConfig.auth.createUser({
            email,
            password,
            displayName: name,
          });
          firebaseUid = firebaseUser.uid;
        } catch (firebaseError) {
          if (firebaseError.code === 'auth/email-already-exists') {
            return res.status(409).json({
              error: 'User already exists',
              message: 'An account with this email already exists in Firebase.',
            });
          }
          // If auth is not initialized (e.g. bad config), this will throw.
          // We should catch it and log it, but maybe fail the registration?
          console.error('Firebase creation error:', firebaseError);
          throw firebaseError;
        }
      }

      // Hash password (for non-Firebase or backup)
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user in database
      const newUser = await db.createUser({
        id: firebaseUid, // Use Firebase UID if available
        email,
        password: hashedPassword,
        name,
        role,
      });

      // Generate tokens (JWT for non-Firebase, or return Firebase token info)
      const { accessToken, refreshToken } = generateTokens(newUser);

      // Remove password from response
      const { password: _, ...userResponse } = newUser;

      res.status(201).json({
        message: 'User registered successfully',
        user: userResponse,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to register user. Please try again later.',
      });
    }
  }
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get tokens
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      // If using Firebase, verify with Firebase Auth
      if (USE_FIREBASE) {
        try {
          // Check if auth is working by accessing it (will throw if init fails)
          const authInstance = firebaseConfig.auth;

          // Note: Firebase Admin SDK doesn't have a direct password verification method
          // The mobile app should handle Firebase Auth login and send the ID token
          // This endpoint can be used for server-side verification if needed
          return res.status(400).json({
            error: 'Use Firebase Auth',
            message: 'Please use Firebase Authentication from the mobile app. Send the Firebase ID token to verify the user.',
          });
        } catch (error) {
          // If init failed, fall through to local auth or return error?
          // For now, return error to be safe
          console.error('Firebase init check failed:', error);
          return res.status(500).json({
            error: 'Configuration Error',
            message: 'Firebase configuration is invalid on the server.',
          });
        }
      }

      // Find user by email (non-Firebase mode)
      const user = await db.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect.',
        });
      }

      // Check if user has a password
      if (!user.password) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Please reset your password or contact support.',
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect.',
        });
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user);

      // Update last login
      await db.updateUserLastLogin(user.id);

      // Remove password from response
      const { password: _, ...userResponse } = user;

      res.json({
        message: 'Login successful',
        user: userResponse,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to login. Please try again later.',
      });
    }
  }
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public (but requires valid refresh token)
 */
router.post(
  '/refresh',
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required'),
  ],
  authenticateRefreshToken,
  async (req, res) => {
    try {
      const user = await db.getUserById(req.user.id);

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User associated with this token no longer exists.',
        });
      }

      // Generate new tokens
      const { accessToken, refreshToken } = generateTokens(user);

      res.json({
        message: 'Token refreshed successfully',
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to refresh token. Please try again later.',
      });
    }
  }
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client should delete tokens)
 * @access  Public
 */
router.post('/logout', (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // You could implement token blacklisting here if needed
  res.json({
    message: 'Logout successful',
    note: 'Please delete the tokens on the client side.',
  });
});

/**
 * @route   POST /api/auth/verify-firebase-token
 * @desc    Verify Firebase ID token and get user info
 * @access  Public (but requires valid Firebase token)
 */
/**
 * @route   POST /api/auth/verify-firebase-token
 * @desc    Verify Firebase ID token and get user info
 * @access  Public (but requires valid Firebase token)
 */
if (USE_FIREBASE) {
  router.post(
    '/verify-firebase-token',
    [
      body('idToken')
        .notEmpty()
        .withMessage('Firebase ID token is required'),
    ],
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            error: 'Validation failed',
            errors: errors.array(),
          });
        }

        const { idToken } = req.body;

        // Verify the Firebase ID token
        // Access auth lazily
        const decodedToken = await firebaseConfig.auth.verifyIdToken(idToken);

        // Get or create user in Firestore
        let userData = await db.getUserById(decodedToken.uid);

        if (!userData) {
          // Create user in Firestore from Firebase Auth data
          const firebaseUser = await firebaseConfig.auth.getUser(decodedToken.uid);
          userData = await db.createUser({
            id: decodedToken.uid, // Use Firebase UID as document ID
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            role: 'attendee',
          });
        }

        // Remove password from response
        const { password, ...userResponse } = userData;

        res.json({
          message: 'Token verified successfully',
          user: userResponse,
          firebaseUid: decodedToken.uid,
        });
      } catch (error) {
        console.error('Firebase token verification error:', error);
        res.status(401).json({
          error: 'Invalid token',
          message: 'The provided Firebase ID token is invalid or expired.',
        });
      }
    }
  );
}

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found.',
      });
    }

    // Remove password from response
    const { password: _, ...userResponse } = user;

    res.json({
      user: userResponse,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get user information.',
    });
  }
});

module.exports = router;

