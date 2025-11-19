const fs = require('fs');
const path = require('path');
const { query, testConnection } = require('../db/connection');

/**
 * Migration runner
 * Handles running migrations up and down
 */

const MIGRATIONS_DIR = path.join(__dirname, '../db/migrations');

// Get all migration files sorted by name
const getMigrationFiles = () => {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort();
  return files;
};

// Get applied migrations from database
const getAppliedMigrations = async () => {
  try {
    // Ensure migrations table exists
    await query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const result = await query('SELECT name FROM migrations ORDER BY name');
    return result.rows.map(row => row.name);
  } catch (error) {
    console.error('Error getting applied migrations:', error);
    return [];
  }
};

// Apply a migration
const applyMigration = async (filename) => {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  try {
    console.log(`Applying migration: ${filename}`);
    
    // Start transaction
    await query('BEGIN');
    
    // Execute migration SQL
    await query(sql);
    
    // Record migration
    await query('INSERT INTO migrations (name) VALUES ($1)', [filename]);
    
    // Commit transaction
    await query('COMMIT');
    
    console.log(`✅ Migration applied: ${filename}`);
    return true;
  } catch (error) {
    await query('ROLLBACK');
    console.error(`❌ Error applying migration ${filename}:`, error.message);
    throw error;
  }
};

// Rollback a migration (for down migrations)
const rollbackMigration = async (filename) => {
  try {
    console.log(`Rolling back migration: ${filename}`);
    
    // Check if migration has a rollback file
    const rollbackPath = path.join(MIGRATIONS_DIR, filename.replace('.sql', '.down.sql'));
    
    if (fs.existsSync(rollbackPath)) {
      const sql = fs.readFileSync(rollbackPath, 'utf8');
      
      await query('BEGIN');
      await query(sql);
      await query('DELETE FROM migrations WHERE name = $1', [filename]);
      await query('COMMIT');
      
      console.log(`✅ Migration rolled back: ${filename}`);
    } else {
      console.warn(`⚠️  No rollback file found for ${filename}, removing from migrations table only`);
      await query('DELETE FROM migrations WHERE name = $1', [filename]);
    }
    
    return true;
  } catch (error) {
    await query('ROLLBACK');
    console.error(`❌ Error rolling back migration ${filename}:`, error.message);
    throw error;
  }
};

// Run migrations up
const migrateUp = async () => {
  console.log('🔄 Running migrations...\n');
  
  const applied = await getAppliedMigrations();
  const allFiles = getMigrationFiles();
  const pending = allFiles.filter(file => !applied.includes(file));
  
  if (pending.length === 0) {
    console.log('✅ No pending migrations');
    return;
  }
  
  console.log(`Found ${pending.length} pending migration(s)\n`);
  
  for (const file of pending) {
    await applyMigration(file);
  }
  
  console.log(`\n✅ All migrations applied successfully!`);
};

// Run migrations down (rollback last migration)
const migrateDown = async () => {
  console.log('🔄 Rolling back last migration...\n');
  
  const applied = await getAppliedMigrations();
  
  if (applied.length === 0) {
    console.log('✅ No migrations to rollback');
    return;
  }
  
  const lastMigration = applied[applied.length - 1];
  await rollbackMigration(lastMigration);
  
  console.log(`\n✅ Migration rolled back successfully!`);
};

// Main function
const main = async () => {
  const command = process.argv[2] || 'up';
  
  // Test database connection
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Cannot connect to database. Please check your configuration.');
    process.exit(1);
  }
  
  try {
    if (command === 'up') {
      await migrateUp();
    } else if (command === 'down') {
      await migrateDown();
    } else {
      console.error('Unknown command. Use "up" or "down"');
      process.exit(1);
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { migrateUp, migrateDown };

