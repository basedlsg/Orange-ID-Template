import { Request, Response, NextFunction } from 'express';
import { IUserStorage } from './storage';

// Helper function to extract user information from request
export async function getUserFromRequest(
  req: Request, 
  storage: IUserStorage
): Promise<{ userId: number, orangeId: string } | null> {
  // Get orangeId from the request body or query params
  const orangeId = req.body.orangeId || req.query.orangeId as string;
  if (!orangeId) {
    return null;
  }

  // Get the user from the database
  const user = await storage.getUserByOrangeId(orangeId);
  if (!user) {
    return null;
  }

  return { userId: user.id, orangeId };
}

// Middleware to check if user is authenticated
export function authMiddleware(storage: IUserStorage) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await getUserFromRequest(req, storage);
    
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Set user info on request object for later use
    (req as any).user = user;
    next();
  };
}

// Middleware to check if user is an admin
export function adminMiddleware(storage: IUserStorage) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await getUserFromRequest(req, storage);
    
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const isAdmin = await storage.checkAdminStatus(user.orangeId);
    if (!isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    // Set user info on request object for later use
    (req as any).user = { ...user, isAdmin };
    next();
  };
}