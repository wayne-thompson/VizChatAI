import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Required for Neon serverless
neonConfig.webSocketConstructor = ws;

// Check for database URL
if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL environment variable');
  process.exit(1);
}

// Set up the database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// Run migrations
async function runMigrations() {
  try {
    console.log('Running migrations...');
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('Migrations completed successfully');
    await pool.end();
  } catch (error) {
    console.error('Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigrations();