import * as schema from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import fs from 'fs';
import path from 'path';
import { sql, eq } from "drizzle-orm";
import dotenv from "dotenv";
import { User, InsertUser } from "@shared/schema";

// Load environment variables first
dotenv.config();

// Define extended database type with our custom methods
interface ExtendedDatabase extends BetterSQLite3Database<typeof schema> {
  getUser: (id: number) => Promise<User | undefined>;
  getUserByOrangeId: (orangeId: string) => Promise<User | undefined>;
  getUserByUsername: (username: string) => Promise<User | undefined>;
  createUser: (insertUser: InsertUser) => Promise<User>;
  getAllUsers: () => Promise<User[]>;
  getUsersCreatedByDay: () => Promise<{ date: string; count: number }[]>;
}

// Helper to format user with valid dates
const formatUserDates = (user: any) => {
  if (user && user.createdAt) {
    try {
      // Ensure createdAt is a valid date string
      const dateStr = user.createdAt;
      const validDate = new Date(dateStr);
      
      // If it's an invalid date, use current date as fallback
      if (isNaN(validDate.getTime())) {
        console.log(`Invalid date detected: ${dateStr}, using fallback`);
        user.createdAt = new Date().toISOString();
      }
    } catch (e) {
      console.log(`Error parsing date: ${e}`);
      user.createdAt = new Date().toISOString();
    }
  }
  return user;
};

// Setup SQLite database
// Create data directory if it doesn't exist
const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create or open the SQLite database file
const dbPath = path.join(dbDir, 'orange_auth.db');

// Create SQLite database instance
const sqlite = process.env.DEBUG_SQLITE === 'true' 
  ? new Database(dbPath, { verbose: console.log }) 
  : new Database(dbPath);

// Create the users table if it doesn't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orange_id TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    is_admin INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )
`);

// Create the drizzle SQLite client with our extended type
const db = drizzle(sqlite, { schema }) as unknown as ExtendedDatabase;

// Add additional methods to the db object to match the IStorage interface
db.getUser = async (id: number) => {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
  return formatUserDates(user);
};

db.getUserByOrangeId = async (orangeId: string) => {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.orangeId, orangeId));
  return formatUserDates(user);
};

db.getUserByUsername = async (username: string) => {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
  return formatUserDates(user);
};

db.createUser = async (insertUser: InsertUser) => {
  try {
    // Add the timestamp explicitly to avoid SQLite issues
    const userToCreate = {
      ...insertUser,
      isAdmin: false, // Default to false, we'll check if it's the first user below
      createdAt: new Date().toISOString() // Set timestamp explicitly
    };
    
    // Check if this is the first user - if so, make them admin
    const countResult = sqlite.prepare("SELECT COUNT(*) as count FROM users").get();
    const isFirstUser = parseInt((countResult as any).count, 10) === 0;
    
    if (isFirstUser) {
      userToCreate.isAdmin = true;
    }
    
    const [user] = await db.insert(schema.users).values(userToCreate).returning();
    return user;
  } catch (error) {
    console.error("Error in db.createUser:", error);
      
    // If Drizzle ORM fails, fall back to raw SQL
    try {
      const countResult = sqlite.prepare("SELECT COUNT(*) as count FROM users").get();
      const isFirstUser = parseInt((countResult as any).count, 10) === 0;
      
      const stmt = sqlite.prepare(`
        INSERT INTO users (orange_id, username, email, role, is_admin, created_at) 
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const now = new Date().toISOString();
      const result = stmt.run(
        insertUser.orangeId,
        insertUser.username,
        insertUser.email || null,
        insertUser.role || 'user',
        isFirstUser ? 1 : 0,
        now
      );
      
      // Get the created user
      const createdUser = sqlite.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
      return createdUser as User;
    } catch (sqliteError) {
      console.error("Raw SQL fallback also failed:", sqliteError);
      throw error; // Rethrow the original error
    }
  }
};

db.getAllUsers = async () => {
  const users = await db.select().from(schema.users).orderBy(schema.users.createdAt);
  // Format dates for all users
  return users.map((user: any) => formatUserDates(user));
};

// Handle user creation date stats query for SQLite
db.getUsersCreatedByDay = async () => {
  try {
    // SQLite version of the date grouping query - using SUBSTR to extract the date part
    const results = await sqlite.prepare(`
      SELECT 
        SUBSTR(created_at, 1, 10) as date,
        COUNT(*) as count
      FROM users
      GROUP BY SUBSTR(created_at, 1, 10)
      ORDER BY date
    `).all();
    
    return results.map((row: any) => ({
      date: row.date,
      count: parseInt(row.count, 10)
    }));
  } catch (error) {
    console.error("Error in getUsersCreatedByDay:", error);
    return [];
  }
};

console.log("Successfully configured SQLite database with all required methods");

export { db };