import * as schema from "@shared/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import { drizzle as drizzleSQLite } from "drizzle-orm/better-sqlite3";
import { migrate as migratePg } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import Database from "better-sqlite3";
import fs from 'fs';
import path from 'path';
import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

// Load environment variables first
dotenv.config();

// SQLite is the only database type supported now

// Create a simple in-memory database for debugging or when no database is available
const mockDb = {
  users: new Map<number, any>(),
  userIdCounter: 1,
  userByOrangeId: new Map<string, any>(),
  userByUsername: new Map<string, any>(),
  
  // Methods to match our storage interface
  async getUser(id: number) {
    return this.users.get(id);
  },
  
  async getUserByOrangeId(orangeId: string) {
    return this.userByOrangeId.get(orangeId);
  },
  
  async getUserByUsername(username: string) {
    return this.userByUsername.get(username);
  },
  
  async createUser(user: any) {
    const id = this.userIdCounter++;
    const timestamp = new Date().toISOString();
    
    const newUser = {
      id,
      ...user,
      createdAt: timestamp
    };
    
    this.users.set(id, newUser);
    this.userByOrangeId.set(user.orangeId, newUser);
    this.userByUsername.set(user.username, newUser);
    
    return newUser;
  },
  
  async getAllUsers() {
    return Array.from(this.users.values());
  },
  
  async getUsersCreatedByDay() {
    const usersByDay = new Map<string, number>();
    
    // Use Array.from to convert the map values iterator to an array first
    const userArray = Array.from(this.users.values());
    
    for (const user of userArray) {
      const date = user.createdAt.split('T')[0];
      usersByDay.set(date, (usersByDay.get(date) || 0) + 1);
    }
    
    // Convert to expected format
    return Array.from(usersByDay.entries()).map(([date, count]) => ({
      date,
      count
    }));
  }
};

// Create test admin user in the mock DB
mockDb.createUser({
  orangeId: 'admin123',
  username: 'admin',
  email: 'admin@example.com',
  role: 'admin',
  isAdmin: true
});

// Determine which database to use
let db: any;
let pool: any = null;
let sqlite: any = null;

// Helper to format user with valid dates - defined at module level so it's available to all db implementations
const formatUserDates = (user: any) => {
  if (user && user.createdAt) {
    try {
      // Ensure createdAt is a valid date string
      // Already stored as ISO string in database
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

try {
  // Always use SQLite for this template
  const useSqlite = true;
  
  if (true) { // Always enter SQLite setup block
    // Setup SQLite database
    // Create data directory if it doesn't exist
    const dbDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    // Create or open the SQLite database file
    const dbPath = path.join(dbDir, 'orange_auth.db');
    
    try {
      // Create instance with verbose logging only if debugging is explicitly enabled
      sqlite = process.env.DEBUG_SQLITE === 'true' 
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
      
      // Create the drizzle SQLite client
      db = drizzleSQLite(sqlite, { schema });
      
      // Add additional methods to the db object to match the IStorage interface
      // This allows db to be used directly when needed
      
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
      
      db.createUser = async (insertUser: any) => {
        try {
          // Add the timestamp explicitly to avoid SQLite issues
          const userToCreate = {
            ...insertUser,
            isAdmin: false, // No automatic admin - will check for first user later using raw SQL
            createdAt: new Date().toISOString() // Set timestamp explicitly
          };
          
          const [user] = await db.insert(schema.users).values(userToCreate).returning();
          return user;
        } catch (error) {
          console.error("Error in db.createUser:", error);
          
          // If Drizzle ORM fails, fall back to raw SQL
          if (sqlite) {
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
              return createdUser;
            } catch (sqliteError) {
              console.error("Raw SQL fallback also failed:", sqliteError);
              throw error; // Rethrow the original error
            }
          } else {
            throw error;
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
    } catch (sqliteError) {
      console.error("Error setting up SQLite database:", sqliteError);
      console.log("Falling back to in-memory mock database");
      db = mockDb;
    }
  } else {
    // PostgreSQL setup
    console.log("Using PostgreSQL database");
    
    if (!process.env.DATABASE_URL) {
      console.log("No DATABASE_URL found. Using in-memory mock database instead.");
      db = mockDb;
    } else {
      try {
        // Setup PostgreSQL client
        const connectionString = process.env.DATABASE_URL || '';
        pool = postgres(connectionString, { max: 10 });
        db = drizzle(pool, { schema });
        
        // Add methods to match the IStorage interface
        // This allows db to be used directly when needed
        // Reuse the same date formatting helper for PostgreSQL
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
        
        db.createUser = async (insertUser: any) => {
          // Check if this is the first user by counting existing users
          const userCount = await db.select({ count: sql`count(*)` }).from(schema.users);
          const isFirstUser = parseInt(userCount[0]?.count?.toString() || '0', 10) === 0;
          
          // If this is the first user, make them an admin
          const userToCreate = {
            ...insertUser,
            isAdmin: isFirstUser ? true : (insertUser.isAdmin || false)
          };
          
          const [user] = await db.insert(schema.users).values(userToCreate).returning();
          return user;
        };
        
        db.getAllUsers = async () => {
          const users = await db.select().from(schema.users).orderBy(schema.users.createdAt);
          // Format dates for all users in PostgreSQL too (using the same helper function)
          return users.map((user: any) => formatUserDates(user));
        };
        
        // Add PostgreSQL-specific methods for analytics
        db.getUsersCreatedByDay = async () => {
          try {
            // PostgreSQL date extraction query
            const results = await db.execute(sql`
              SELECT 
                TO_CHAR(created_at, 'YYYY-MM-DD') as date,
                COUNT(*) as count
              FROM users
              GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
              ORDER BY date
            `);
            
            return results.map((row: any) => ({
              date: row.date,
              count: parseInt(row.count, 10)
            }));
          } catch (error) {
            console.error("Error in PostgreSQL getUsersCreatedByDay:", error);
            return [];
          }
        };
        
        console.log("Successfully configured PostgreSQL database with all required methods");
      } catch (pgError) {
        console.error("Error setting up PostgreSQL:", pgError);
        console.log("Falling back to in-memory mock database");
        db = mockDb;
      }
    }
  }
} catch (error) {
  console.error("Error setting up database:", error);
  console.log("Falling back to in-memory mock database");
  db = mockDb;
}

export { db, pool, mockDb };