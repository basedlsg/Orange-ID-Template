import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const PREDEFINED_AI_TOOLS = [
  "Replit AI",
  "Cursor",
  "ChatGPT",
  "Claude",
  "GitHub Copilot",
  "Grok",
  "Windsurf",
  "Lovable",
  "Bolt",
  "v0",
] as const;

export const PREDEFINED_GENRES = [
  "Games",
  "Education",
  "Productivity",
  "Web3",
  "Developer Tools",
  "Social",
  "Entertainment",
  "Business",
  "AI Research",
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
  aiTools: text("ai_tools").array(),
  genres: text("genres").array().notNull(),
  thumbnail: text("thumbnail"),
  xHandle: text("x_handle"),
  sponsorshipEnabled: boolean("sponsorship_enabled").notNull().default(false),
  sponsorshipUrl: text("sponsorship_url"),
  userId: integer("user_id").references(() => users.id),
  approved: boolean("approved").notNull().default(false),
  views: integer("views").notNull().default(0),
  likeCount: integer("like_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  orangeId: text("orange_id").notNull(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userProjectUnique: unique().on(table.orangeId, table.projectId),
}));

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
    likeCount: true,
    createdAt: true,
  })
  .extend({
    description: z
      .string()
      .max(200, "Description must be 200 characters or less"),
    url: z.string().url(),
    aiTools: z.array(z.string()).optional().default([]),
    genres: z.array(z.string()).superRefine((val, ctx) => {
      if (ctx.path.length > 0 && val.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: 1,
          type: "array",
          inclusive: true,
          message: "Select at least one genre",
        });
      }
    }),
    thumbnailFile: z.any().optional(),
    xHandle: z.string().optional(),
    sponsorshipEnabled: z.boolean().default(false),
    sponsorshipUrl: z.union([
      z.string().url(),
      z.string().length(0),
      z.undefined()
    ]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.sponsorshipEnabled && (!data.sponsorshipUrl || data.sponsorshipUrl.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sponsorship URL is required when sponsorship is enabled",
        path: ["sponsorshipUrl"],
      });
    }
  });

export const insertLikeSchema = createInsertSchema(likes).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertLike = z.infer<typeof insertLikeSchema>;
export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Like = typeof likes.$inferSelect;