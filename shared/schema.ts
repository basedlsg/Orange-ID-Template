// Import for PostgreSQL
import {
  pgTable,
  text as pgText,
  serial,
  boolean as pgBoolean,
  timestamp as pgTimestamp,
} from "drizzle-orm/pg-core";

// Import for SQLite
import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";

import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Schema for PostgreSQL
export const pgUsers = pgTable("users", {
  id: serial("id").primaryKey(),
  orangeId: pgText("orange_id").notNull().unique(),
  username: pgText("username").notNull(),
  email: pgText("email"),
  role: pgText("role").notNull().default("user"),
  isAdmin: pgBoolean("is_admin").notNull().default(false),
  createdAt: pgTimestamp("created_at").notNull().defaultNow(),
});

// Schema for SQLite
export const sqliteUsers = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orangeId: text("orange_id").notNull().unique(),
  username: text("username").notNull(),
  email: text("email"),
  role: text("role").notNull().default("user"),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// We'll use a unified schema for operations based on environment
export const users = process.env.USE_SQLITE ? sqliteUsers : pgUsers;

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