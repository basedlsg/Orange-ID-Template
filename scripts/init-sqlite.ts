// Script to initialize SQLite database with required tables
import Database from "better-sqlite3";
import path from 'path';
import fs from 'fs';
import { parse } from 'node:querystring';
import readline from 'readline';

// Parse command line arguments
const args = process.argv.slice(2);
const flags = new Map();
let skipDefaultUsers = false;
let cleanDatabase = false;
let customAdminId = '';
let customAdminUsername = '';
let customAdminEmail = '';

// Process command line flags
for (const arg of args) {
  if (arg === '--skip-default-users' || arg === '-s') {
    skipDefaultUsers = true;
  } else if (arg === '--clean' || arg === '-c') {
    cleanDatabase = true;
  } else if (arg.startsWith('--admin-id=')) {
    customAdminId = arg.split('=')[1];
  } else if (arg.startsWith('--admin-username=')) {
    customAdminUsername = arg.split('=')[1];
  } else if (arg.startsWith('--admin-email=')) {
    customAdminEmail = arg.split('=')[1];
  }
}

// Create data directory if it doesn't exist
const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create or open the SQLite database file
const dbPath = path.join(dbDir, 'orange_auth.db');
console.log(`Initializing SQLite database at: ${dbPath}`);
const db = new Database(dbPath);

// If clean flag is set, drop existing tables
if (cleanDatabase) {
  console.log('Cleaning database: dropping existing tables...');
  db.exec('DROP TABLE IF EXISTS users;');
}

// Create users table with required schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orange_id TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    is_admin INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

console.log("Users table created successfully");

// Only create default users if not skipped
if (!skipDefaultUsers) {
  // Create a test admin user if it doesn't exist and no custom admin specified
  if (!customAdminId) {
    const adminExists = db.prepare('SELECT 1 FROM users WHERE orange_id = ?').get('admin123');
    if (!adminExists) {
      db.prepare(`
        INSERT INTO users (orange_id, username, email, role, is_admin) 
        VALUES (?, ?, ?, ?, ?)
      `).run('admin123', 'admin', 'admin@example.com', 'admin', 1);
      console.log("Default admin user created: orange_id=admin123, username=admin");
    }
  }

  // Create sample user
  const testUserExists = db.prepare('SELECT 1 FROM users WHERE orange_id = ?').get('test-sqlite-user');
  if (!testUserExists) {
    db.prepare(`
      INSERT INTO users (orange_id, username, email, role, is_admin) 
      VALUES (?, ?, ?, ?, ?)
    `).run('test-sqlite-user', 'sqliteuser', 'sqlite@example.com', 'user', 0);
    console.log("Test user created: orange_id=test-sqlite-user, username=sqliteuser");
  }
}

// Create custom admin user if specified
if (customAdminId && customAdminUsername) {
  const customAdminExists = db.prepare('SELECT * FROM users WHERE orange_id = ?').get(customAdminId);

  if (customAdminExists) {
    // Update existing user to be admin
    db.prepare(`
      UPDATE users
      SET username = ?, email = ?, role = 'admin', is_admin = 1
      WHERE orange_id = ?
    `).run(
      customAdminUsername, 
      customAdminEmail || 'admin@example.com', 
      customAdminId
    );
    console.log(`Updated existing user as admin: orange_id=${customAdminId}, username=${customAdminUsername}`);
  } else {
    // Create new admin user
    db.prepare(`
      INSERT INTO users (orange_id, username, email, role, is_admin) 
      VALUES (?, ?, ?, ?, ?)
    `).run(
      customAdminId, 
      customAdminUsername, 
      customAdminEmail || 'admin@example.com', 
      'admin', 
      1
    );
    console.log(`Custom admin user created: orange_id=${customAdminId}, username=${customAdminUsername}`);
  }
}

// List all users in the database
const users = db.prepare('SELECT * FROM users').all();
console.log("\nCurrent users in database:");
console.table(users);

// Close the database connection
db.close();
console.log("\nSQLite database initialization complete");
console.log("\nTo log in as admin, use the OrangeID authentication and the admin user's orange_id");
console.log("For custom admin setup, run the script with these options:");
console.log("  --clean or -c: Remove all existing data");
console.log("  --skip-default-users or -s: Don't create default admin and test users");
console.log("  --admin-id=value: Set custom admin OrangeID");
console.log("  --admin-username=value: Set custom admin username");
console.log("  --admin-email=value: Set custom admin email");
console.log("\nExample: npx tsx scripts/init-sqlite.ts --clean --admin-id=your-orange-id --admin-username=your-username");