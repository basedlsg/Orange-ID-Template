import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

// This middleware injects SEO meta tags for specific routes
export async function seoMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const url = req.originalUrl || req.url;
    console.log('SEO middleware processing URL:', url);
    
    // Check if it's a project page
    const projectSlugMatch = url.match(/\/project\/([^\/\?]+)/);
    
    if (projectSlugMatch) {
      const slug = projectSlugMatch[1];
      console.log('Found project slug:', slug);
      
      const project = await storage.getProjectBySlug(slug);
      
      if (project) {
        console.log('Found project with name:', project.name, 'and thumbnail:', project.thumbnail);
        
        // Store the original send function
        const originalSend = res.send;
        
        // Get the host and protocol for absolute URLs
        const host = req.get('host');
        const protocol = req.protocol;
        const baseUrl = `${protocol}://${host}`;
        
        // Ensure thumbnail URL is absolute (project.thumbnail may already be absolute)
        const thumbnailUrl = project.thumbnail && project.thumbnail.startsWith('http') 
          ? project.thumbnail 
          : project.thumbnail 
            ? `${baseUrl}${project.thumbnail.startsWith('/') ? '' : '/'}${project.thumbnail}` 
            : `${baseUrl}/og-image.png`;
            
        console.log('Using thumbnail URL:', thumbnailUrl);
        
        // Override the send function
        res.send = function(body: any) {
          if (typeof body === 'string') {
            // Define the meta tags to inject
            const metaTags = `
    <!-- OpenGraph Meta Tags -->
    <meta property="og:title" content="${project.name} - VibeCodingList">
    <meta property="og:description" content="${project.description}">
    <meta property="og:image" content="${thumbnailUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="${baseUrl}${req.originalUrl}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="VibeCodingList">

    <!-- Twitter Card Meta Tags -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:site" content="@vibecodinglist">
    <meta property="twitter:title" content="${project.name} - VibeCodingList">
    <meta property="twitter:description" content="${project.description}">
    <meta property="twitter:image" content="${thumbnailUrl}">
    <meta property="twitter:creator" content="${project.xHandle || '@vibecodinglist'}">
`;
            
            // Find the position after title tag
            const headPosition = body.indexOf('</title>');
            
            if (headPosition !== -1) {
              // Insert meta tags after the title
              body = body.slice(0, headPosition + 8) + metaTags + body.slice(headPosition + 8);
              console.log('Meta tags injected successfully for project:', project.name);
            } else {
              console.error('Could not find </title> tag in the HTML');
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