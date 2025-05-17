// SQLite Database Schema
import {
  sqliteTable,
  text,
  integer,
  real,
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

// Birth data for astrological calculations
export const birthData = sqliteTable("birth_data", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  birthDate: text("birth_date").notNull(), // Format: YYYY-MM-DD
  birthTime: text("birth_time"), // Format: HH:MM (24-hour)
  birthLocation: text("birth_location"), // City, Country
  birthLatitude: real("birth_latitude"), // Decimal degrees
  birthLongitude: real("birth_longitude"), // Decimal degrees
  createdAt: text("created_at").notNull(),
});

// Natal chart data
export const natalCharts = sqliteTable("natal_charts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  sunSign: text("sun_sign"), // E.g., Aries, Taurus, etc.
  moonSign: text("moon_sign"),
  ascendantSign: text("ascendant_sign"),
  mercurySign: text("mercury_sign"),
  venusSign: text("venus_sign"),
  marsSign: text("mars_sign"),
  jupiterSign: text("jupiter_sign"),
  saturnSign: text("saturn_sign"),
  uranusSign: text("uranus_sign"),
  neptuneSign: text("neptune_sign"),
  plutoSign: text("pluto_sign"),
  houses: text("houses"), // JSON string with house data
  aspects: text("aspects"), // JSON string with aspect data
  chartData: text("chart_data"), // Complete JSON data of the chart
  lastUpdated: text("last_updated").notNull(),
});

// Spiritual discussions
export const spiritualDiscussions = sqliteTable("spiritual_discussions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  topic: text("topic").notNull(), // The topic of discussion
  content: text("content").notNull(), // The actual discussion content
  tags: text("tags"), // JSON array of tags
  kabbalisticElements: text("kabbalistic_elements"), // JSON data of Kabbalah elements
  astrologicalContext: text("astrological_context"), // JSON data connecting to astrology
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

// Cities table for location data
export const cities = sqliteTable("cities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(), // city_ascii or city
  cityAscii: text("city_ascii"), // From worldcities.csv
  country: text("country").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  timezoneStr: text("timezone_str").notNull(), // IANA timezone string, e.g., "America/Los_Angeles"
  population: integer("population"),
  adminName: text("admin_name"),
  iso2: text("iso2"),
  iso3: text("iso3"),
  capital: text("capital"), // From worldcities.csv
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({
    id: true,
    isAdmin: true,
    createdAt: true,
  })
  .extend({
    role: z.enum(["user", "admin"]).default("user"),
  });

export const insertBirthDataSchema = createInsertSchema(birthData)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date must be in YYYY-MM-DD format" }),
    birthTime: z.string().regex(/^\d{2}:\d{2}$/, { message: "Time must be in HH:MM format" }).optional(),
    birthLatitude: z.number().min(-90).max(90).optional(),
    birthLongitude: z.number().min(-180).max(180).optional(),
  });

export const insertNatalChartSchema = createInsertSchema(natalCharts)
  .omit({
    id: true,
    lastUpdated: true,
  });

export const insertSpiritualDiscussionSchema = createInsertSchema(spiritualDiscussions)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    tags: z.string().optional(),
    kabbalisticElements: z.string().optional(),
    astrologicalContext: z.string().optional(),
  });

export const insertCitySchema = createInsertSchema(cities); // Basic insert schema, can be customized

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBirthData = z.infer<typeof insertBirthDataSchema>;
export type BirthData = typeof birthData.$inferSelect;

export type InsertNatalChart = z.infer<typeof insertNatalChartSchema>;
export type NatalChart = typeof natalCharts.$inferSelect;

export type InsertSpiritualDiscussion = z.infer<typeof insertSpiritualDiscussionSchema>;
export type SpiritualDiscussion = typeof spiritualDiscussions.$inferSelect;

export type City = typeof cities.$inferSelect;
export type InsertCity = z.infer<typeof insertCitySchema>;

// Interpretations table for astrological explanations
export const interpretations = sqliteTable('interpretations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  elementType: text('element_type').notNull(), // e.g., 'sun_sign', 'moon_sign', 'ascendant_sign'
  key: text('key').notNull(),                 // e.g., 'Aries', 'Taurus'
  textContent: text('text_content').notNull(), // The interpretation text
});

export type Interpretation = typeof interpretations.$inferSelect;
export type InsertInterpretation = typeof interpretations.$inferInsert;

// Schema for natal chart calculation request
export const natalChartCalculationRequestSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Birth date must be in YYYY-MM-DD format.",
  }),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/, {
    message: "Birth time must be in HH:MM format.",
  }).optional().default('12:00'), // Make birth time optional, default to noon
  cityId: z.number().int().positive({
    message: "City ID must be a positive integer.",
  }),
});

export type NatalChartCalculationRequest = z.infer<typeof natalChartCalculationRequestSchema>;