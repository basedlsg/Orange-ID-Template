import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertUserSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import express from 'express';
import { fromZodError } from "zod-validation-error";
import fs from 'fs';
import sharp from 'sharp';

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads', { recursive: true });
}

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      // Always use .jpg extension for consistency
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = '.jpg'; // Force jpg extension
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
  })
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure uploads directory exists
  app.use('/uploads', express.static('uploads'));

  // File upload endpoint with image processing
  app.post("/api/upload", upload.single('thumbnail'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      // Process the image with Sharp
      await sharp(req.file.path)
        .jpeg({ quality: 90 }) // Convert to JPEG with good quality
        .toFile(req.file.path + '.processed');

      // Replace the original file with the processed one
      fs.unlinkSync(req.file.path);
      fs.renameSync(req.file.path + '.processed', req.file.path);

      const url = `/uploads/${req.file.filename}`;
      res.json({ url });
    } catch (error) {
      console.error('Error processing image:', error);
      // Clean up files in case of error
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      if (fs.existsSync(req.file.path + '.processed')) fs.unlinkSync(req.file.path + '.processed');
      res.status(500).json({ error: "Failed to process image" });
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

  const httpServer = createServer(app);
  return httpServer;
}