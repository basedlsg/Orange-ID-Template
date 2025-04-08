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
  getAllUsers(): Promise<User[]>;
  getUsersCreatedByDay(): Promise<{ date: string; count: number }[]>;
  
  // Admin management operations
  toggleUserAdminStatus(userId: number, makeAdmin: boolean): Promise<User | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    return db.getUser(id);
  }

  async getUserByOrangeId(orangeId: string): Promise<User | undefined> {
    return db.getUserByOrangeId(orangeId);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return db.getUserByUsername(username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    console.log("Received user data:", insertUser);
    
    // First check if user already exists
    const existingUser = await this.getUserByOrangeId(insertUser.orangeId);
    if (existingUser) {
      console.log("User already exists, returning existing user:", existingUser);
      return existingUser;
    }
    
    // Validate and prepare user data
    const userToCreate = {
      ...insertUser,
      isAdmin: false, // Default to non-admin, will be set to true if first user
      createdAt: new Date().toISOString()
    };
    
    console.log("Validated user data:", userToCreate);
    
    // The db.createUser method will handle first-user logic
    return await db.createUser(userToCreate);
  }
  
  async getAllUsers(): Promise<User[]> {
    return db.getAllUsers();
  }
  
  async getUsersCreatedByDay(): Promise<{ date: string; count: number }[]> {
    return db.getUsersCreatedByDay();
  }

  async toggleUserAdminStatus(userId: number, makeAdmin: boolean): Promise<User | undefined> {
    console.log(`Toggling admin status for user ${userId} to ${makeAdmin ? 'admin' : 'non-admin'}`);
    
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
}

export const storage = new DatabaseStorage();