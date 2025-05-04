import * as schema from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import fs from 'fs';
import path from 'path';
import { sql, eq, and } from "drizzle-orm";
import dotenv from "dotenv";
import { 
  User, InsertUser, 
  BirthData, InsertBirthData,
  NatalChart, InsertNatalChart,
  SpiritualDiscussion, InsertSpiritualDiscussion
} from "@shared/schema";

// Load environment variables first
dotenv.config();

// Define extended database type with our custom methods
interface ExtendedDatabase extends BetterSQLite3Database<typeof schema> {
  // User operations
  getUser: (id: number) => Promise<User | undefined>;
  getUserByOrangeId: (orangeId: string) => Promise<User | undefined>;
  getUserByUsername: (username: string) => Promise<User | undefined>;
  createUser: (insertUser: InsertUser) => Promise<User>;
  getAllUsers: () => Promise<User[]>;
  getUsersCreatedByDay: () => Promise<{ date: string; count: number }[]>;
  
  // Birth data operations
  getBirthData: (userId: number) => Promise<BirthData | undefined>;
  createOrUpdateBirthData: (data: InsertBirthData) => Promise<BirthData>;
  
  // Natal chart operations
  getNatalChart: (userId: number) => Promise<NatalChart | undefined>;
  createOrUpdateNatalChart: (chart: InsertNatalChart) => Promise<NatalChart>;
  
  // Spiritual discussion operations
  getSpiritualDiscussions: (userId: number) => Promise<SpiritualDiscussion[]>;
  getSpiritualDiscussionById: (id: number) => Promise<SpiritualDiscussion | undefined>;
  createSpiritualDiscussion: (discussion: InsertSpiritualDiscussion) => Promise<SpiritualDiscussion>;
  updateSpiritualDiscussion: (id: number, discussion: Partial<InsertSpiritualDiscussion>) => Promise<SpiritualDiscussion | undefined>;
  deleteSpiritualDiscussion: (id: number) => Promise<boolean>;
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

// Create the birth_data table
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS birth_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    birth_date TEXT NOT NULL,
    birth_time TEXT,
    birth_location TEXT,
    birth_latitude REAL,
    birth_longitude REAL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Create the natal_charts table
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS natal_charts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    sun_sign TEXT,
    moon_sign TEXT,
    ascendant_sign TEXT,
    mercury_sign TEXT,
    venus_sign TEXT,
    mars_sign TEXT,
    jupiter_sign TEXT,
    saturn_sign TEXT,
    uranus_sign TEXT,
    neptune_sign TEXT,
    pluto_sign TEXT,
    houses TEXT,
    aspects TEXT,
    chart_data TEXT,
    last_updated TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Create the spiritual_discussions table
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS spiritual_discussions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    topic TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT,
    kabbalistic_elements TEXT,
    astrological_context TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
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

// Birth data operations
db.getBirthData = async (userId: number) => {
  try {
    const [birthData] = await db.select()
      .from(schema.birthData)
      .where(eq(schema.birthData.userId, userId));
    return birthData;
  } catch (error) {
    console.error("Error in getBirthData:", error);
    return undefined;
  }
};

db.createOrUpdateBirthData = async (data: InsertBirthData) => {
  try {
    // Check if birth data already exists for this user
    const existingData = await db.getBirthData(data.userId);
    
    // Add timestamp for creation date
    const dataWithTimestamp = {
      ...data,
      createdAt: new Date().toISOString()
    };
    
    if (existingData) {
      // Update existing record
      const [updatedData] = await db.update(schema.birthData)
        .set(dataWithTimestamp)
        .where(eq(schema.birthData.userId, data.userId))
        .returning();
      return updatedData;
    } else {
      // Create new record
      const [newData] = await db.insert(schema.birthData)
        .values(dataWithTimestamp)
        .returning();
      return newData;
    }
  } catch (error) {
    console.error("Error in createOrUpdateBirthData:", error);
    
    // Fallback to raw SQL
    try {
      const existingData = await db.getBirthData(data.userId);
      const now = new Date().toISOString();
      
      if (existingData) {
        // Update
        const stmt = sqlite.prepare(`
          UPDATE birth_data SET 
            birth_date = ?,
            birth_time = ?,
            birth_location = ?,
            birth_latitude = ?,
            birth_longitude = ?,
            created_at = ?
          WHERE user_id = ?
        `);
        
        stmt.run(
          data.birthDate,
          data.birthTime || null,
          data.birthLocation || null,
          data.birthLatitude || null,
          data.birthLongitude || null,
          now,
          data.userId
        );
        
        // Return updated data
        const updated = sqlite.prepare("SELECT * FROM birth_data WHERE user_id = ?").get(data.userId);
        return updated as BirthData;
      } else {
        // Insert
        const stmt = sqlite.prepare(`
          INSERT INTO birth_data (
            user_id, birth_date, birth_time, birth_location, birth_latitude, birth_longitude, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(
          data.userId,
          data.birthDate,
          data.birthTime || null,
          data.birthLocation || null,
          data.birthLatitude || null,
          data.birthLongitude || null,
          now
        );
        
        // Return created data
        const created = sqlite.prepare("SELECT * FROM birth_data WHERE id = ?").get(result.lastInsertRowid);
        return created as BirthData;
      }
    } catch (sqliteError) {
      console.error("Raw SQL fallback also failed:", sqliteError);
      throw error;
    }
  }
};

// Natal chart operations
db.getNatalChart = async (userId: number) => {
  try {
    const [chart] = await db.select()
      .from(schema.natalCharts)
      .where(eq(schema.natalCharts.userId, userId));
    return chart;
  } catch (error) {
    console.error("Error in getNatalChart:", error);
    return undefined;
  }
};

db.createOrUpdateNatalChart = async (chart: InsertNatalChart) => {
  try {
    // Check if chart already exists for this user
    const existingChart = await db.getNatalChart(chart.userId);
    
    // Add timestamp for last updated
    const chartWithTimestamp = {
      ...chart,
      lastUpdated: new Date().toISOString()
    };
    
    if (existingChart) {
      // Update existing record
      const [updatedChart] = await db.update(schema.natalCharts)
        .set(chartWithTimestamp)
        .where(eq(schema.natalCharts.userId, chart.userId))
        .returning();
      return updatedChart;
    } else {
      // Create new record
      const [newChart] = await db.insert(schema.natalCharts)
        .values(chartWithTimestamp)
        .returning();
      return newChart;
    }
  } catch (error) {
    console.error("Error in createOrUpdateNatalChart:", error);
    
    // Fallback to raw SQL
    try {
      const existingChart = await db.getNatalChart(chart.userId);
      const now = new Date().toISOString();
      
      if (existingChart) {
        // Update
        const stmt = sqlite.prepare(`
          UPDATE natal_charts SET 
            sun_sign = ?,
            moon_sign = ?,
            ascendant_sign = ?,
            mercury_sign = ?,
            venus_sign = ?,
            mars_sign = ?,
            jupiter_sign = ?,
            saturn_sign = ?,
            uranus_sign = ?,
            neptune_sign = ?,
            pluto_sign = ?,
            houses = ?,
            aspects = ?,
            chart_data = ?,
            last_updated = ?
          WHERE user_id = ?
        `);
        
        stmt.run(
          chart.sunSign || null,
          chart.moonSign || null,
          chart.ascendantSign || null,
          chart.mercurySign || null,
          chart.venusSign || null,
          chart.marsSign || null,
          chart.jupiterSign || null,
          chart.saturnSign || null,
          chart.uranusSign || null,
          chart.neptuneSign || null,
          chart.plutoSign || null,
          chart.houses || null,
          chart.aspects || null,
          chart.chartData || null,
          now,
          chart.userId
        );
        
        // Return updated chart
        const updated = sqlite.prepare("SELECT * FROM natal_charts WHERE user_id = ?").get(chart.userId);
        return updated as NatalChart;
      } else {
        // Insert
        const stmt = sqlite.prepare(`
          INSERT INTO natal_charts (
            user_id, sun_sign, moon_sign, ascendant_sign, mercury_sign, venus_sign, mars_sign,
            jupiter_sign, saturn_sign, uranus_sign, neptune_sign, pluto_sign,
            houses, aspects, chart_data, last_updated
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(
          chart.userId,
          chart.sunSign || null,
          chart.moonSign || null,
          chart.ascendantSign || null,
          chart.mercurySign || null,
          chart.venusSign || null,
          chart.marsSign || null,
          chart.jupiterSign || null,
          chart.saturnSign || null,
          chart.uranusSign || null,
          chart.neptuneSign || null,
          chart.plutoSign || null,
          chart.houses || null,
          chart.aspects || null,
          chart.chartData || null,
          now
        );
        
        // Return created chart
        const created = sqlite.prepare("SELECT * FROM natal_charts WHERE id = ?").get(result.lastInsertRowid);
        return created as NatalChart;
      }
    } catch (sqliteError) {
      console.error("Raw SQL fallback also failed:", sqliteError);
      throw error;
    }
  }
};

// Spiritual discussion operations
db.getSpiritualDiscussions = async (userId: number) => {
  try {
    const discussions = await db.select()
      .from(schema.spiritualDiscussions)
      .where(eq(schema.spiritualDiscussions.userId, userId))
      .orderBy(sql`${schema.spiritualDiscussions.createdAt} DESC`);
    return discussions;
  } catch (error) {
    console.error("Error in getSpiritualDiscussions:", error);
    return [];
  }
};

db.getSpiritualDiscussionById = async (id: number) => {
  try {
    const [discussion] = await db.select()
      .from(schema.spiritualDiscussions)
      .where(eq(schema.spiritualDiscussions.id, id));
    return discussion;
  } catch (error) {
    console.error("Error in getSpiritualDiscussionById:", error);
    return undefined;
  }
};

db.createSpiritualDiscussion = async (discussion: InsertSpiritualDiscussion) => {
  try {
    // Add timestamps
    const now = new Date().toISOString();
    const discussionWithTimestamps = {
      ...discussion,
      createdAt: now,
      updatedAt: now
    };
    
    // Insert the discussion
    const [newDiscussion] = await db.insert(schema.spiritualDiscussions)
      .values(discussionWithTimestamps)
      .returning();
    return newDiscussion;
  } catch (error) {
    console.error("Error in createSpiritualDiscussion:", error);
    
    // Fallback to raw SQL
    try {
      const now = new Date().toISOString();
      
      const stmt = sqlite.prepare(`
        INSERT INTO spiritual_discussions (
          user_id, topic, content, tags, kabbalistic_elements, astrological_context, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        discussion.userId,
        discussion.topic,
        discussion.content,
        discussion.tags || null,
        discussion.kabbalisticElements || null,
        discussion.astrologicalContext || null,
        now,
        now
      );
      
      // Return created discussion
      const created = sqlite.prepare("SELECT * FROM spiritual_discussions WHERE id = ?").get(result.lastInsertRowid);
      return created as SpiritualDiscussion;
    } catch (sqliteError) {
      console.error("Raw SQL fallback also failed:", sqliteError);
      throw error;
    }
  }
};

db.updateSpiritualDiscussion = async (id: number, discussion: Partial<InsertSpiritualDiscussion>) => {
  try {
    // Get the existing discussion to verify it exists
    const existingDiscussion = await db.getSpiritualDiscussionById(id);
    if (!existingDiscussion) {
      return undefined;
    }
    
    // Add updated timestamp
    const discussionWithTimestamp = {
      ...discussion,
      updatedAt: new Date().toISOString()
    };
    
    // Update the discussion
    const [updatedDiscussion] = await db.update(schema.spiritualDiscussions)
      .set(discussionWithTimestamp)
      .where(eq(schema.spiritualDiscussions.id, id))
      .returning();
    return updatedDiscussion;
  } catch (error) {
    console.error("Error in updateSpiritualDiscussion:", error);
    
    // Fallback to raw SQL
    try {
      // Check if the discussion exists
      const existingDiscussion = sqlite.prepare("SELECT * FROM spiritual_discussions WHERE id = ?").get(id);
      if (!existingDiscussion) {
        return undefined;
      }
      
      // Only update the provided fields
      const fieldsToUpdate = [];
      const values = [];
      
      if (discussion.topic !== undefined) {
        fieldsToUpdate.push("topic = ?");
        values.push(discussion.topic);
      }
      
      if (discussion.content !== undefined) {
        fieldsToUpdate.push("content = ?");
        values.push(discussion.content);
      }
      
      if (discussion.tags !== undefined) {
        fieldsToUpdate.push("tags = ?");
        values.push(discussion.tags);
      }
      
      if (discussion.kabbalisticElements !== undefined) {
        fieldsToUpdate.push("kabbalistic_elements = ?");
        values.push(discussion.kabbalisticElements);
      }
      
      if (discussion.astrologicalContext !== undefined) {
        fieldsToUpdate.push("astrological_context = ?");
        values.push(discussion.astrologicalContext);
      }
      
      // Always update the updated_at field
      fieldsToUpdate.push("updated_at = ?");
      values.push(new Date().toISOString());
      
      // Add the id to the values array for the WHERE clause
      values.push(id);
      
      // Build and run the update query
      const stmt = sqlite.prepare(`
        UPDATE spiritual_discussions SET ${fieldsToUpdate.join(", ")} WHERE id = ?
      `);
      
      stmt.run(...values);
      
      // Return updated discussion
      const updated = sqlite.prepare("SELECT * FROM spiritual_discussions WHERE id = ?").get(id);
      return updated as SpiritualDiscussion;
    } catch (sqliteError) {
      console.error("Raw SQL fallback also failed:", sqliteError);
      throw error;
    }
  }
};

db.deleteSpiritualDiscussion = async (id: number) => {
  try {
    // Check if the discussion exists
    const existingDiscussion = await db.getSpiritualDiscussionById(id);
    if (!existingDiscussion) {
      return false;
    }
    
    // Delete the discussion
    await db.delete(schema.spiritualDiscussions)
      .where(eq(schema.spiritualDiscussions.id, id));
    return true;
  } catch (error) {
    console.error("Error in deleteSpiritualDiscussion:", error);
    
    // Fallback to raw SQL
    try {
      // Check if the discussion exists
      const existingDiscussion = sqlite.prepare("SELECT * FROM spiritual_discussions WHERE id = ?").get(id);
      if (!existingDiscussion) {
        return false;
      }
      
      // Delete the discussion
      const stmt = sqlite.prepare("DELETE FROM spiritual_discussions WHERE id = ?");
      stmt.run(id);
      return true;
    } catch (sqliteError) {
      console.error("Raw SQL fallback also failed:", sqliteError);
      return false;
    }
  }
};

console.log("Successfully configured SQLite database with all required methods");

export { db };