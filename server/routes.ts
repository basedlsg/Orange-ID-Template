import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Projects API
  app.get("/api/projects", async (req, res) => {
    const approved = req.query.approved === "true";
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
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      // For demo, use userId 1 since we don't have auth yet
      const project = await storage.createProject(projectData, 1);
      res.json(project);
    } catch (error) {
      res.status(400).json({ error: "Invalid project data" });
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
