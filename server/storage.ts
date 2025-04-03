import { 
  users, type User, type InsertUser
} from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByOrangeId(orangeId: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<Omit<User, 'authToken'>[]>;
  getUsersCreatedByDay(): Promise<{ date: string; count: number }[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByOrangeId(orangeId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.orangeId, orangeId));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async getAllUsers(): Promise<Omit<User, 'authToken'>[]> {
    // Select all users but exclude the authToken field for security
    const result = await db
      .select({
        id: users.id,
        orangeId: users.orangeId,
        username: users.username,
        email: users.email,
        role: users.role,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt
      })
      .from(users)
      .orderBy(users.createdAt);
    
    return result;
  }
  
  async getUsersCreatedByDay(): Promise<{ date: string; count: number }[]> {
    // Use the PostgreSQL pool directly for this complex query
    const result = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') as date,
        COUNT(*) as count
      FROM users
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date
    `);
    
    // Return the rows
    return result.rows.map((row: any) => ({
      date: row.date,
      count: parseInt(row.count, 10)
    }));
  }
}

export const storage = new DatabaseStorage();