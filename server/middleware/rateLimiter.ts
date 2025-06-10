import { Request, Response, NextFunction } from 'express';
import { rateLimitConfig } from '../config';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Simple in-memory rate limiter
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}) {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later.',
    keyGenerator = (req) => req.ip || 'anonymous'
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    // Clean up expired entries
    if (store[key] && store[key].resetTime < now) {
      delete store[key];
    }

    // Initialize or get existing record
    if (!store[key]) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    store[key].count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - store[key].count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(store[key].resetTime).toISOString());

    // Check if limit exceeded
    if (store[key].count > max) {
      res.setHeader('Retry-After', Math.ceil((store[key].resetTime - now) / 1000).toString());
      return res.status(429).json({ error: message });
    }

    next();
  };
}

// Pre-configured rate limiters
export const apiLimiter = createRateLimiter({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.max
});

export const authLimiter = createRateLimiter({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.authMax,
  message: 'Too many authentication attempts, please try again later.'
});

export const chartCalculationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: rateLimitConfig.chartMax,
  keyGenerator: (req) => req.user?.orangeId || req.ip || 'anonymous'
});