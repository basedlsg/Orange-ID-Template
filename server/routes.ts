import { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProjectSchema, 
  insertUserSchema,
  type Project,
  type InsertProject,
  type User,
  type InsertUser
} from "@shared/schema";
import multer from "multer";
import express from 'express';
import { fromZodError } from "zod-validation-error";
import { parse } from 'csv-parse';
import fetch from 'node-fetch';
import { uploadToGCS } from "./utils/storage";
import fs from 'fs'; // Added import for fs

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // File upload endpoint with Google Cloud Storage
  app.post("/api/upload", upload.single('thumbnail'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      // Upload to Google Cloud Storage
      const publicUrl = await uploadToGCS(req.file);
      res.json({ url: publicUrl });
    } catch (error) {
      console.error('Error uploading to Google Cloud Storage:', error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // Batch project creation from CSV
  app.post("/api/projects/batch", upload.single('csv'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No CSV file uploaded" });
    }

    try {
      const projects: any[] = [];
      const parser = fs.createReadStream(req.file.path).pipe(parse({ columns: true, trim: true }));

      for await (const row of parser) {
        try {
          console.log('Processing CSV row:', row);

          // Process thumbnail if URL is provided
          let thumbnailUrl = '';
          if (row.Thumbnail) {
            thumbnailUrl = await uploadToGCS(row.Thumbnail); //Directly upload to GCS
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

      // Create all projects in database
      const createdProjects = await storage.createProjects(projects, 1); // Using userId 1 for now

      // Clean up CSV file
      fs.unlinkSync(req.file.path);

      res.json({ 
        success: true, 
        count: createdProjects.length,
        message: `Successfully imported ${createdProjects.length} projects` 
      });
    } catch (error) {
      console.error('Error processing CSV:', error);
      // Clean up CSV file in case of error
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
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
      const validationError = fromZodError(error as any);
      res.status(400).json({ error: validationError.message });
    }
  });

  // Add this endpoint after the existing /api/users endpoint
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

  // Projects API
  app.get("/api/projects", async (req, res) => {
    try {
      // Explicitly parse the approved parameter
      // undefined means get all projects
      // true means get only approved projects
      // false means get only unapproved projects
      const approved = req.query.approved === "true" ? true :
                        req.query.approved === "false" ? false : undefined;
      const sortBy = req.query.sortBy as string;

      console.log("Fetching projects with approved:", approved);
      let projects = await storage.getProjects(approved);

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

  // Project creation endpoint
  app.post("/api/projects", async (req, res) => {
    try {
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

      // For demo, use userId 1 since we don't have auth yet
      const project = await storage.createProject(validatedData, 1);
      res.json(project);
    } catch (error) {
      console.error("Project validation error:", error);
      const validationError = fromZodError(error as any);
      res.status(400).json({ error: validationError.message });
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

  const httpServer = createServer(app);
  return httpServer;
}