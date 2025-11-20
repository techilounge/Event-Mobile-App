// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
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
