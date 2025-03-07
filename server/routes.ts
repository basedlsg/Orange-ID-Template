import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import express from 'express';
import { fromZodError } from "zod-validation-error";
import fs from 'fs';

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads', { recursive: true });
}

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  })
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure uploads directory exists
  app.use('/uploads', express.static('uploads'));

  // File upload endpoint
  app.post("/api/upload", upload.single('thumbnail'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });

  // Projects API
  app.get("/api/projects", async (req, res) => {
    try {
      const approved = req.query.approved === "true" ? true : 
                      req.query.approved === "false" ? false : undefined;
      const sortBy = req.query.sortBy as string;

      let projects = await storage.getProjects(approved);

      // Apply sorting
      if (sortBy === "views") {
        projects = projects.sort((a, b) => b.views - a.views);
      } else if (sortBy === "newest") {
        projects = projects.sort((a, b) => 
          b.createdAt.getTime() - a.createdAt.getTime()
        );
      }

      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

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
      const project = await storage.approveProject(id);
      res.json(project);
    } catch (error) {
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