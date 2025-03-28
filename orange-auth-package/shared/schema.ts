import { pgTable, serial, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Define users table schema
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  orangeId: text('orange_id').notNull().unique(),
  username: text('username').notNull(),
  email: text('email'),
  role: text('role').default('user').notNull(),
  authToken: text('auth_token'),
  isAdmin: boolean('is_admin').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  metadata: text('metadata'), // JSON string for additional user data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Create insert schema for users
export const insertUserSchema = createInsertSchema(users, {
  // Add custom validation
  email: z.string().email().optional().or(z.literal('')),
})
.omit({ 
  id: true,  // Auto-generated
  createdAt: true,  // Auto-generated
  updatedAt: true,  // Auto-generated
});

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;