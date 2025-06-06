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
  type InsertSpiritualDiscussion,
  natalChartCalculationRequestSchema,
  cities,
  interpretations
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import 'express-session';
import { DateTime } from 'luxon';
import { calculateNatalChart } from './astrologyEngine';
import { eq } from 'drizzle-orm';
import { db } from './db';

// Extend Express Request type to include session
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    orangeId?: string;
    isAdmin?: boolean;
  }
}

async function getUserFromRequest(req: any): Promise<{ userId: number, orangeId: string } | null> {
  // For debugging in deployment scenarios
  console.log("Authentication request details:", {
    path: req.path,
    method: req.method,
    query: req.query,
    session: req.session
  });

  // Get user info from session if available
  if (req.session && req.session.userId && req.session.orangeId) {
    console.log("Auth from session:", { userId: req.session.userId, orangeId: req.session.orangeId });
    return {
      userId: req.session.userId,
      orangeId: req.session.orangeId
    };
  }
  
  // Fall back to query parameters or request body if session is not available
  // This is critical for deployed environments where session might not work consistently
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
      const natalChart = await storage.getNatalChart(userId);
      
      if (!natalChart) {
        console.log(`No natal chart found for user ${userId}. Client should prompt for calculation.`);
        // If no natal chart exists, send a 404 or an empty object/null.
        // The frontend is set up to handle the case where natalChartQuery.data is null or undefined.
        // Sending null is consistent with how the frontend might expect an empty state.
        return res.status(200).json(null); 
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
  
  // Natal Chart Calculation Route
  app.post("/api/natal-chart/calculate", async (req, res) => {
    try {
      // 1. Validate request body
      const validatedBody = natalChartCalculationRequestSchema.parse(req.body);
      
      // Ensure birthTime defaults to noon if not provided
      const { birthDate, birthTime = '12:00', cityId } = validatedBody;
      
      console.log(`[API Calculate] Processing chart calculation with birthDate: ${birthDate}, birthTime: ${birthTime || '12:00'}, cityId: ${cityId}`);

      // 2. Fetch city details from database
      // Assuming 'db' is your Drizzle instance and 'cities' is your schema
      const cityResult = await db.select({
        latitude: cities.latitude,
        longitude: cities.longitude,
        timezoneStr: cities.timezoneStr,
        name: cities.name
      })
      .from(cities)
      .where(eq(cities.id, cityId))
      .limit(1);

      if (!cityResult || cityResult.length === 0) {
        console.error(`[API Calculate] City not found for cityId: ${cityId}`);
        return res.status(404).json({ error: "City not found." });
      }
      const city = cityResult[0];
      console.log(`[API Calculate] Found city: ${city.name}, latitude: ${city.latitude}, longitude: ${city.longitude}, timezone: ${city.timezoneStr}`);
      
      if (typeof city.latitude !== 'number' || typeof city.longitude !== 'number') {
        console.error(`[API Calculate] City '${city.name}' has invalid coordinates: latitude=${city.latitude}, longitude=${city.longitude}`);
        return res.status(400).json({ error: `City '${city.name}' is missing or has invalid latitude or longitude data.` });
      }
      if (!city.timezoneStr) {
        console.error(`[API Calculate] City '${city.name}' is missing timezone data`);
        return res.status(400).json({ error: `City '${city.name}' is missing timezone data.` });
      }

      // 3. Convert local birthDate and birthTime to UTC Date object
      const localDateTimeStr = `${birthDate}T${birthTime}`;
      console.log(`[API Calculate] Attempting to parse local datetime: ${localDateTimeStr} with timezone: ${city.timezoneStr}`);
      
      const luxonDateTime = DateTime.fromISO(localDateTimeStr, { zone: city.timezoneStr });

      if (!luxonDateTime.isValid) {
        console.error(`[API Calculate] Invalid datetime: ${localDateTimeStr} with timezone: ${city.timezoneStr}. Reason: ${luxonDateTime.invalidReason}, Explanation: ${luxonDateTime.invalidExplanation}`);
        return res.status(400).json({ error: `Invalid date or time for the specified timezone. Reason: ${luxonDateTime.invalidReason} | ${luxonDateTime.invalidExplanation}` });
      }
      
      // Convert to UTC
      const utcDateTime = luxonDateTime.toUTC().toJSDate();
      console.log(`[API Calculate] Converted local time to UTC: ${utcDateTime.toISOString()}`);

      // 4. Call calculateNatalChart
      console.log(`[API Calculate] Calling calculateNatalChart with UTC date: ${utcDateTime.toISOString()}, latitude: ${city.latitude}, longitude: ${city.longitude}`);
      
      const chartData = calculateNatalChart({
        utcDateTime,
        latitude: city.latitude,
        longitude: city.longitude,
      });

      if (!chartData) {
        console.error(`[API Calculate] Chart calculation returned null or undefined`);
        // This case might indicate an internal error in calculation if it's not an exception
        return res.status(500).json({ error: "Failed to calculate natal chart. The calculation returned no data." });
      }

      console.log(`[API Calculate] Chart calculation successful with data structure: ${Object.keys(chartData).join(', ')}`);
      
      // 5. Send successful response
      return res.status(200).json(chartData);

    } catch (error) {
      console.error("Natal chart calculation error:", error);
      if (error instanceof Error && error.name === 'ZodError') {
        const validationError = fromZodError(error as any);
        return res.status(400).json({ error: "Invalid request body.", details: validationError.details });
      } 
      // Handle errors from calculateNatalChart if it throws specific errors
      // For now, general error handling:
      if (error instanceof Error) {
         // Check for specific error messages if calculateNatalChart throws them
        if (error.message.includes("Swiss Ephemeris Error")) { // Example error check
             return res.status(500).json({ error: "Calculation error with ephemeris data.", details: error.message });
        }
        return res.status(500).json({ error: error.message });
      }
      return res.status(500).json({ error: "An unknown error occurred during chart calculation." });
    }
  });
  
  // API route to get all cities
  app.get("/api/cities", async (req, res) => {
    try {
      const allCities = await db.select().from(cities).orderBy(cities.name); // Order by name for easier selection
      return res.status(200).json(allCities);
    } catch (error) {
      console.error("Error fetching cities:", error);
      return res.status(500).json({ error: "Failed to fetch cities." });
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
  
  // API route to get specific interpretation
  app.get("/api/interpretations", async (req, res) => {
    try {
      const { elementType, key } = req.query;

      if (!elementType || !key) {
        return res.status(400).json({ error: "elementType and key query parameters are required." });
      }

      const result = await db.select()
        .from(interpretations)
        .where(eq(interpretations.elementType, elementType as string) && eq(interpretations.key, key as string))
        .limit(1);

      if (result.length === 0) {
        return res.status(404).json({ error: "Interpretation not found." });
      }

      return res.status(200).json(result[0]);
    } catch (error) {
      console.error("Error fetching interpretation:", error);
      return res.status(500).json({ error: "Failed to fetch interpretation." });
    }
  });
  
  // Note: The clear users functionality has been removed to maintain data persistence
  
  const httpServer = createServer(app);
  return httpServer;
}
