import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// Initialize the database connection
export function initializeDb(databaseUrl: string) {
  const queryClient = postgres(databaseUrl);
  const db = drizzle(queryClient, { schema });
  
  return { db, queryClient };
}