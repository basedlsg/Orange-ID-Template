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
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  url: text("url").notNull(),
  aiTool: text("ai_tool").notNull(),
  customAiTool: text("custom_ai_tool"),
  thumbnail: text("thumbnail"),
  xHandle: text("x_handle"),
  userId: integer("user_id").references(() => users.id),
  approved: boolean("approved").notNull().default(false),
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isAdmin: true,
});

export const insertProjectSchema = createInsertSchema(projects)
  .omit({
    id: true,
    userId: true,
    approved: true,
    views: true,
    createdAt: true,
    customAiTool: true,
  })
  .extend({
    description: z.string().max(100),
    url: z.string().url(),
    xHandle: z.string().optional(),
    aiTool: z.enum(PREDEFINED_AI_TOOLS),
    customAiTool: z.string().optional(),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;