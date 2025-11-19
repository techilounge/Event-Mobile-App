# Database Migration - Quick Start

## Quick Setup

### 1. Install PostgreSQL

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Download from [postgresql.org](https://www.postgresql.org/download/)

**Linux:**
```bash
sudo apt-get install postgresql
sudo systemctl start postgresql
```

### 2. Create Database

```bash
psql -U postgres
CREATE DATABASE eventapp;
\q
```

### 3. Configure Environment

Add to `.env`:
```env
USE_DATABASE=true
DB_HOST=localhost
DB_PORT=5432
DB_NAME=eventapp
DB_USER=postgres
DB_PASSWORD=your_password
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Migrations

```bash
npm run migrate
```

You should see:
```
✅ Database connection successful
🔄 Running migrations...
✅ Migration applied: 001_create_migrations_table.sql
✅ Migration applied: 002_create_users_table.sql
✅ Migration applied: 003_create_events_table.sql
✅ Migration applied: 004_create_announcements_table.sql
✅ Migration applied: 005_create_community_posts_table.sql
✅ All migrations applied successfully!
```

## Using the Database

The system automatically uses PostgreSQL when configured, or falls back to JSON file if not.

### Check Current Mode

The adapter checks:
- `USE_DATABASE=true` in `.env`, OR
- `DB_HOST` is set

If either is true, it uses PostgreSQL. Otherwise, it uses JSON file.

## Migration Commands

```bash
# Run all pending migrations
npm run migrate
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Create new migration
npm run migrate:create migration_name
```

## Database Structure

- **Users**: Authentication and user profiles
- **Events**: Event information
- **Announcements**: Event announcements
- **Community Posts**: Community board posts
- **Migrations**: Tracks applied migrations

## Next Steps

1. ✅ Migration system - **DONE**
2. ⏳ Update endpoints to use database adapter (see `README_DATABASE.md`)
3. ⏳ Test all endpoints with database
4. ⏳ Migrate existing data from JSON (if needed)

## Troubleshooting

**Can't connect?**
- Check PostgreSQL is running
- Verify `.env` settings
- Test connection: `psql -U postgres -d eventapp`

**Migration fails?**
- Check PostgreSQL logs
- Verify database exists
- Check user permissions

See `README_DATABASE.md` for detailed documentation.

