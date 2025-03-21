import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

// This middleware injects SEO meta tags for specific routes
export async function seoMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const url = req.originalUrl || req.url;
    
    // Check if it's a project page
    const projectSlugMatch = url.match(/\/project\/([^\/\?]+)/);
    
    if (projectSlugMatch) {
      const slug = projectSlugMatch[1];
      const project = await storage.getProjectBySlug(slug);
      
      if (project) {
        // Store the original send function
        const originalSend = res.send;
        
        // Override the send function
        res.send = function(body: any) {
          if (typeof body === 'string') {
            // Define the meta tags to inject
            const metaTags = `
    <!-- OpenGraph Meta Tags -->
    <meta property="og:title" content="${project.name} - VibeCodingList">
    <meta property="og:description" content="${project.description}">
    <meta property="og:image" content="${project.thumbnail || '/og-image.png'}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="${req.protocol}://${req.get('host')}${req.originalUrl}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="VibeCodingList">

    <!-- Twitter Card Meta Tags -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:site" content="@vibecodinglist">
    <meta property="twitter:title" content="${project.name} - VibeCodingList">
    <meta property="twitter:description" content="${project.description}">
    <meta property="twitter:image" content="${project.thumbnail || '/og-image.png'}">
    <meta property="twitter:creator" content="${project.xHandle || '@vibecodinglist'}">
`;
            
            // Find the position after opening head tag
            const headPosition = body.indexOf('</title>');
            
            if (headPosition !== -1) {
              // Insert meta tags after the title
              body = body.slice(0, headPosition + 8) + metaTags + body.slice(headPosition + 8);
            }
          }
          
          // Call the original send function
          return originalSend.call(this, body);
        };
      }
    }
    
    next();
  } catch (error) {
    console.error('SEO middleware error:', error);
    next();
  }
}