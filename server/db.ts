import * as schema from "@shared/schema";
import fs from 'fs';
import path from 'path';

// Using a simple in-memory database for development
console.log("Using in-memory database for development");

// Create a simple in-memory database for debugging
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
    
    for (const user of this.users.values()) {
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

// Create test admin user
mockDb.createUser({
  orangeId: 'admin123',
  username: 'admin',
  email: 'admin@example.com',
  role: 'admin',
  isAdmin: true
});

// Export mock database
const db = mockDb;
const pool = null;

export { db, pool };