import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Define environment schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5001').transform(Number),
  
  // Session
  SESSION_SECRET: z.string().default('orange-auth-session-secret'),
  SESSION_MAX_AGE: z.string().default('2592000000').transform(Number), // 30 days in ms
  
  // Database
  DATABASE_PATH: z.string().default(path.join(process.cwd(), 'data', 'data.db')),
  SESSIONS_DB_PATH: z.string().default(path.join(process.cwd(), 'data', 'sessions.db')),
  
  // Auth
  ORANGE_ID_TENANT: z.string().default('orange-dhl93pieq6'),
  
  // Swiss Ephemeris
  EPHE_PATH: z.string().default(path.join(process.cwd(), 'server', 'ephe')),
  
  // Google Gemini API
  GEMINI_API_KEY: z.string().optional(),
  
  // Cache
  CHART_CACHE_TTL: z.string().default('86400000').transform(Number), // 24 hours in ms
  CHART_CACHE_MAX_SIZE: z.string().default('1000').transform(Number),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
  AUTH_RATE_LIMIT_MAX: z.string().default('5').transform(Number),
  CHART_RATE_LIMIT_MAX: z.string().default('10').transform(Number),
  
  // CORS
  CORS_ORIGIN: z.string().default('*'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

// Parse and validate environment
const envResult = envSchema.safeParse(process.env);

if (!envResult.success) {
  console.error('❌ Invalid environment variables:');
  console.error(envResult.error.format());
  process.exit(1);
}

export const config = envResult.data;

// Export typed config sections for convenience
export const sessionConfig = {
  secret: config.SESSION_SECRET,
  maxAge: config.SESSION_MAX_AGE,
};

export const databaseConfig = {
  dataPath: config.DATABASE_PATH,
  sessionsPath: config.SESSIONS_DB_PATH,
};

export const authConfig = {
  tenantId: config.ORANGE_ID_TENANT,
};

export const ephemerisConfig = {
  path: config.EPHE_PATH,
};

export const geminiConfig = {
  apiKey: config.GEMINI_API_KEY,
  isEnabled: !!config.GEMINI_API_KEY,
};

export const cacheConfig = {
  ttl: config.CHART_CACHE_TTL,
  maxSize: config.CHART_CACHE_MAX_SIZE,
};

export const rateLimitConfig = {
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  authMax: config.AUTH_RATE_LIMIT_MAX,
  chartMax: config.CHART_RATE_LIMIT_MAX,
};

export const corsConfig = {
  origin: config.CORS_ORIGIN,
};

export const loggingConfig = {
  level: config.LOG_LEVEL,
};

// Helper to check if in production
export const isProduction = config.NODE_ENV === 'production';
export const isDevelopment = config.NODE_ENV === 'development';
export const isTest = config.NODE_ENV === 'test';