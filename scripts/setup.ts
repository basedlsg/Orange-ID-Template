/**
 * Orange Auth Template - Setup Script
 * 
 * This script provides a comprehensive setup process for the Orange Auth Template,
 * handling both SQLite and PostgreSQL database configurations.
 * 
 * Usage:
 *   npx tsx scripts/setup.ts
 * 
 * Features:
 *   - Detects environment configuration (SQLite vs PostgreSQL)
 *   - Creates database tables
 *   - Validates database connectivity
 *   - Provides clear success/error feedback
 *   - The first user to log in will automatically become admin
 */

import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import Database from 'better-sqlite3';
import postgres from 'postgres';
import chalk from 'chalk';

// Load environment variables
config();

// Constants
const SQLITE_DB_PATH = path.join(process.cwd(), 'data', 'orange_auth.db');

// Determine database type
const shouldUseSqlite = (): boolean => {
  // Priority 1: Environment variable USE_SQLITE=true
  if (process.env.USE_SQLITE === 'true') {
    return true;
  }
  
  // Priority 2: If no DATABASE_URL is present, default to SQLite
  if (!process.env.DATABASE_URL) {
    return true;
  }
  
  // Otherwise, use PostgreSQL
  return false;
};

// Terminal formatting helpers
const log = {
  info: (msg: string) => console.log(chalk.blue(`ℹ ${msg}`)),
  success: (msg: string) => console.log(chalk.green(`✓ ${msg}`)),
  warning: (msg: string) => console.log(chalk.yellow(`⚠ ${msg}`)),
  error: (msg: string) => console.log(chalk.red(`✗ ${msg}`)),
  title: (msg: string) => console.log(chalk.bold.cyan(`\n${msg}\n${'-'.repeat(msg.length)}`))
};

// Setup SQLite database
async function setupSqlite() {
  log.title('Setting up SQLite Database');
  
  try {
    // Ensure data directory exists
    const dbDir = path.dirname(SQLITE_DB_PATH);
    if (!fs.existsSync(dbDir)) {
      log.info(`Creating data directory at ${dbDir}`);
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    // Open database connection
    log.info(`Opening SQLite database at ${SQLITE_DB_PATH}`);
    const db = new Database(SQLITE_DB_PATH);
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Create tables
    log.info('Creating database tables if they don\'t exist...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orange_id TEXT UNIQUE NOT NULL,
        username TEXT NOT NULL,
        email TEXT,
        role TEXT DEFAULT 'user',
        is_admin BOOLEAN DEFAULT 0,
        created_at TEXT NOT NULL
      )
    `);
    
    // Check if there are any users
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    log.info(`Found ${userCount.count} existing users in the database`);
    
    // No sample users are created - the first user to log in will be the admin
    log.info('The first user to log in will automatically become the admin');
    log.info('Additional users will be regular users with non-admin privileges');
    
    // Verify data
    const users = db.prepare('SELECT * FROM users').all();
    log.success(`Database setup complete. ${users.length} users in database.`);
    
    // Display login instructions
    log.info('\nLogin instructions:');
    log.info('1. Start the application using the "Start application" workflow');
    log.info('2. Click the Login button in the top right corner');
    log.info('3. Log in with your Orange ID credentials');
    log.info('4. The first user to log in will automatically become the admin');
    
    // Close connection
    db.close();
    return true;
  } catch (error: any) {
    log.error(`SQLite setup failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

// Setup PostgreSQL database
async function setupPostgres() {
  log.title('Setting up PostgreSQL Database');
  
  if (!process.env.DATABASE_URL) {
    log.error('DATABASE_URL environment variable is not set!');
    log.info('To create a PostgreSQL database in Replit:');
    log.info('1. Click on the "Database" tab in the left sidebar');
    log.info('2. Click "Create a PostgreSQL Database"');
    log.info('3. Wait for the database to be created');
    log.info('4. Run this setup script again');
    return false;
  }
  
  try {
    log.info('Connecting to PostgreSQL database...');
    const sql = postgres(process.env.DATABASE_URL, { max: 1 });
    
    // Create tables if they don't exist
    log.info('Creating database tables if they don\'t exist...');
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        orange_id TEXT UNIQUE NOT NULL,
        username TEXT NOT NULL,
        email TEXT,
        role TEXT DEFAULT 'user',
        is_admin BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Check number of users
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    log.info(`Found ${userCount[0].count} existing users in the database`);
    
    // No sample users are created - the first user to log in will be the admin
    log.info('The first user to log in will automatically become the admin');
    log.info('Additional users will be regular users with non-admin privileges');
    
    // Verify data
    const users = await sql`SELECT * FROM users`;
    log.success(`Database setup complete. ${users.length} users in database.`);
    
    // Display login instructions
    log.info('\nLogin instructions:');
    log.info('1. Start the application using the "Start application" workflow');
    log.info('2. Click the Login button in the top right corner');
    log.info('3. Log in with your Orange ID credentials');
    log.info('4. The first user to log in will automatically become the admin');
    
    // Close connection
    await sql.end();
    return true;
  } catch (error: any) {
    log.error(`PostgreSQL setup failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

// Main setup function
async function setup() {
  log.title('Orange Auth Template Setup');
  
  // Check environment
  const useSqlite = shouldUseSqlite();
  log.info(`Database type: ${useSqlite ? 'SQLite' : 'PostgreSQL'}`);
  
  if (useSqlite) {
    log.info('Using SQLite database (suitable for free Replit users)');
    return await setupSqlite();
  } else {
    log.info('Using PostgreSQL database (suitable for Core Replit users)');
    return await setupPostgres();
  }
}

// Run setup and handle result
setup().then(success => {
  if (success) {
    log.title('Setup Complete');
    log.success('The Orange Auth Template has been successfully configured!');
    log.info('Next steps:');
    log.info('1. Run the application with the "Start application" workflow');
    log.info('2. Log in using the OrangeID authentication');
    log.info('3. The first user to log in will automatically become the admin');
  } else {
    log.title('Setup Failed');
    log.error('The setup process encountered errors.');
    log.info('Please check the error messages above and try again.');
  }
}).catch(error => {
  log.error(`Unexpected error during setup: ${error.message}`);
  console.error(error);
  process.exit(1);
});
