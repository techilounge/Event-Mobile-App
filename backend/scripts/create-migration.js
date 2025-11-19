const fs = require('fs');
const path = require('path');

/**
 * Script to create a new migration file
 * Usage: npm run migrate:create migration_name
 */

const MIGRATIONS_DIR = path.join(__dirname, '../db/migrations');

// Ensure migrations directory exists
if (!fs.existsSync(MIGRATIONS_DIR)) {
  fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
}

// Get migration name from command line
const migrationName = process.argv[2];

if (!migrationName) {
  console.error('❌ Please provide a migration name');
  console.log('Usage: npm run migrate:create migration_name');
  process.exit(1);
}

// Generate migration number (next available)
const existingMigrations = fs.readdirSync(MIGRATIONS_DIR)
  .filter(file => file.endsWith('.sql'))
  .map(file => parseInt(file.split('_')[0]))
  .filter(num => !isNaN(num))
  .sort((a, b) => b - a);

const nextNumber = existingMigrations.length > 0 
  ? String(existingMigrations[0] + 1).padStart(3, '0')
  : '001';

// Create migration filename
const sanitizedName = migrationName.toLowerCase().replace(/[^a-z0-9]/g, '_');
const filename = `${nextNumber}_${sanitizedName}.sql`;
const filePath = path.join(MIGRATIONS_DIR, filename);

// Migration template
const template = `-- Migration: ${sanitizedName}
-- Created: ${new Date().toISOString()}

-- Add your migration SQL here
-- Example:
-- CREATE TABLE IF NOT EXISTS example (
--   id SERIAL PRIMARY KEY,
--   name VARCHAR(255) NOT NULL,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
`;

// Create migration file
fs.writeFileSync(filePath, template);

console.log(`✅ Created migration: ${filename}`);
console.log(`📝 Edit the file at: ${filePath}`);

