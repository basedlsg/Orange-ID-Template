import { 
  users, type User, type InsertUser, 
  type BirthData, type InsertBirthData,
  type NatalChart, type InsertNatalChart,
  type SpiritualDiscussion, type InsertSpiritualDiscussion
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
  
  // Birth data operations
  getBirthData(userId: number): Promise<BirthData | undefined>;
  createOrUpdateBirthData(data: InsertBirthData): Promise<BirthData>;
  
  // Natal chart operations
  getNatalChart(userId: number): Promise<NatalChart | undefined>;
  createOrUpdateNatalChart(chart: InsertNatalChart): Promise<NatalChart>;
  
  // Spiritual discussion operations
  getSpiritualDiscussions(userId: number): Promise<SpiritualDiscussion[]>;
  getSpiritualDiscussionById(id: number): Promise<SpiritualDiscussion | undefined>;
  createSpiritualDiscussion(discussion: InsertSpiritualDiscussion): Promise<SpiritualDiscussion>;
  updateSpiritualDiscussion(id: number, discussion: Partial<InsertSpiritualDiscussion>): Promise<SpiritualDiscussion | undefined>;
  deleteSpiritualDiscussion(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
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
  
  // Birth data operations
  async getBirthData(userId: number): Promise<BirthData | undefined> {
    return db.getBirthData(userId);
  }
  
  async createOrUpdateBirthData(data: InsertBirthData): Promise<BirthData> {
    console.log(`Creating/updating birth data for user ${data.userId}`);
    return db.createOrUpdateBirthData(data);
  }
  
  // Natal chart operations
  async getNatalChart(userId: number): Promise<NatalChart | undefined> {
    return db.getNatalChart(userId);
  }
  
  async createOrUpdateNatalChart(chart: InsertNatalChart): Promise<NatalChart> {
    console.log(`Creating/updating natal chart for user ${chart.userId}`);
    return db.createOrUpdateNatalChart(chart);
  }
  
  // Spiritual discussion operations
  async getSpiritualDiscussions(userId: number): Promise<SpiritualDiscussion[]> {
    return db.getSpiritualDiscussions(userId);
  }
  
  async getSpiritualDiscussionById(id: number): Promise<SpiritualDiscussion | undefined> {
    return db.getSpiritualDiscussionById(id);
  }
  
  async createSpiritualDiscussion(discussion: InsertSpiritualDiscussion): Promise<SpiritualDiscussion> {
    console.log(`Creating spiritual discussion for user ${discussion.userId}`);
    return db.createSpiritualDiscussion(discussion);
  }
  
  async updateSpiritualDiscussion(id: number, discussion: Partial<InsertSpiritualDiscussion>): Promise<SpiritualDiscussion | undefined> {
    console.log(`Updating spiritual discussion ${id}`);
    return db.updateSpiritualDiscussion(id, discussion);
  }
  
  async deleteSpiritualDiscussion(id: number): Promise<boolean> {
    console.log(`Deleting spiritual discussion ${id}`);
    return db.deleteSpiritualDiscussion(id);
  }
}

export const storage = new DatabaseStorage();