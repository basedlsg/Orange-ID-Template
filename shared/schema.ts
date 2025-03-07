import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const PREDEFINED_AI_TOOLS = [
  "Replit AI",
  "Cursor",
  "ChatGPT",
  "Claude",
  "GitHub Copilot",
  "Other"
] as const;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  orangeId: text("orange_id").notNull().unique(),
  username: text("username").notNull(),
  email: text("email"),
  role: text("role").notNull().default("user"),
  authToken: text("auth_token"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  url: text("url").notNull(),
  aiTools: text("ai_tools").array().notNull(),
  thumbnail: text("thumbnail"),
  xHandle: text("x_handle"),
  userId: integer("user_id").references(() => users.id),
  approved: boolean("approved").notNull().default(false),
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users)
  .omit({
    id: true,
    isAdmin: true,
    createdAt: true,
  })
  .extend({
    role: z.enum(["user", "admin"]).default("user"),
  });

export const insertProjectSchema = createInsertSchema(projects)
  .omit({
    id: true,
    userId: true,
    approved: true,
    views: true,
    createdAt: true,
  })
  .extend({
    description: z.string().max(200, "Description must be 200 characters or less"),
    url: z.string().url(),
    aiTools: z.array(z.string()).min(1, "Select at least one AI tool"),
    thumbnailFile: z.any().optional(),
    xHandle: z.string().optional(),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;