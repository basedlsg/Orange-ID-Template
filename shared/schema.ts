// Primary Database: SQLite
import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";

import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Main Schema: SQLite
export const sqliteUsers = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orangeId: text("orange_id").notNull().unique(),
  username: text("username").notNull(),
  email: text("email"),
  role: text("role").notNull().default("user"),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ADVANCED: PostgreSQL Support (Optional)
// Only import these when using PostgreSQL
// These imports are kept separate to avoid unnecessary complexity for most users
import {
  pgTable,
  text as pgText,
  serial,
  boolean as pgBoolean,
  timestamp as pgTimestamp,
} from "drizzle-orm/pg-core";

export const pgUsers = pgTable("users", {
  id: serial("id").primaryKey(),
  orangeId: pgText("orange_id").notNull().unique(),
  username: pgText("username").notNull(),
  email: pgText("email"),
  role: pgText("role").notNull().default("user"),
  isAdmin: pgBoolean("is_admin").notNull().default(false),
  createdAt: pgTimestamp("created_at").notNull().defaultNow(),
});

// Database Selection Logic
export function shouldUseSqlite() {
  // SQLite is the default and recommended option
  // Only use PostgreSQL if explicitly configured with DATABASE_URL
  
  // Check if DATABASE_URL exists and USE_SQLITE is not explicitly true
  if (typeof process !== 'undefined' && process.env) {
    // If DATABASE_URL exists and USE_SQLITE isn't true, use PostgreSQL
    if (process.env.DATABASE_URL && process.env.USE_SQLITE !== 'true') {
      return false;
    }
  }
  
  // In all other cases, use SQLite
  return true;
}

// Default to SQLite (most users will use this)
export const users = shouldUseSqlite() ? sqliteUsers : pgUsers;

// Create insert schema from the appropriate table
export const insertUserSchema = createInsertSchema(users)
  .omit({
    id: true,
    isAdmin: true,
    createdAt: true,
  })
  .extend({
    role: z.enum(["user", "admin"]).default("user"),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;