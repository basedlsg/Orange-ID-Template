import { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  type User,
  type InsertUser
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";

async function getUserFromRequest(req: any): Promise<{ userId: number, orangeId: string } | null> {
  // Get orangeId from the authenticated user's token
  const orangeId = req.body.orangeId || req.query.orangeId;
  if (!orangeId) {
    return null;
  }

  // Get the user from our database
  const user = await storage.getUserByOrangeId(orangeId);
  if (!user) {
    return null;
  }

  return { userId: user.id, orangeId };
}

export async function registerRoutes(app: Express): Promise<Server> {

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
        return res.json(existingUser); // Return existing user if found
      }

      // Create new user
      const user = await storage.createUser(validatedData);
      console.log("Created user:", user);
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
      const { orangeId } = req.query;

      if (!orangeId) {
        return res.status(400).json({ error: "orangeId is required" });
      }

      const user = await storage.getUserByOrangeId(orangeId as string);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({ isAdmin: user.isAdmin });
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500).json({ error: "Failed to check admin status" });
    }
  });
  
  // Admin API Routes
  
  // Middleware to check if user is admin
  const checkAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orangeId = req.query.adminId || req.headers['x-admin-id'];
      
      if (!orangeId) {
        return res.status(401).json({ error: "Admin ID not provided" });
      }
      
      const user = await storage.getUserByOrangeId(orangeId as string);
      
      if (!user || !user.isAdmin) {
        return res.status(403).json({ error: "Unauthorized access" });
      }
      
      next();
    } catch (error) {
      console.error("Error in admin check middleware:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  
  // Get all users (admin only)
  app.get("/api/admin/users", checkAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  
  // Get user growth statistics (admin only)
  app.get("/api/admin/stats/user-growth", checkAdmin, async (req, res) => {
    try {
      const stats = await storage.getUsersCreatedByDay();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user growth stats:", error);
      res.status(500).json({ error: "Failed to fetch user growth statistics" });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
