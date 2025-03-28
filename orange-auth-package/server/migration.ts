import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// Run migrations
export async function runMigrations(databaseUrl: string, migrationFolder: string) {
  const sql = postgres(databaseUrl, { max: 1 });
  const db = drizzle(sql, { schema });
  
  try {
    console.log('Running migrations...');
    await migrate(db, { migrationsFolder: migrationFolder });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Example usage:
// runMigrations(process.env.DATABASE_URL!, './migrations');