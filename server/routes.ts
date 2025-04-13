import { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  type User,
  type InsertUser
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import 'express-session';

// Extend Express Request type to include session
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    orangeId?: string;
    isAdmin?: boolean;
  }
}

async function getUserFromRequest(req: any): Promise<{ userId: number, orangeId: string } | null> {
  // Get user info from session if available
  if (req.session && req.session.userId && req.session.orangeId) {
    return {
      userId: req.session.userId,
      orangeId: req.session.orangeId
    };
  }
  
  // Fall back to query parameters if session is not available
  const orangeId = req.body.orangeId || req.query.orangeId;
  if (!orangeId) {
    return null;
  }

  // Get the user from our database
  const user = await storage.getUserByOrangeId(orangeId);
  if (!user) {
    return null;
  }

  // Store in session for future requests
  if (req.session) {
    req.session.userId = user.id;
    req.session.orangeId = user.orangeId;
    req.session.isAdmin = user.isAdmin;
  }

  return { userId: user.id, orangeId };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // No database switching routes needed - we only use SQLite

  // User API
  app.post("/api/users", async (req, res) => {
    try {
      console.log("Received user data:", req.body);

      // Validate the user data
      const validatedData = insertUserSchema.parse(req.body);
      console.log("Validated user data:", validatedData);

      // Check if user already exists by orangeId
      const existingUser = await storage.getUserByOrangeId(validatedData.orangeId);
      if (existingUser) {
        console.log("User already exists, returning existing user:", existingUser);
        
        // Store user info in the session
        if (req.session) {
          req.session.userId = existingUser.id;
          req.session.orangeId = existingUser.orangeId;
          req.session.isAdmin = existingUser.isAdmin;
        }
        
        return res.json(existingUser); // Return existing user if found
      }

      // Create new user
      const user = await storage.createUser(validatedData);
      console.log("Created user:", user);
      
      // Store user info in the session
      if (req.session) {
        req.session.userId = user.id;
        req.session.orangeId = user.orangeId;
        req.session.isAdmin = user.isAdmin;
      }
      
      res.json(user);
    } catch (error) {
      console.error("User creation error:", error);
      
      // Check if it's a duplicate key error
      if (error instanceof Error && 
          error.message.includes('duplicate key value violates unique constraint')) {
        // If it's a duplicate key error, try to fetch the user and return it
        try {
          const existingUser = await storage.getUserByOrangeId(req.body.orangeId);
          if (existingUser) {
            console.log("Recovered existing user after duplicate key error:", existingUser);
            
            // Store user info in the session
            if (req.session) {
              req.session.userId = existingUser.id;
              req.session.orangeId = existingUser.orangeId;
              req.session.isAdmin = existingUser.isAdmin;
            }
            
            return res.json(existingUser);
          }
        } catch (fetchError) {
          console.error("Error fetching user after duplicate key error:", fetchError);
        }
      }
      
      // Handle Zod validation errors
      if (error instanceof Error && error.name === 'ZodError') {
        const validationError = fromZodError(error as any);
        return res.status(400).json({ error: validationError.message });
      }
      
      // General error handling
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "An unknown error occurred" 
      });
    }
  });

  app.get("/api/users/check-admin", async (req, res) => {
    try {
      // Always prioritize the query parameter for explicit checks
      const { orangeId } = req.query;

      if (orangeId) {
        console.log(`Checking admin status for explicit orangeId: ${orangeId}`);
        const user = await storage.getUserByOrangeId(orangeId as string);

        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        
        // Store in session for future requests
        if (req.session) {
          req.session.userId = user.id;
          req.session.orangeId = user.orangeId;
          req.session.isAdmin = user.isAdmin;
        }
        
        // In SQLite, isAdmin could be a number (1 or 0) so convert to boolean to ensure consistent API
        const isAdmin = Boolean(user.isAdmin);
        console.log(`Admin check for orangeId ${orangeId}: isAdmin=${isAdmin} (raw value=${user.isAdmin})`);
        return res.json({ isAdmin: isAdmin });
      }
      
      // If no orangeId provided, check session
      if (req.session && req.session.orangeId && typeof req.session.isAdmin === 'boolean') {
        console.log(`Using session data for admin check: orangeId=${req.session.orangeId}, isAdmin=${req.session.isAdmin}`);
        return res.json({ isAdmin: req.session.isAdmin });
      }
      
      // No session or query param available
      return res.status(400).json({ error: "orangeId is required" });
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500).json({ error: "Failed to check admin status" });
    }
  });
  
  // Admin API Routes
  
  // Middleware to check if user is admin
  const checkAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Always log the request information
      console.log(`Admin middleware check - Session: ${JSON.stringify({
        userId: req.session?.userId,
        orangeId: req.session?.orangeId,
        isAdmin: req.session?.isAdmin
      })}, Headers: ${JSON.stringify({
        origin: req.headers.origin,
        referer: req.headers.referer,
        host: req.headers.host,
        adminId: req.headers['x-admin-id']
      })}`);
      
      // First check if admin status is stored in session and it's explicitly true
      // In SQLite, isAdmin is stored as 1/0 not true/false, so check for both
      const isAdminValue = req.session?.isAdmin;
      // Use type assertion to avoid TypeScript errors
      const isAdminSession = 
        isAdminValue === true || 
        (isAdminValue as any) === 1 || 
        (typeof isAdminValue !== 'undefined' && Number(isAdminValue) === 1);
      
      if (req.session && isAdminSession && req.session.userId) {
        console.log(`Using session for admin check: User ID ${req.session.userId} is admin`);
        return next();
      }
      
      // Also check if the frontend has set an orangeId in the query param
      const orangeId = req.query.adminId || 
                       req.query.orangeId || 
                       req.headers['x-admin-id'] || 
                       req.session?.orangeId;
      
      // If we have a session orangeId but no adminId, check if that user is admin
      if (orangeId) {
        console.log(`Checking admin status for orangeId: ${orangeId}`);
        const user = await storage.getUserByOrangeId(orangeId as string);
        
        if (!user) {
          console.log(`User with orangeId ${orangeId} not found`);
          return res.status(404).json({ error: "User not found" });
        }
        
        // In SQLite, isAdmin could be a number (1 or 0) so convert to boolean to ensure consistent checks
        const isAdmin = Boolean(user.isAdmin);
        if (!isAdmin) {
          console.log(`User ${orangeId} is not an admin (isAdmin=${user.isAdmin}, converted=${isAdmin})`);
          return res.status(403).json({ error: "Unauthorized access" });
        }
        
        console.log(`Confirmed user ${orangeId} is an admin (isAdmin=${user.isAdmin}, converted=${isAdmin})`);
        
        // Store admin status in session for future requests
        if (req.session) {
          req.session.userId = user.id;
          req.session.orangeId = user.orangeId;
          req.session.isAdmin = user.isAdmin;
        }
        
        return next();
      }
      
      // If not in session and no ID provided, deny access
      console.log('No admin identification found in request');
      return res.status(401).json({ error: "Admin ID not provided" });
    } catch (error) {
      console.error("Error in admin check middleware:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  
  // Get all users (admin only)
  app.get("/api/admin/users", checkAdmin, async (req, res) => {
    try {
      console.log("Admin API: Fetching all users");
      console.log("Admin ID from query:", req.query.adminId);
      console.log("Admin ID from session:", req.session?.orangeId);
      console.log("Admin status from session:", req.session?.isAdmin);
      
      const users = await storage.getAllUsers();
      console.log(`Retrieved ${users.length} users from database`);
      
      // Log basic user info
      if (users.length > 0) {
        console.log(`Found ${users.length} users in database`);
      }
      
      // Set current date for any invalid dates
      const formattedUsers = users.map(user => ({
        ...user,
        createdAt: (!user.createdAt || isNaN(new Date(user.createdAt).getTime())) 
          ? new Date().toISOString() 
          : user.createdAt
      }));
      
      res.json(formattedUsers);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  
  // Get user growth statistics (admin only)
  app.get("/api/admin/stats/user-growth", checkAdmin, async (req, res) => {
    try {
      console.log("Admin API: Fetching user growth statistics");
      const stats = await storage.getUsersCreatedByDay();
      console.log(`Retrieved statistics for ${stats.length} days`);
      console.log("Growth statistics:", stats);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user growth stats:", error);
      res.status(500).json({ error: "Failed to fetch user growth statistics" });
    }
  });

  // Toggle user admin status (admin only)
  app.post("/api/admin/toggle-admin", checkAdmin, async (req, res) => {
    try {
      console.log("Admin API: Toggling user admin status");
      const { userId, makeAdmin } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      // Convert to correct types
      const userIdNum = parseInt(userId, 10);
      const makeAdminBool = Boolean(makeAdmin);
      
      if (isNaN(userIdNum)) {
        return res.status(400).json({ error: "Invalid user ID format" });
      }
      
      console.log(`Toggling admin status for user ${userIdNum} to ${makeAdminBool ? 'admin' : 'non-admin'}`);
      
      const updatedUser = await storage.toggleUserAdminStatus(userIdNum, makeAdminBool);
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Update session if the user toggled their own status
      if (req.session && req.session.userId === userIdNum) {
        req.session.isAdmin = updatedUser.isAdmin;
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error toggling user admin status:", error);
      res.status(500).json({ error: "Failed to update user admin status" });
    }
  });
  
  // Note: The clear users functionality has been removed to maintain data persistence
  
  const httpServer = createServer(app);
  return httpServer;
}
