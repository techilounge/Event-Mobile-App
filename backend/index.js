// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const { authenticateToken, requireRole } = require('./middleware/auth');
const { verifyFirebaseToken } = require('./middleware/firebaseAuth');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/uploads');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const db = require('./db/adapter');
const USE_FIREBASE = process.env.USE_FIREBASE === 'true';
const {
  validateUser,
  validateUserUpdate,
  validateEvent,
  validateAnnouncement,
  validateCommunityPost,
  validateId,
  validatePagination,
  sanitizeInput,
} = require('./middleware/validation');
const {
  generalLimiter,
  authLimiter,
  uploadLimiter,
} = require('./middleware/rateLimiter');

const app = express();
const port = process.env.PORT || 3000;

// Ultra-early logging to debug 502s
app.use((req, res, next) => {
  console.log(`⚡ INCOMING REQUEST: ${req.method} ${req.path}`);
  next();
});

// Security headers with helmet
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API
  crossOriginEmbedderPolicy: false,
}));

// Request logging
app.use(morgan('combined'));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : '*',
  credentials: true,
};

app.use(cors(corsOptions));

// Request size limits
const MAX_REQUEST_SIZE = process.env.MAX_REQUEST_SIZE || '10mb';
app.use(bodyParser.json({ limit: MAX_REQUEST_SIZE }));
app.use(bodyParser.urlencoded({ extended: true, limit: MAX_REQUEST_SIZE }));

// Apply general rate limiting to all routes
app.use('/api', generalLimiter);

// Sanitize input to prevent XSS attacks
app.use(sanitizeInput);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Initialize Firebase if enabled
// REMOVED startup initialization to prevent potential crashes
// if (USE_FIREBASE) {
//   try {
//     require('./config/firebase').initializeFirebase();
//     console.log('🔥 Firebase initialized');
//   } catch (error) {
//     console.error('⚠️  Firebase initialization failed:', error.message);
//     console.log('⚠️  Continuing without Firebase...');
//   }
// }

// Heartbeat to check if process is alive
setInterval(() => {
  const memoryUsage = process.memoryUsage();
  console.log(`💓 Heartbeat - RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB - Heap: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`);
}, 5000);

// Health check endpoint
app.get('/', async (req, res) => {
  const dbType = USE_FIREBASE ? 'Firebase Firestore' : (process.env.USE_DATABASE === 'true' ? 'PostgreSQL' : 'JSON file');
  res.json({
    message: 'Backend server is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: dbType,
    firebase: USE_FIREBASE ? 'enabled' : 'disabled',
  });
});

// Firebase Connectivity Test
app.get('/api/test-firebase', async (req, res) => {
  if (!USE_FIREBASE) {
    return res.status(400).json({ error: 'Firebase is disabled' });
  }
  try {
    console.log('🧪 Testing Firebase connectivity...');
    const db = require('./config/firebase').db;
    // Try to list collections or just get a dummy doc
    const collections = await db.listCollections();
    const collectionIds = collections.map(col => col.id);

    console.log('✅ Firebase connected. Collections:', collectionIds);
    res.json({
      status: 'success',
      message: 'Firebase is connected',
      collections: collectionIds
    });
  } catch (error) {
    console.error('❌ Firebase test failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Firebase connection failed',
      error: error.message,
      stack: error.stack
    });
  }
});

// Authentication routes (public) - with strict rate limiting
app.use('/api/auth', authLimiter);
app.use('/api/auth', authRoutes);

// File upload routes (protected) - with upload rate limiting
app.use('/api/uploads', uploadRoutes);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Users routes (protected)
// Use Firebase auth if enabled, otherwise use JWT
const authMiddleware = USE_FIREBASE ? verifyFirebaseToken : authenticateToken;

app.get('/api/users', authMiddleware, validatePagination, async (req, res) => {
  try {
    const users = await db.getUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users/:id', authMiddleware, validateId, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await db.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Users can only view their own profile unless they're an organizer
    const userIdToCompare = USE_FIREBASE ? req.user.uid : parseInt(req.user.id);
    const targetUserId = USE_FIREBASE ? userId : parseInt(userId);

    if (userIdToCompare !== targetUserId && req.user.role !== 'organizer') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Remove password from response
    const { password, ...userResponse } = user;
    res.json(userResponse);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Note: User registration is handled in /api/auth/register
// This endpoint is kept for backward compatibility but should be removed
app.post('/api/users', authMiddleware, requireRole('organizer'), validateUser, async (req, res) => {
  try {
    const newUser = await db.createUser(req.body);
    const { password, ...userResponse } = newUser;
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/users/:id', authMiddleware, validateId, validateUserUpdate, async (req, res) => {
  try {
    const userId = req.params.id;

    // Users can only update their own profile unless they're an organizer
    const userIdToCompare = USE_FIREBASE ? req.user.uid : parseInt(req.user.id);
    const targetUserId = USE_FIREBASE ? userId : parseInt(userId);

    if (userIdToCompare !== targetUserId && req.user.role !== 'organizer') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updatedUser = await db.updateUser(userId, req.body);

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...userResponse } = updatedUser;
    res.json(userResponse);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/users/:id', authMiddleware, requireRole('organizer'), validateId, async (req, res) => {
  try {
    const userId = req.params.id;
    const deleted = await db.deleteUser(userId);

    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Events routes
app.get('/api/events', authMiddleware, validatePagination, async (req, res) => {
  try {
    const events = await db.getEvents();
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/events/:id', authMiddleware, validateId, async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await db.getEventById(eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/events', authMiddleware, requireRole('organizer'), validateEvent, async (req, res) => {
  try {
    const userId = USE_FIREBASE ? req.user.uid : req.user.id;
    const newEvent = await db.createEvent({
      ...req.body,
      createdBy: userId,
    });
    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/events/:id', authMiddleware, requireRole('organizer'), validateId, validateEvent, async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await db.getEventById(eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Only allow organizer who created the event to update it
    const userId = USE_FIREBASE ? req.user.uid : req.user.id;
    if (event.createdBy !== userId && req.user.role !== 'organizer') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updatedEvent = await db.updateEvent(eventId, req.body);
    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/events/:id', authMiddleware, requireRole('organizer'), validateId, async (req, res) => {
  try {
    const eventId = req.params.id;
    const deleted = await db.deleteEvent(eventId);

    if (!deleted) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Announcements routes
app.get('/api/announcements', authMiddleware, validatePagination, async (req, res) => {
  try {
    const announcements = await db.getAnnouncements();
    res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/announcements/:id', authMiddleware, validateId, async (req, res) => {
  try {
    const announcementId = req.params.id;
    const announcement = await db.getAnnouncementById(announcementId);

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json(announcement);
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/announcements', authMiddleware, requireRole('organizer'), validateAnnouncement, async (req, res) => {
  try {
    const userId = USE_FIREBASE ? req.user.uid : req.user.id;
    const newAnnouncement = await db.createAnnouncement({
      ...req.body,
      createdBy: userId,
    });
    res.status(201).json(newAnnouncement);
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/announcements/:id', authMiddleware, requireRole('organizer'), validateId, validateAnnouncement, async (req, res) => {
  try {
    const announcementId = req.params.id;
    const updatedAnnouncement = await db.updateAnnouncement(announcementId, req.body);

    if (!updatedAnnouncement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json(updatedAnnouncement);
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/announcements/:id', authMiddleware, requireRole('organizer'), validateId, async (req, res) => {
  try {
    const announcementId = req.params.id;
    const deleted = await db.deleteAnnouncement(announcementId);

    if (!deleted) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Community Posts routes
app.get('/api/community_posts', authMiddleware, validatePagination, async (req, res) => {
  try {
    const posts = await db.getCommunityPosts();
    res.json(posts);
  } catch (error) {
    console.error('Error fetching community posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/community_posts/:id', authMiddleware, validateId, async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await db.getCommunityPostById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/community_posts', authMiddleware, validateCommunityPost, async (req, res) => {
  try {
    const userId = USE_FIREBASE ? req.user.uid : req.user.id;
    const newPost = await db.createCommunityPost({
      ...req.body,
      createdBy: userId,
    });
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/community_posts/:id', authMiddleware, validateId, validateCommunityPost, async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await db.getCommunityPostById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Users can only update their own posts unless they're an organizer
    const userId = USE_FIREBASE ? req.user.uid : req.user.id;
    if (post.createdBy !== userId && req.user.role !== 'organizer') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updatedPost = await db.updateCommunityPost(postId, req.body);
    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/community_posts/:id', authMiddleware, validateId, async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await db.getCommunityPostById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Users can only delete their own posts unless they're an organizer
    const userId = USE_FIREBASE ? req.user.uid : req.user.id;
    if (post.createdBy !== userId && req.user.role !== 'organizer') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const deleted = await db.deleteCommunityPost(postId);
    if (!deleted) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${port} (0.0.0.0)`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);

  if (USE_FIREBASE) {
    console.log(`🔥 Firebase enabled`);
    console.log(`📦 Database: Firestore`);
  } else if (process.env.USE_DATABASE === 'true') {
    console.log(`🔐 JWT Authentication enabled`);
    console.log(`📦 Database: PostgreSQL`);
  } else {
    console.log(`🔐 JWT Authentication enabled`);
    console.log(`📦 Database: JSON file`);
  }

  if (!USE_FIREBASE && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production-min-32-characters')) {
    console.warn('⚠️  WARNING: Using default JWT_SECRET. Change this in production!');
  }
});

// Global crash handlers
process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION:', error);
  // Don't exit immediately, let the logger finish
  // process.exit(1); 
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION:', reason);
});
