import { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertProjectSchema,
  insertUserSchema,
  type Project,
  type InsertProject,
  type User,
  type InsertUser,
  projects
} from "@shared/schema";
import { sql } from "drizzle-orm";
import { db } from "./db";
import multer from "multer";
import path from "path";
import express from 'express';
import { fromZodError } from "zod-validation-error";
import { parse } from 'csv-parse/sync';
import fetch from 'node-fetch';
import { uploadToGCS } from "./utils/storage";
import { insertAdvertisingRequestSchema } from "@shared/schema";
import { fromError } from "zod-validation-error";
import OAuth from 'oauth';
import session from "express-session";
import { MemoryStore } from "express-session";

// Add this before registerRoutes function
const oauth = new OAuth.OAuth(
  'https://api.twitter.com/oauth/request_token',
  'https://api.twitter.com/oauth/access_token',
  process.env.TWITTER_API_KEY!,
  process.env.TWITTER_API_SECRET!,
  '1.0A',
  'http://localhost:5000/api/auth/twitter/callback',
  'HMAC-SHA1'
);

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

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
  // Add session middleware before routes
  app.use(
    session({
      secret: "your-secret-key", // Replace with a strong, randomly generated secret
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore(),
    })
  );

  // Ensure uploads directory exists
  app.use('/uploads', express.static('uploads'));

  // File upload endpoint with Google Cloud Storage
  app.post("/api/upload", upload.single('thumbnail'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      const publicUrl = await uploadToGCS(req.file);
      res.json({ url: publicUrl });
    } catch (error) {
      console.error('Error uploading to Google Cloud Storage:', error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // Batch project creation from CSV
  app.post("/api/projects/batch", upload.single('csv'), async (req, res) => {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No CSV file uploaded" });
    }

    try {
      // Parse CSV from buffer directly
      const projects: any[] = [];
      const rows = parse(req.file.buffer.toString(), {
        columns: true,
        trim: true,
        skipEmptyLines: true
      });

      for (const row of rows) {
        try {
          console.log('Processing CSV row:', row);

          // Process thumbnail if URL is provided
          let thumbnailUrl = '';
          if (row.Thumbnail) {
            // Download image and create a Multer-like file object
            const response = await fetch(row.Thumbnail);
            if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

            // Use arrayBuffer instead of deprecated buffer()
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const file = {
              buffer,
              originalname: `thumbnail-${Date.now()}.jpg`,
              mimetype: response.headers.get('content-type') || 'image/jpeg'
            };

            // Upload directly to GCS using our utility
            thumbnailUrl = await uploadToGCS(file as Express.Multer.File);
          }

          const isSponsored = row.Sponsorship?.toLowerCase() === 'true';

          // Convert CSV row to project data
          const projectData = {
            name: row['Project Name'],
            description: row.Description,
            url: row['Project URL'],
            aiTools: row.Tool ? row.Tool.split(',').map((t: string) => t.trim()).filter(Boolean) : undefined,
            genres: row.Genre ? row.Genre.split(',').map((g: string) => g.trim()).filter(Boolean) : [],
            thumbnail: thumbnailUrl || undefined,
            xHandle: row['X Handle'] || undefined,
            sponsorshipEnabled: isSponsored,
            ...(isSponsored && row.SponsorshipUrl ? { sponsorshipUrl: row.SponsorshipUrl } : {})
          };

          console.log('Constructed project data:', projectData);

          // Validate project data
          const validatedData = insertProjectSchema.parse(projectData);
          projects.push(validatedData);
        } catch (error) {
          console.error('Error processing CSV row:', error);
          if (error instanceof Error) {
            throw new Error(`Failed to process row: ${error.message}`);
          }
        }
      }

      if (projects.length === 0) {
        throw new Error("No valid projects found in CSV");
      }

      // Create all projects in database with the correct user ID
      const createdProjects = await storage.createProjects(projects, user.userId);

      res.json({
        success: true,
        count: createdProjects.length,
        message: `Successfully imported ${createdProjects.length} projects`
      });
    } catch (error) {
      console.error('Error processing CSV:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to process CSV file" });
    }
  });

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
        return res.json(existingUser); // Return existing user if found
      }

      // Create new user
      const user = await storage.createUser(validatedData);
      console.log("Created user:", user);
      res.json(user);
    } catch (error) {
      console.error("User creation error:", error);
      if (error instanceof Error) {
        const validationError = fromError(error);
        res.status(400).json({ error: validationError.message });
      } else {
        res.status(500).json({ error: "Unexpected error occurred" });
      }
    }
  });

  // Add this endpoint to get user's submissions by orangeId
  app.get("/api/users/:orangeId/submissions", async (req, res) => {
    try {
      const { orangeId } = req.params;

      // First get the user to get their userId
      const user = await storage.getUserByOrangeId(orangeId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Then fetch all projects and filter by userId
      const allProjects = await storage.getProjects();
      const userProjects = allProjects.filter(project => project.userId === user.id);

      res.json(userProjects);
    } catch (error) {
      console.error("Error fetching user submissions:", error);
      res.status(500).json({ error: "Failed to fetch user submissions" });
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


  // Like-related routes
  app.post("/api/projects/:id/like", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { orangeId } = req.body;

      if (!orangeId) {
        return res.status(400).json({ error: "Orange ID is required" });
      }

      const existingLike = await storage.getLike(orangeId, projectId);
      if (existingLike) {
        // If like already exists, unlike it
        await storage.deleteLike(orangeId, projectId);
      } else {
        // If no like exists, create it
        await storage.createLike(orangeId, projectId);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error toggling project like:", error);
      res.status(500).json({ error: "Failed to toggle project like" });
    }
  });

  app.get("/api/users/:orangeId/likes", async (req, res) => {
    try {
      const { orangeId } = req.params;
      const likedProjectIds = await storage.getUserLikes(orangeId);
      res.json(likedProjectIds);
    } catch (error) {
      console.error("Error fetching user likes:", error);
      res.status(500).json({ error: "Failed to fetch liked projects" });
    }
  });

  app.get("/api/users/:orangeId/liked-projects", async (req, res) => {
    try {
      const { orangeId } = req.params;

      // First get the list of liked project IDs
      const likedIds = await storage.getUserLikes(orangeId);

      // Then fetch all approved projects and filter by liked IDs
      const allProjects = await storage.getProjects(true);
      const likedProjects = allProjects.filter(project => likedIds.includes(project.id));

      res.json(likedProjects);
    } catch (error) {
      console.error("Error fetching liked projects:", error);
      res.status(500).json({ error: "Failed to fetch liked projects" });
    }
  });

  app.get("/api/projects", async (req, res) => {
    try {
      // Parse query parameters
      const approved = req.query.approved === "true" ? true :
                      req.query.approved === "false" ? false : undefined;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const sortBy = req.query.sortBy as string;

      console.log("Fetching projects with approved:", approved, "userId:", userId);
      let projects = await storage.getProjects(approved);

      // Filter by userId if provided
      if (userId) {
        projects = projects.filter(project => project.userId === userId);
      }

      // Apply sorting
      if (sortBy === "views") {
        projects = projects.sort((a, b) => b.views - a.views);
      } else if (sortBy === "newest") {
        projects = projects.sort((a, b) =>
          b.createdAt.getTime() - a.createdAt.getTime()
        );
      }

      console.log(`Returning ${projects.length} projects`);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const user = await getUserFromRequest(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      console.log("Received project data:", JSON.stringify(req.body, null, 2));

      // Validate the project data
      const validatedData = insertProjectSchema.parse({
        name: req.body.name,
        description: req.body.description,
        url: req.body.url,
        aiTools: req.body.aiTools,
        genres: req.body.genres,
        thumbnail: req.body.thumbnail || undefined,
        xHandle: req.body.xHandle || undefined,
        sponsorshipEnabled: req.body.sponsorshipEnabled,
        sponsorshipUrl: req.body.sponsorshipUrl,
      });

      console.log("Validated project data:", JSON.stringify(validatedData, null, 2));

      // Create project with the correct user ID
      const project = await storage.createProject(validatedData, user.userId);
      res.json(project);
    } catch (error) {
      console.error("Project creation error:", error);

      if (error instanceof Error) {
        // Use fromError instead of fromZodError for general errors
        const validationError = fromError(error);
        res.status(400).json({ error: validationError.message });
      } else {
        res.status(500).json({ error: "Failed to create project" });
      }
    }
  });

  app.post("/api/projects/:id/approve", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Approving project ${id}`);
      const project = await storage.approveProject(id);
      console.log("Project approved:", project);
      res.json(project);
    } catch (error) {
      console.error("Error approving project:", error);
      res.status(404).json({ error: "Project not found" });
    }
  });

  app.post("/api/projects/:id/view", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.incrementViews(id);
      res.json({ success: true });
    } catch (error) {
      res.status(404).json({ error: "Project not found" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProject(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // Update project endpoint
  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const user = await getUserFromRequest(req);

      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get the project to check permissions
      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Check if user is admin or project owner
      const dbUser = await storage.getUserByOrangeId(user.orangeId);
      if (!dbUser?.isAdmin && project.userId !== dbUser?.id) {
        return res.status(403).json({ error: "Not authorized to edit this project" });
      }

      console.log("Received project update data:", JSON.stringify(req.body, null, 2));

      // Validate the project data
      const validatedData = insertProjectSchema.parse({
        name: req.body.name,
        description: req.body.description,
        url: req.body.url,
        aiTools: req.body.aiTools,
        genres: req.body.genres,
        thumbnail: req.body.thumbnail || undefined,
        xHandle: req.body.xHandle || undefined,
        sponsorshipEnabled: req.body.sponsorshipEnabled,
        sponsorshipUrl: req.body.sponsorshipUrl,
      });

      console.log("Validated project update data:", JSON.stringify(validatedData, null, 2));

      // Update project while maintaining the approved status and user ID
      const updatedProject = await storage.updateProject(projectId, validatedData);
      res.json(updatedProject);
    } catch (error) {
      console.error("Project update error:", error);
      const validationError = fromZodError(error as any);
      res.status(400).json({ error: validationError.message });
    }
  });

  // Add the GET endpoint for a single project
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProjectById(projectId);

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  // Add the GET endpoint for fetching a project by slug
  app.get("/api/projects/by-slug/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const projects = await storage.getProjects();
      const project = projects.find(p => p.slug === slug);

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Increment view count
      await storage.incrementViews(project.id);

      res.json(project);
    } catch (error) {
      console.error("Error fetching project by slug:", error);
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  // Sitemap endpoint
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const baseUrl = process.env.NODE_ENV === 'production'
        ? 'https://vibecodinglist.com'
        : `http://${req.headers.host}`;

      // Get all approved projects
      const approvedProjects = await storage.getProjects(true);

      // Create sitemap XML
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/submit</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  ${approvedProjects.map(project => `
  <url>
    <loc>${baseUrl}/projects/${project.slug}</loc>
    <lastmod>${new Date(project.createdAt).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
</urlset>`;

      res.header('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).json({ error: "Failed to generate sitemap" });
    }
  });

  // Create advertising request
  app.post("/api/advertising-requests", async (req, res) => {
    try {
      console.log("Received advertising request:", req.body);

      // Validate the request data using the schema
      const validatedData = insertAdvertisingRequestSchema.parse(req.body);
      console.log("Validated advertising request data:", validatedData);

      const request = await storage.createAdvertisingRequest(validatedData);
      console.log("Created advertising request:", request);

      res.json(request);
    } catch (error) {
      console.error("Error creating advertising request:", error);
      if (error instanceof Error) {
        const validationError = fromZodError(error);
        res.status(400).json({ error: validationError.message });
      } else {
        res.status(500).json({ error: "Failed to create advertising request" });
      }
    }
  });

  // Get all advertising requests (admin only)
  app.get("/api/advertising-requests", async (req, res) => {
    try {
      // Check if user is admin
      const user = await getUserFromRequest(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const dbUser = await storage.getUserByOrangeId(user.orangeId);
      if (!dbUser?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const requests = await storage.getAdvertisingRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching advertising requests:", error);
      res.status(500).json({ error: "Failed to fetch advertising requests" });
    }
  });

  // Mark advertising request as processed (admin only)
  app.post("/api/advertising-requests/:id/process", async (req, res) => {
    try {
      // Check if user is admin
      const user = await getUserFromRequest(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const dbUser = await storage.getUserByOrangeId(user.orangeId);
      if (!dbUser?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      const request = await storage.markAdvertisingRequestProcessed(id);
      res.json(request);
    } catch (error) {
      console.error("Error processing advertising request:", error);
      res.status(500).json({ error: "Failed to process advertising request" });
    }
  });

  // Inside registerRoutes, update the Twitter auth route
  app.get("/api/auth/twitter", async (req, res) => {
    try {
      console.log('Initiating Twitter authentication...');
      console.log('API Key available:', !!process.env.TWITTER_API_KEY);
      console.log('API Secret available:', !!process.env.TWITTER_API_SECRET);

      // Get the current host from the request
      const protocol = req.protocol;
      const host = req.get('host');
      const callbackUrl = `${protocol}://${host}/api/auth/twitter/callback`;

      console.log('Using callback URL:', callbackUrl);

      const oauthInstance = new OAuth.OAuth(
        'https://api.twitter.com/oauth/request_token',
        'https://api.twitter.com/oauth/access_token',
        process.env.TWITTER_API_KEY!,
        process.env.TWITTER_API_SECRET!,
        '1.0A',
        callbackUrl,
        'HMAC-SHA1'
      );

      oauthInstance.getOAuthRequestToken((error, oauth_token, oauth_token_secret, results) => {
        if (error) {
          console.error('Error getting OAuth request token:', error);
          return res.status(500).json({ error: "Failed to initiate Twitter authentication" });
        }

        if (!oauth_token || !oauth_token_secret) {
          console.error('Missing OAuth tokens');
          return res.status(500).json({ error: "Invalid OAuth response" });
        }

        // Store tokens in session
        req.session.oauth_token = oauth_token;
        req.session.oauth_token_secret = oauth_token_secret;

        // Redirect to Twitter auth page
        const authUrl = `https://api.twitter.com/oauth/authenticate?oauth_token=${oauth_token}`;
        console.log('Redirecting to:', authUrl);
        res.redirect(authUrl);
      });
    } catch (error) {
      console.error("Error initiating Twitter auth:", error);
      res.status(500).json({ error: "Failed to initiate Twitter authentication" });
    }
  });

  app.get("/api/auth/twitter/callback", async (req, res) => {
    try {
      const { oauth_token, oauth_verifier } = req.query;
      const oauth_token_secret = req.session.oauth_token_secret;
      const oauth_token_from_session = req.session.oauth_token;

      if (!oauth_token_secret || !oauth_token_from_session) {
        throw new Error("No OAuth token secret found in session");
      }

      oauth.getOAuthAccessToken(
        oauth_token_from_session,
        oauth_token_secret,
        oauth_verifier as string,
        async (error, oauth_access_token, oauth_access_token_secret, results) => {
          if (error) {
            console.error('Error getting OAuth access token:', error);
            return res.status(500).send(`
              <script>
                window.opener.postMessage({ type: 'TWITTER_AUTH_ERROR' }, '*');
                window.close();
              </script>
            `);
          }

          try {
            // Get user's Twitter info
            oauth.get(
              'https://api.twitter.com/1.1/account/verify_credentials.json',
              oauth_access_token,
              oauth_access_token_secret,
              async (error, data) => {
                if (error) {
                  throw error;
                }

                const userInfo = JSON.parse(data as string);
                const xHandle = userInfo.screen_name;

                // Get user from the request
                const user = await getUserFromRequest(req);
                if (!user) {
                  throw new Error("User not found");
                }

                // Update user's X handle in the database
                await storage.updateUserXHandle(user.orangeId, xHandle);

                // Send success message back to opener
                res.send(`
                  <script>
                    window.opener.postMessage({ 
                      type: 'TWITTER_AUTH_SUCCESS', 
                      screen_name: '${xHandle}'
                    }, '*');
                    window.close();
                  </script>
                `);
              }
            );
          } catch (error) {
            console.error('Error verifying credentials:', error);
            res.status(500).send(`
              <script>
                window.opener.postMessage({ type: 'TWITTER_AUTH_ERROR' }, '*');
                window.close();
              </script>
            `);
          }
        }
      );
    } catch (error) {
      console.error("Error handling Twitter callback:", error);
      res.status(500).send(`
        <script>
          window.opener.postMessage({ type: 'TWITTER_AUTH_ERROR' }, '*');
          window.close();
        </script>
      `);
    }
  });

  // Add this new endpoint after the existing endpoints
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const leaderboardQuery = sql`
        SELECT 
          x_handle,
          COUNT(*) as total_projects,
          SUM(like_count) as total_likes
        FROM projects 
        WHERE x_handle IS NOT NULL 
          AND x_handle != ''
        GROUP BY x_handle
        ORDER BY total_likes DESC, total_projects DESC
      `;

      const leaderboard = await db.execute(leaderboardQuery);
      res.json(leaderboard.rows);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard data" });
    }
  });

    // Add this new endpoint after the existing ones and before the http server creation
  app.get("/api/creators/:handle", async (req, res) => {
    try {
      const { handle } = req.params;

      // Fetch all approved projects for this creator
      const projects = await storage.getProjects(true); // Get approved projects
      const creatorProjects = projects.filter(p => p.xHandle === handle);

      if (!creatorProjects.length) {
        return res.status(404).json({ error: "No projects found for this creator" });
      }

      // Calculate total likes
      const totalLikes = creatorProjects.reduce((sum, project) => sum + (project.likeCount || 0), 0);

      res.json({
        projects: creatorProjects,
        stats: {
          totalProjects: creatorProjects.length,
          totalLikes: totalLikes
        }
      });
    } catch (error) {
      console.error("Error fetching creator's projects:", error);
      res.status(500).json({ error: "Failed to fetch creator's projects" });
    }
  });

  app.post("/api/users/x-handle", async (req, res) => {
    try {
      const user = await getUserFromRequest(req);
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { xHandle } = req.body;
      if (!xHandle) {
        return res.status(400).json({ error: "X handle is required" });
      }

      // Remove @ symbol if present
      const cleanXHandle = xHandle.replace(/^@/, '');

      // Update the user's X handle
      const updatedUser = await storage.updateUserXHandle(user.orangeId, cleanXHandle);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating X handle:", error);
      res.status(500).json({ error: "Failed to update X handle" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}