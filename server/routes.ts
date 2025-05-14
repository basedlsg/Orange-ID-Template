import { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertBirthDataSchema,
  insertNatalChartSchema,
  insertSpiritualDiscussionSchema,
  type User,
  type InsertUser,
  type BirthData,
  type InsertBirthData,
  type NatalChart,
  type InsertNatalChart,
  type SpiritualDiscussion,
  type InsertSpiritualDiscussion
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
    console.log("Auth from session:", { userId: req.session.userId, orangeId: req.session.orangeId });
    return {
      userId: req.session.userId,
      orangeId: req.session.orangeId
    };
  }
  
  // Fall back to query parameters if session is not available
  const orangeId = req.query.orangeId || req.body?.orangeId;
  
  if (orangeId) {
    console.log("Auth from query/body orangeId:", orangeId);
    
    // Get the user from our database
    const user = await storage.getUserByOrangeId(orangeId);
    if (user) {
      console.log("Found user by orangeId:", user.id);
      
      // Update the session with this user info
      if (req.session) {
        req.session.userId = user.id;
        req.session.orangeId = user.orangeId;
        req.session.isAdmin = user.isAdmin;
      }
      
      return {
        userId: user.id,
        orangeId: user.orangeId
      };
    }
  }
  
  // No valid auth found
  console.log("No valid auth found for request");
  return null;
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
  
  // Middleware to ensure user is authenticated
  const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("Authentication request details:", {
        path: req.path,
        method: req.method,
        query: req.query,
        session: req.session ? {
          userId: req.session.userId,
          orangeId: req.session.orangeId
        } : "No session"
      });
      
      const user = await getUserFromRequest(req);
      
      if (!user) {
        console.log("Authentication failed for request:", req.path);
        return res.status(401).json({ error: "Authentication required" });
      }
      
      console.log("User authenticated successfully:", user);
      
      // Add the user id to the request for handlers
      (req as any).userId = user.userId;
      next();
    } catch (error) {
      console.error("Error in auth middleware:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  
  // Birth Data API routes
  
  // Get birth data for the current user
  app.get("/api/birth-data", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const orangeId = req.query.orangeId || 'none';
      console.log(`Fetching birth data for user ${userId} (from orangeId: ${orangeId})`);
      
      const birthData = await storage.getBirthData(userId);
      
      if (!birthData) {
        return res.status(404).json({ error: "Birth data not found" });
      }
      
      res.json(birthData);
    } catch (error) {
      console.error("Error fetching birth data:", error);
      res.status(500).json({ error: "Failed to fetch birth data" });
    }
  });
  
  // Create or update birth data for the current user
  app.post("/api/birth-data", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const orangeId = req.query.orangeId || 'none';
      console.log(`Creating/updating birth data for user ${userId} (from orangeId: ${orangeId})`);
      
      // Merge the user ID with the request body
      const birthDataWithUserId = {
        ...req.body,
        userId
      };
      
      // Validate the data
      const validatedData = insertBirthDataSchema.parse(birthDataWithUserId);
      
      // Create or update birth data
      const birthData = await storage.createOrUpdateBirthData(validatedData);
      
      res.json(birthData);
    } catch (error) {
      console.error("Error creating/updating birth data:", error);
      
      // Handle Zod validation errors
      if (error instanceof Error && error.name === 'ZodError') {
        const validationError = fromZodError(error as any);
        return res.status(400).json({ error: validationError.message });
      }
      
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to save birth data" 
      });
    }
  });
  
  // Natal Chart API routes
  
  // Get natal chart for the current user
  app.get("/api/natal-chart", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      console.log(`Fetching natal chart for user ${userId}`);
      
      // First check if the user already has a natal chart
      let natalChart = await storage.getNatalChart(userId);
      
      // If no natal chart exists, check if the user has birth data
      if (!natalChart) {
        console.log(`No natal chart found for user ${userId}, checking birth data`);
        const birthData = await storage.getBirthData(userId);
        
        if (!birthData) {
          return res.status(404).json({ error: "Birth data needed to generate natal chart" });
        }
        
        // User has birth data but no chart, use Gemini to generate one
        try {
          console.log(`Generating new natal chart for user ${userId} using Gemini AI`);
          
          // Import the Gemini function dynamically to avoid loading it unnecessarily
          const { generateNatalChart } = await import('./gemini');
          
          // Generate the natal chart
          const natalChartData = await generateNatalChart(birthData);
          
          // Save the generated chart to the database
          natalChart = await storage.createOrUpdateNatalChart(natalChartData);
          console.log(`Generated and saved new natal chart for user ${userId}`);
        } catch (generationError) {
          console.error("Error generating natal chart with Gemini:", generationError);
          return res.status(500).json({ error: "Failed to generate natal chart" });
        }
      }
      
      res.json(natalChart);
    } catch (error) {
      console.error("Error fetching natal chart:", error);
      res.status(500).json({ error: "Failed to fetch natal chart" });
    }
  });
  
  // Create or update natal chart for the current user
  app.post("/api/natal-chart", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      console.log(`Creating/updating natal chart for user ${userId}`);
      
      // Merge the user ID with the request body
      const chartWithUserId = {
        ...req.body,
        userId
      };
      
      // Validate the data
      const validatedData = insertNatalChartSchema.parse(chartWithUserId);
      
      // Create or update the natal chart
      const natalChart = await storage.createOrUpdateNatalChart(validatedData);
      
      res.json(natalChart);
    } catch (error) {
      console.error("Error creating/updating natal chart:", error);
      
      // Handle Zod validation errors
      if (error instanceof Error && error.name === 'ZodError') {
        const validationError = fromZodError(error as any);
        return res.status(400).json({ error: validationError.message });
      }
      
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to save natal chart" 
      });
    }
  });
  
  // Spiritual Discussion API routes
  
  // Get all spiritual discussions for the current user
  app.get("/api/spiritual-discussions", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      console.log(`Fetching spiritual discussions for user ${userId}`);
      
      const discussions = await storage.getSpiritualDiscussions(userId);
      
      res.json(discussions);
    } catch (error) {
      console.error("Error fetching spiritual discussions:", error);
      res.status(500).json({ error: "Failed to fetch spiritual discussions" });
    }
  });
  
  // Get a single spiritual discussion by ID
  app.get("/api/spiritual-discussions/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const discussionId = parseInt(req.params.id, 10);
      
      if (isNaN(discussionId)) {
        return res.status(400).json({ error: "Invalid discussion ID" });
      }
      
      console.log(`Fetching spiritual discussion ${discussionId} for user ${userId}`);
      
      const discussion = await storage.getSpiritualDiscussionById(discussionId);
      
      if (!discussion) {
        return res.status(404).json({ error: "Discussion not found" });
      }
      
      // Check if the discussion belongs to the current user
      if (discussion.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(discussion);
    } catch (error) {
      console.error("Error fetching spiritual discussion:", error);
      res.status(500).json({ error: "Failed to fetch spiritual discussion" });
    }
  });
  
  // Create a new spiritual discussion
  app.post("/api/spiritual-discussions", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      console.log(`Creating spiritual discussion for user ${userId}`);
      
      // Merge the user ID with the request body
      let discussionWithUserId = {
        ...req.body,
        userId
      };
      
      // Check if we should enhance the discussion with Gemini AI
      const useGemini = req.query.useGemini === 'true' || req.body.useGemini === true;
      
      if (useGemini) {
        try {
          console.log(`Enhancing spiritual discussion with Gemini AI for user ${userId}`);
          
          // Check if the user has a natal chart
          const natalChart = await storage.getNatalChart(userId);
          
          if (natalChart) {
            // Import the Gemini function dynamically
            const { generateAstrologicalInsights } = await import('./gemini');
            
            // Generate astrological insights
            const insights = await generateAstrologicalInsights(natalChart, discussionWithUserId.topic);
            
            // Add the generated insights to the discussion data
            discussionWithUserId = {
              ...discussionWithUserId,
              astrologicalContext: insights.astrologicalContext || discussionWithUserId.astrologicalContext,
              kabbalisticElements: insights.kabbalisticElements || discussionWithUserId.kabbalisticElements
            };
            
            console.log(`Successfully enhanced discussion with Gemini AI insights for user ${userId}`);
          } else {
            console.log(`No natal chart found for user ${userId}, skipping Gemini enhancement`);
          }
        } catch (geminiError) {
          console.error("Error enhancing discussion with Gemini:", geminiError);
          // Continue without Gemini enhancement if it fails
        }
      }
      
      // Validate the data
      const validatedData = insertSpiritualDiscussionSchema.parse(discussionWithUserId);
      
      // Create the discussion
      const discussion = await storage.createSpiritualDiscussion(validatedData);
      
      res.status(201).json(discussion);
    } catch (error) {
      console.error("Error creating spiritual discussion:", error);
      
      // Handle Zod validation errors
      if (error instanceof Error && error.name === 'ZodError') {
        const validationError = fromZodError(error as any);
        return res.status(400).json({ error: validationError.message });
      }
      
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to create spiritual discussion" 
      });
    }
  });
  
  // Update a spiritual discussion
  app.patch("/api/spiritual-discussions/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const discussionId = parseInt(req.params.id, 10);
      
      if (isNaN(discussionId)) {
        return res.status(400).json({ error: "Invalid discussion ID" });
      }
      
      console.log(`Updating spiritual discussion ${discussionId} for user ${userId}`);
      
      // First check if the discussion exists and belongs to the user
      const existingDiscussion = await storage.getSpiritualDiscussionById(discussionId);
      
      if (!existingDiscussion) {
        return res.status(404).json({ error: "Discussion not found" });
      }
      
      if (existingDiscussion.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Check if we should enhance the discussion with Gemini AI
      const useGemini = req.query.useGemini === 'true' || req.body.useGemini === true;
      
      // Create an object with the updates
      let updates = { ...req.body };
      
      if (useGemini) {
        try {
          console.log(`Enhancing updated spiritual discussion with Gemini AI for user ${userId}`);
          
          // Check if the user has a natal chart
          const natalChart = await storage.getNatalChart(userId);
          
          if (natalChart) {
            // Import the Gemini function dynamically
            const { generateAstrologicalInsights } = await import('./gemini');
            
            // Generate astrological insights
            const insights = await generateAstrologicalInsights(natalChart, updates.topic || existingDiscussion.topic);
            
            // Add the generated insights to the updates
            updates = {
              ...updates,
              astrologicalContext: insights.astrologicalContext || updates.astrologicalContext || existingDiscussion.astrologicalContext,
              kabbalisticElements: insights.kabbalisticElements || updates.kabbalisticElements || existingDiscussion.kabbalisticElements
            };
            
            console.log(`Successfully enhanced discussion update with Gemini AI insights for user ${userId}`);
          } else {
            console.log(`No natal chart found for user ${userId}, skipping Gemini enhancement for update`);
          }
        } catch (geminiError) {
          console.error("Error enhancing discussion update with Gemini:", geminiError);
          // Continue without Gemini enhancement if it fails
        }
      }
      
      // Update the discussion with the potentially enhanced data
      const updatedDiscussion = await storage.updateSpiritualDiscussion(discussionId, updates);
      
      if (!updatedDiscussion) {
        return res.status(404).json({ error: "Failed to update discussion" });
      }
      
      res.json(updatedDiscussion);
    } catch (error) {
      console.error("Error updating spiritual discussion:", error);
      
      // Handle Zod validation errors
      if (error instanceof Error && error.name === 'ZodError') {
        const validationError = fromZodError(error as any);
        return res.status(400).json({ error: validationError.message });
      }
      
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to update spiritual discussion" 
      });
    }
  });
  
  // Delete a spiritual discussion
  app.delete("/api/spiritual-discussions/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const discussionId = parseInt(req.params.id, 10);
      
      if (isNaN(discussionId)) {
        return res.status(400).json({ error: "Invalid discussion ID" });
      }
      
      console.log(`Deleting spiritual discussion ${discussionId} for user ${userId}`);
      
      // First check if the discussion exists and belongs to the user
      const existingDiscussion = await storage.getSpiritualDiscussionById(discussionId);
      
      if (!existingDiscussion) {
        return res.status(404).json({ error: "Discussion not found" });
      }
      
      if (existingDiscussion.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Delete the discussion
      const success = await storage.deleteSpiritualDiscussion(discussionId);
      
      if (!success) {
        return res.status(500).json({ error: "Failed to delete discussion" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting spiritual discussion:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to delete spiritual discussion" 
      });
    }
  });
  
  // Note: The clear users functionality has been removed to maintain data persistence
  
  const httpServer = createServer(app);
  return httpServer;
}
