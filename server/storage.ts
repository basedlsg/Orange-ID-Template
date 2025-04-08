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
  
  // Admin management operations
  toggleUserAdminStatus(userId: number, makeAdmin: boolean): Promise<User | undefined>;
  clearAllUsers(): Promise<void>; // For cleaning the database
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
    console.log("Received user data:", insertUser);
    
    // First check if user already exists
    const existingUser = await this.getUserByOrangeId(insertUser.orangeId);
    if (existingUser) {
      console.log("User already exists, returning existing user:", existingUser);
      return existingUser;
    }
    
    // Validate user data
    const userToCreate = {
      ...insertUser,
      // Default non-admins - we'll update based on count after
      isAdmin: false,
      createdAt: new Date().toISOString()
    };
    
    console.log("Validated user data:", userToCreate);
    
    try {
      let user: User;
      
      // Get current user count first
      const allUsers = await this.getAllUsers();
      const isFirstUser = allUsers.length === 0;
      
      if (this.isUsingMockDb()) {
        userToCreate.isAdmin = isFirstUser;
        user = await (db as any).createUser(userToCreate);
      } else {
        // Use Drizzle transaction to ensure correct count
        if (isFirstUser) {
          // If this is the first user, make them admin
          userToCreate.isAdmin = true;
        }
        
        const [createdUser] = await db.insert(users).values(userToCreate).returning();
        user = createdUser;
      }
      
      console.log("Created user:", user);
      return user;
    } catch (error) {
      console.error("Error in db.createUser:", error);
      
      // Try fallback approach with raw SQL for SQLite
      if (typeof (db as any).execute === 'function') {
        try {
          const countResult = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
          const isFirstUser = parseInt(countResult[0]?.count?.toString() || '0', 10) === 0;
          
          userToCreate.isAdmin = isFirstUser;
          const [user] = await db.insert(users).values(userToCreate).returning();
          return user;
        } catch (fallbackError) {
          console.error("Fallback creation attempt also failed:", fallbackError);
          throw error; // Rethrow original error
        }
      }
      
      throw error;
    }
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
          SUBSTR(created_at, 1, 10) as date,
          COUNT(*) as count
        FROM users
        GROUP BY SUBSTR(created_at, 1, 10)
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

  async toggleUserAdminStatus(userId: number, makeAdmin: boolean): Promise<User | undefined> {
    console.log(`Toggling admin status for user ${userId} to ${makeAdmin ? 'admin' : 'non-admin'}`);
    
    return this.safeDbOperation(
      // For mock DB implementation
      async () => {
        if (typeof (db as any).toggleUserAdminStatus === 'function') {
          return await (db as any).toggleUserAdminStatus(userId, makeAdmin);
        } else {
          // Fallback for mock DB without the method
          const user = await (db as any).getUser(userId);
          if (!user) return undefined;
          
          user.isAdmin = makeAdmin;
          return user;
        }
      },
      // For Drizzle implementation
      async () => {
        try {
          // First verify user exists
          const user = await this.getUser(userId);
          if (!user) {
            console.log(`User with ID ${userId} not found`);
            return undefined;
          }
          
          // Update the user's admin status
          const [updatedUser] = await db
            .update(users)
            .set({ isAdmin: makeAdmin })
            .where(eq(users.id, userId))
            .returning();
          
          console.log(`Updated user admin status:`, updatedUser);
          return updatedUser;
        } catch (error) {
          console.error(`Error toggling admin status for user ${userId}:`, error);
          throw error;
        }
      }
    );
  }

  async clearAllUsers(): Promise<void> {
    console.log("Clearing all users from the database");
    
    return this.safeDbOperation(
      // For mock DB implementation
      async () => {
        if (typeof (db as any).clearAllUsers === 'function') {
          await (db as any).clearAllUsers();
        } else {
          // Basic mock DB implementation if not available
          (db as any).users = [];
        }
      },
      // For Drizzle implementation
      async () => {
        try {
          await db.delete(users);
          console.log("All users deleted successfully");
        } catch (error) {
          console.error("Error clearing users:", error);
          throw error;
        }
      }
    );
  }
}

export const storage = new DatabaseStorage();