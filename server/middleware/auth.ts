import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

// Extend Express Request type to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        orangeId: string;
        isAdmin: boolean;
      };
    }
  }
}

// Extend Express Session type
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    orangeId?: string;
    isAdmin?: boolean;
  }
}

/**
 * Extracts user information from the request.
 * Prioritizes session data, then falls back to query parameters.
 */
export async function extractUser(req: Request): Promise<{ id: number; orangeId: string; isAdmin: boolean } | null> {
  // 1. Check session first (most secure)
  if (req.session?.userId && req.session?.orangeId) {
    return {
      id: req.session.userId,
      orangeId: req.session.orangeId,
      isAdmin: Boolean(req.session.isAdmin)
    };
  }

  // 2. Check for orangeId in query params (fallback for session issues)
  const orangeId = req.query.orangeId as string;
  if (!orangeId) {
    return null;
  }

  // 3. Fetch user from database
  const user = await storage.getUserByOrangeId(orangeId);
  if (!user) {
    return null;
  }

  // 4. Update session for future requests
  if (req.session) {
    req.session.userId = user.id;
    req.session.orangeId = user.orangeId;
    req.session.isAdmin = Boolean(user.isAdmin);
  }

  return {
    id: user.id,
    orangeId: user.orangeId,
    isAdmin: Boolean(user.isAdmin)
  };
}

/**
 * Middleware that requires authentication.
 * Populates req.user with user information.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await extractUser(req);
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware that requires admin privileges.
 * Must be used after requireAuth.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await extractUser(req);
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Admin privileges required' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Optional authentication middleware.
 * Populates req.user if authenticated, but doesn't require it.
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await extractUser(req);
    if (user) {
      req.user = user;
    }
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    // Continue without authentication
    next();
  }
}