// SQLite Database Schema
import {
  sqliteTable,
  text,
  integer,
} from "drizzle-orm/sqlite-core";

import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema definition for SQLite
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orangeId: text("orange_id").notNull().unique(),
  username: text("username").notNull(),
  email: text("email"),
  role: text("role").notNull().default("user"),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
});

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