# Database Migration Guide

## Overview

This guide covers setting up and using PostgreSQL database with migrations for the Event Mobile App backend.

## Prerequisites

- PostgreSQL installed and running
- Node.js and npm installed
- Database created (or create one)

## Installation

### 1. Install PostgreSQL

**Windows:**
- Download from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
- Or use Chocolatey: `choco install postgresql`

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE eventapp;

# Create user (optional)
CREATE USER eventapp_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE eventapp TO eventapp_user;

# Exit
\q
```

### 3. Install Dependencies

```bash
cd backend
npm install
```

This installs the `pg` package for PostgreSQL connectivity.

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Database Configuration
USE_DATABASE=true
DB_HOST=localhost
DB_PORT=5432
DB_NAME=eventapp
DB_USER=postgres
DB_PASSWORD=your_password
```

**Note:** If `USE_DATABASE` is not set to `true` or `DB_HOST` is not set, the system will fall back to JSON file storage.

## Running Migrations

### Run All Migrations

```bash
npm run migrate
# or
npm run migrate:up
```

This will:
1. Connect to the database
2. Create the `migrations` table if it doesn't exist
3. Run all pending migrations in order
4. Record applied migrations

### Rollback Last Migration

```bash
npm run migrate:down
```

This will rollback the last applied migration.

### Create New Migration

```bash
npm run migrate:create migration_name
```

Example:
```bash
npm run migrate:create add_user_preferences
```

This creates a new migration file: `006_add_user_preferences.sql`

## Migration Files

Migrations are stored in `backend/db/migrations/` and are numbered sequentially:

- `001_create_migrations_table.sql` - Creates migrations tracking table
- `002_create_users_table.sql` - Creates users table
- `003_create_events_table.sql` - Creates events table
- `004_create_announcements_table.sql` - Creates announcements table
- `005_create_community_posts_table.sql` - Creates community posts table

### Migration File Structure

```sql
-- Migration: migration_name
-- Created: 2024-01-01T00:00:00.000Z

-- Your SQL here
CREATE TABLE IF NOT EXISTS example (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'attendee',
  title VARCHAR(200),
  avatar TEXT,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Events Table

```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  start_time VARCHAR(50),
  end_time VARCHAR(50),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  location VARCHAR(200),
  image TEXT,
  category VARCHAR(50),
  capacity INTEGER,
  price DECIMAL(10, 2),
  status VARCHAR(20) DEFAULT 'draft',
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Announcements Table

```sql
CREATE TABLE announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  content TEXT,
  image TEXT,
  priority VARCHAR(20) DEFAULT 'medium',
  target_audience TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Community Posts Table

```sql
CREATE TABLE community_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  time VARCHAR(50),
  icon VARCHAR(50),
  user_avatar TEXT,
  user_name VARCHAR(100),
  tags TEXT[],
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Database Adapter

The system uses a database adapter (`backend/db/adapter.js`) that automatically switches between PostgreSQL and JSON file storage based on configuration.

### Using PostgreSQL

Set in `.env`:
```env
USE_DATABASE=true
DB_HOST=localhost
DB_NAME=eventapp
DB_USER=postgres
DB_PASSWORD=your_password
```

### Using JSON File (Fallback)

If database is not configured, the system automatically uses `db.json` file.

## Migration Best Practices

### 1. Always Use Transactions

Migrations are automatically wrapped in transactions. If a migration fails, it will be rolled back.

### 2. Use IF NOT EXISTS

Always use `IF NOT EXISTS` for table/column creation to make migrations idempotent:

```sql
CREATE TABLE IF NOT EXISTS example (...);
```

### 3. Use IF EXISTS for Drops

Always use `IF EXISTS` when dropping tables/columns:

```sql
DROP TABLE IF EXISTS example;
```

### 4. Test Migrations

Test migrations on a development database before applying to production.

### 5. Backup Before Migrations

Always backup your database before running migrations in production.

## Troubleshooting

### Connection Issues

**Error:** `Connection refused`
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify connection settings in `.env`
- Check firewall settings

**Error:** `password authentication failed`
- Verify `DB_USER` and `DB_PASSWORD` in `.env`
- Check PostgreSQL user permissions

### Migration Issues

**Error:** `relation already exists`
- Migration was partially applied
- Check `migrations` table: `SELECT * FROM migrations;`
- Manually fix or rollback

**Error:** `column does not exist`
- Migration order issue
- Check migration files are numbered correctly
- Verify all migrations are applied

### Database Lock Issues

If migrations fail due to locks:
```sql
-- Check for locks
SELECT * FROM pg_locks WHERE NOT granted;

-- Kill blocking queries (use with caution)
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE ...;
```

## Migrating from JSON to PostgreSQL

### Step 1: Run Migrations

```bash
npm run migrate
```

### Step 2: Migrate Data (Optional)

Create a data migration script to copy data from `db.json` to PostgreSQL:

```javascript
// scripts/migrate-data.js
const fs = require('fs');
const db = require('../db/adapter');

const jsonData = JSON.parse(fs.readFileSync('db.json', 'utf8'));

async function migrateData() {
  // Migrate users
  for (const user of jsonData.users) {
    await db.createUser(user);
  }
  
  // Migrate events
  for (const event of jsonData.events) {
    await db.createEvent(event);
  }
  
  // ... etc
}

migrateData();
```

### Step 3: Update Environment

Set `USE_DATABASE=true` in `.env`

### Step 4: Test

Test all endpoints to ensure they work with the database.

## Production Considerations

### 1. Connection Pooling

The connection pool is configured with:
- Max 20 connections
- 30 second idle timeout
- 2 second connection timeout

Adjust in `backend/db/connection.js` if needed.

### 2. Database Backups

Set up regular backups:
```bash
# Backup
pg_dump -U postgres eventapp > backup.sql

# Restore
psql -U postgres eventapp < backup.sql
```

### 3. Monitoring

Monitor:
- Connection pool usage
- Query performance
- Database size
- Migration status

### 4. Indexes

Indexes are created automatically for:
- Primary keys
- Foreign keys
- Frequently queried columns (email, role, status, etc.)

Add more indexes based on query patterns.

## Next Steps

1. ✅ Database migration system - **COMPLETED**
2. ⏳ Add database seeding script
3. ⏳ Add database backup automation
4. ⏳ Add query performance monitoring
5. ⏳ Add database connection health checks

## Useful Commands

```bash
# Connect to database
psql -U postgres -d eventapp

# List all tables
\dt

# Describe table
\d users

# View migrations
SELECT * FROM migrations ORDER BY applied_at;

# Check database size
SELECT pg_size_pretty(pg_database_size('eventapp'));

# View active connections
SELECT * FROM pg_stat_activity;
```

