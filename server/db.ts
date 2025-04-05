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

// Debug environment variables
console.log("[db.ts] Environment variables:");
console.log("[db.ts] - USE_SQLITE:", process.env.USE_SQLITE);
console.log("[db.ts] - DEBUG_SQLITE:", process.env.DEBUG_SQLITE);

// Import the shouldUseSqlite helper function
import { shouldUseSqlite } from "@shared/schema";

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

try {
  // Determine if we should use SQLite
  const useSqlite = process.env.USE_SQLITE === 'true' || !process.env.DATABASE_URL;
  
  if (useSqlite) {
    console.log("Using SQLite database");
    
    // Setup SQLite database
    // Create data directory if it doesn't exist
    const dbDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    // Create or open the SQLite database file
    const dbPath = path.join(dbDir, 'orange_auth.db');
    console.log(`SQLite database path: ${dbPath}`);
    
    try {
      // Check if database file exists
      if (fs.existsSync(dbPath)) {
        console.log("SQLite database file exists");
      } else {
        console.log("SQLite database file doesn't exist, will be created");
      }
      
      // Create instance with verbose logging if debugging is enabled
      const sqlite = process.env.DEBUG_SQLITE === 'true' 
        ? new Database(dbPath, { verbose: console.log }) 
        : new Database(dbPath);
      
      // Create the drizzle SQLite client
      db = drizzleSQLite(sqlite, { schema });
      
      // Add additional methods to the db object to match the IStorage interface
      // This allows db to be used directly when needed
      db.getUser = async (id: number) => {
        const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
        return user;
      };
      
      db.getUserByOrangeId = async (orangeId: string) => {
        const [user] = await db.select().from(schema.users).where(eq(schema.users.orangeId, orangeId));
        return user;
      };
      
      db.getUserByUsername = async (username: string) => {
        const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
        return user;
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
        return await db.select().from(schema.users).orderBy(schema.users.createdAt);
      };
      
      // Handle user creation date stats query for SQLite
      db.getUsersCreatedByDay = async () => {
        // SQLite version of the date grouping query
        const results = await sqlite.prepare(`
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as count
          FROM users
          GROUP BY DATE(created_at)
          ORDER BY date
        `).all();
        
        return results.map((row: any) => ({
          date: row.date,
          count: row.count
        }));
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
        db.getUser = async (id: number) => {
          const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
          return user;
        };
        
        db.getUserByOrangeId = async (orangeId: string) => {
          const [user] = await db.select().from(schema.users).where(eq(schema.users.orangeId, orangeId));
          return user;
        };
        
        db.getUserByUsername = async (username: string) => {
          const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
          return user;
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
          return await db.select().from(schema.users).orderBy(schema.users.createdAt);
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