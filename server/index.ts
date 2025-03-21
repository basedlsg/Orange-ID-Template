import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seoMiddleware } from "./seo-middleware";
import fs from 'fs';
import path from 'path';
import { storage } from "./storage";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // SEO handling is done by dedicated route in routes.ts
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Add the project page SEO handler before Vite middleware so it takes precedence
  app.get('/projects/:slug', async (req, res, next) => {
    try {
      const { slug } = req.params;
      console.log(`[SEO-Handler] Processing project page for slug: ${slug}`);
      
      // Get all projects first (use the getProjects API)
      const allProjects = await storage.getProjects();
      console.log(`[SEO-Handler] Found ${allProjects.length} total projects in database`);
      
      // Find project by looking through all projects (manual search is most reliable)
      const project = allProjects.find(p => p.slug === slug);
      
      if (!project) {
        console.log(`[SEO-Handler] Project not found for slug: ${slug}, proceeding to client-side routing`);
        return next();
      }
      
      console.log(`[SEO-Handler] Found project: ${project.name}, preparing SEO-optimized HTML`);
      
      // Get the host and protocol for absolute URLs
      const host = req.get('host');
      const protocol = req.protocol;
      const baseUrl = `${protocol}://${host}`;
      
      // Ensure thumbnail URL is absolute
      const thumbnailUrl = project.thumbnail && project.thumbnail.startsWith('http') 
        ? project.thumbnail 
        : project.thumbnail 
          ? `${baseUrl}${project.thumbnail.startsWith('/') ? '' : '/'}${project.thumbnail}` 
          : `${baseUrl}/og-image.png`;
      
      // Read the base HTML template
      let htmlTemplate = fs.readFileSync(path.resolve('./client/index.html'), 'utf8');
      
      // Create custom meta tags
      const pageTitle = `${project.name} - VibeCodingList`;
      const pageDescription = project.description || 'A coding project on VibeCodingList';
      
      // Replace the title tag
      htmlTemplate = htmlTemplate.replace(
        /<title>.*?<\/title>/,
        `<title>${pageTitle}</title>`
      );
      
      // Replace the meta description
      htmlTemplate = htmlTemplate.replace(
        /<meta name="description" content=".*?" \/>/,
        `<meta name="description" content="${pageDescription}" />`
      );
      
      // Replace Open Graph meta tags directly
      htmlTemplate = htmlTemplate.replace(
        /<meta property="og:title" content=".*?" \/>/,
        `<meta property="og:title" content="${pageTitle}" />`
      );
      
      htmlTemplate = htmlTemplate.replace(
        /<meta property="og:description" content=".*?" \/>/,
        `<meta property="og:description" content="${pageDescription}" />`
      );
      
      htmlTemplate = htmlTemplate.replace(
        /<meta property="og:image" content=".*?" \/>/,
        `<meta property="og:image" content="${thumbnailUrl}" />`
      );
      
      htmlTemplate = htmlTemplate.replace(
        /<meta property="og:url" content=".*?" \/>/,
        `<meta property="og:url" content="${baseUrl}/projects/${slug}" />`
      );
      
      htmlTemplate = htmlTemplate.replace(
        /<meta property="og:type" content=".*?" \/>/,
        `<meta property="og:type" content="article" />`
      );
      
      // Replace Twitter Card meta tags directly
      htmlTemplate = htmlTemplate.replace(
        /<meta property="twitter:title" content=".*?" \/>/,
        `<meta property="twitter:title" content="${pageTitle}" />`
      );
      
      htmlTemplate = htmlTemplate.replace(
        /<meta property="twitter:description" content=".*?" \/>/,
        `<meta property="twitter:description" content="${pageDescription}" />`
      );
      
      htmlTemplate = htmlTemplate.replace(
        /<meta property="twitter:image" content=".*?" \/>/,
        `<meta property="twitter:image" content="${thumbnailUrl}" />`
      );
      
      // Add Twitter creator if available
      if (project.xHandle) {
        const creatorMeta = `<meta property="twitter:creator" content="${project.xHandle}" />`;
        // Check if creator meta already exists, if not add it before the Robots section
        if (!htmlTemplate.includes('twitter:creator')) {
          htmlTemplate = htmlTemplate.replace(
            '<!-- Robots and Canonical -->',
            `${creatorMeta}\n    <!-- Robots and Canonical -->`
          );
        } else {
          htmlTemplate = htmlTemplate.replace(
            /<meta property="twitter:creator" content=".*?" \/>/,
            creatorMeta
          );
        }
      }
      
      // Update canonical URL to point to this project
      htmlTemplate = htmlTemplate.replace(
        /<link rel="canonical" href=".*?" \/>/,
        `<link rel="canonical" href="${baseUrl}/projects/${slug}" />`
      );
      
      // Add a debugging marker to verify this is being used
      htmlTemplate = htmlTemplate.replace(
        '</head>',
        '<!-- SEO-optimized by server-side rendering: high-priority handler -->\n  </head>'
      );
      
      console.log(`[SEO-Handler] Meta tags updated for project: ${project.name}, serving specialized HTML`);
      
      // Set appropriate headers
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlTemplate);
    } catch (error) {
      console.error('[SEO-Handler] Error processing project page:', error);
      next(); // Proceed to client-side rendering on error
    }
  });
  
  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
