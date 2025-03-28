import { eq } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../shared/schema";
import { InsertUser, User, users } from "../shared/schema";

// Interface for storage operations
export interface IUserStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByOrangeId(orangeId: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  checkAdminStatus(orangeId: string): Promise<boolean>;
}

// Database implementation of storage
export class DatabaseUserStorage implements IUserStorage {
  private db: PostgresJsDatabase<any>;

  constructor(db: PostgresJsDatabase<any>) {
    this.db = db;
  }

  // Get user by ID
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  // Get user by Orange ID
  async getUserByOrangeId(orangeId: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.orangeId, orangeId));
    return result[0];
  }

  // Get user by username
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  // Create a new user
  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Check if user has admin status
  async checkAdminStatus(orangeId: string): Promise<boolean> {
    const user = await this.getUserByOrangeId(orangeId);
    return user?.isAdmin || false;
  }
}

// Create a storage instance from a database
export const createUserStorage = (db: PostgresJsDatabase<any>): IUserStorage => {
  return new DatabaseUserStorage(db);
};