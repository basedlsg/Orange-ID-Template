import { 
  users, type User, type InsertUser
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByOrangeId(orangeId: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUsersCreatedByDay(): Promise<{ date: string; count: number }[]>;
}

export class DatabaseStorage implements IStorage {
  // Check if we're using the mock database
  private isUsingMockDb(): boolean {
    // If 'select' method doesn't exist, it's the mock DB
    return typeof (db as any).select !== 'function';
  }

  // Helper to safely run database operations 
  private async safeDbOperation<T>(
    mockDbMethod: () => Promise<T>,
    drizzleOperation: () => Promise<T>
  ): Promise<T> {
    if (this.isUsingMockDb()) {
      return await mockDbMethod();
    }
    
    try {
      return await drizzleOperation();
    } catch (error) {
      console.error("Database operation error:", error);
      // Attempt mock DB as fallback in case of failure
      if (typeof mockDbMethod === 'function') {
        console.warn("Falling back to mock DB for this operation");
        return await mockDbMethod();
      }
      throw error;
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.safeDbOperation(
      () => (db as any).getUser(id),
      async () => {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
      }
    );
  }

  async getUserByOrangeId(orangeId: string): Promise<User | undefined> {
    return this.safeDbOperation(
      () => (db as any).getUserByOrangeId(orangeId),
      async () => {
        const [user] = await db.select().from(users).where(eq(users.orangeId, orangeId));
        return user;
      }
    );
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.safeDbOperation(
      () => (db as any).getUserByUsername(username),
      async () => {
        const [user] = await db.select().from(users).where(eq(users.username, username));
        return user;
      }
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    return this.safeDbOperation(
      async () => {
        // Check if this is the first user being created
        const allUsers = await this.getAllUsers();
        const isFirstUser = allUsers.length === 0;
        
        // If this is the first user, make them an admin
        const userToCreate = {
          ...insertUser,
          isAdmin: isFirstUser ? true : false,
          createdAt: new Date().toISOString()
        };
        
        // Call the createUser method on the mock DB
        return (db as any).createUser(userToCreate);
      },
      async () => {
        // Check if this is the first user by counting existing users
        const userCount = await db.select({ count: sql`count(*)` }).from(users);
        const isFirstUser = parseInt(userCount[0]?.count?.toString() || '0', 10) === 0;
        
        // If this is the first user, make them an admin
        const userToCreate = {
          ...insertUser,
          isAdmin: isFirstUser ? true : false,
          createdAt: new Date().toISOString()
        };
        
        const [user] = await db.insert(users).values(userToCreate).returning();
        return user;
      }
    );
  }
  
  async getAllUsers(): Promise<User[]> {
    return this.safeDbOperation(
      () => (db as any).getAllUsers(),
      async () => {
        const result = await db
          .select()
          .from(users)
          .orderBy(users.createdAt);
        
        return result;
      }
    );
  }
  
  async getUsersCreatedByDay(): Promise<{ date: string; count: number }[]> {
    // If we have a custom implementation directly on the DB object, use it
    if (typeof (db as any).getUsersCreatedByDay === 'function') {
      return await (db as any).getUsersCreatedByDay();
    }
    
    // For direct database operations using Drizzle ORM
    try {
      // This approach works for both PostgreSQL and SQLite using Drizzle ORM's SQL functionality
      // The SQL syntax will be adapted to the correct dialect by Drizzle
      const result = await db.execute(sql`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM users
        GROUP BY DATE(created_at)
        ORDER BY date
      `);
      
      return result.map((row: any) => ({
        date: row.date,
        count: parseInt(row.count, 10)
      }));
    } catch (error) {
      console.error("Error running user growth stats query:", error);
      
      // If we have PostgreSQL pool as a fallback, try that
      if (pool) {
        try {
          const result = await pool.query(`
            SELECT 
              TO_CHAR(created_at, 'YYYY-MM-DD') as date,
              COUNT(*) as count
            FROM users
            GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
            ORDER BY date
          `);
          
          return result.rows.map((row: any) => ({
            date: row.date,
            count: parseInt(row.count, 10)
          }));
        } catch (poolError) {
          console.error("Error running PostgreSQL fallback query:", poolError);
          return [];
        }
      }
      
      return [];
    }
  }
}

export const storage = new DatabaseStorage();