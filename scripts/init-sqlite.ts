// Script to initialize SQLite database with required tables
import Database from "better-sqlite3";
import path from 'path';
import fs from 'fs';

// Create data directory if it doesn't exist
const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create or open the SQLite database file
const dbPath = path.join(dbDir, 'orange_auth.db');
console.log(`Initializing SQLite database at: ${dbPath}`);
const db = new Database(dbPath);

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

// Create a test admin user if it doesn't exist
const adminExists = db.prepare('SELECT 1 FROM users WHERE orange_id = ?').get('admin123');
if (!adminExists) {
  db.prepare(`
    INSERT INTO users (orange_id, username, email, role, is_admin) 
    VALUES (?, ?, ?, ?, ?)
  `).run('admin123', 'admin', 'admin@example.com', 'admin', 1);
  console.log("Admin user created");
}

// Create sample user
const testUserExists = db.prepare('SELECT 1 FROM users WHERE orange_id = ?').get('test-sqlite-user');
if (!testUserExists) {
  db.prepare(`
    INSERT INTO users (orange_id, username, email, role, is_admin) 
    VALUES (?, ?, ?, ?, ?)
  `).run('test-sqlite-user', 'sqliteuser', 'sqlite@example.com', 'user', 0);
  console.log("Test user created");
}

// List all users in the database
const users = db.prepare('SELECT * FROM users').all();
console.log("Current users in database:", users);

// Close the database connection
db.close();
console.log("SQLite database initialization complete");