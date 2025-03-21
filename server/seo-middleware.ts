import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

// This middleware injects SEO meta tags for specific routes
export async function seoMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const url = req.originalUrl || req.url;
    console.log('SEO middleware processing URL:', url);
    
    // Check if it's a project page (match both singular and plural forms)
    const projectSlugMatch = url.match(/\/projects?\/([^\/\?]+)/);
    
    if (projectSlugMatch) {
      const slug = projectSlugMatch[1];
      console.log('Found project slug:', slug);
      
      const project = await storage.getProjectBySlug(slug);
      console.log('DB Query result for project slug:', slug, project ? 'Found' : 'Not found');
      
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
        
        // Override the send function with a type-safe version
        res.send = function(this: Response, bodyArg: any) {
          const currentBody = bodyArg;
          console.log('Intercepted response for project:', project.name);
          console.log('Response body type:', typeof currentBody, 'length:', typeof currentBody === 'string' ? currentBody.length : 'N/A');
          
          if (typeof currentBody === 'string') {
            // Replace the default meta tags with our custom ones
            let updatedBody = currentBody;
            
            // Find the OG section first using the comment as a marker
            const ogCommentStart = updatedBody.indexOf('<!-- Default Open Graph Meta Tags');
            console.log(`DEBUG: OG comment position: ${ogCommentStart}`);
            
            // Extract and log some context around where we're looking
            if (ogCommentStart !== -1) {
              const contextStart = Math.max(0, ogCommentStart - 100);
              const contextEnd = Math.min(updatedBody.length, ogCommentStart + 300);
              console.log(`Context around OG comment:\n${updatedBody.substring(contextStart, contextEnd)}`);
            }
            
            const nextCommentStart = updatedBody.indexOf('<!--', ogCommentStart + 10); // Find next comment after OG section
            console.log(`DEBUG: Next comment position: ${nextCommentStart}`);
            
            if (ogCommentStart !== -1 && nextCommentStart !== -1) {
              console.log(`Found OG tags section from ${ogCommentStart} to ${nextCommentStart}`);
              
              // Replace the entire OG section
              const ogReplacement = `<!-- OpenGraph Meta Tags (Project: ${project.name}) -->
    <meta property="og:title" content="${project.name} - VibeCodingList" />
    <meta property="og:description" content="${project.description}" />
    <meta property="og:image" content="${thumbnailUrl}" />
    <meta property="og:url" content="${baseUrl}${req.originalUrl}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="VibeCodingList" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
`;
              
              updatedBody = updatedBody.substring(0, ogCommentStart) + ogReplacement + updatedBody.substring(nextCommentStart);
              console.log('OG tags replaced successfully');
            } else {
              console.error('Could not find OG tags section in the HTML');
              
              // Fallback approach: Add after title tag
              const titleTagEnd = updatedBody.indexOf('</title>') + 8; // 8 is length of '</title>'
              if (titleTagEnd > 8) { // Make sure we found the title tag
                const ogMeta = `
    <!-- OpenGraph Meta Tags (Project: ${project.name}) -->
    <meta property="og:title" content="${project.name} - VibeCodingList" />
    <meta property="og:description" content="${project.description}" />
    <meta property="og:image" content="${thumbnailUrl}" />
    <meta property="og:url" content="${baseUrl}${req.originalUrl}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="VibeCodingList" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
`;
                
                updatedBody = updatedBody.substring(0, titleTagEnd) + ogMeta + updatedBody.substring(titleTagEnd);
                console.log('OG tags added after title tag (fallback method)');
              }
            }
            
            // Find the Twitter section using the comment as a marker
            const twitterCommentStart = updatedBody.indexOf('<!-- Default Twitter Card Meta Tags');
            console.log(`DEBUG: Twitter comment position: ${twitterCommentStart}`);
            
            // Extract and log some context around Twitter section
            if (twitterCommentStart !== -1) {
              const contextStart = Math.max(0, twitterCommentStart - 100);
              const contextEnd = Math.min(updatedBody.length, twitterCommentStart + 300);
              console.log(`Context around Twitter comment:\n${updatedBody.substring(contextStart, contextEnd)}`);
            }
            
            const twitterNextCommentStart = updatedBody.indexOf('<!--', twitterCommentStart + 10);
            console.log(`DEBUG: Next comment after Twitter position: ${twitterNextCommentStart}`);
            
            if (twitterCommentStart !== -1 && twitterNextCommentStart !== -1) {
              console.log(`Found Twitter tags section from ${twitterCommentStart} to ${twitterNextCommentStart}`);
              
              // Replace the entire Twitter section
              const twitterReplacement = `<!-- Twitter Card Meta Tags (Project: ${project.name}) -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:site" content="@vibecodinglist" />
    <meta property="twitter:title" content="${project.name} - VibeCodingList" />
    <meta property="twitter:description" content="${project.description}" />
    <meta property="twitter:image" content="${thumbnailUrl}" />
    <meta property="twitter:creator" content="${project.xHandle || '@vibecodinglist'}" />
`;
              
              updatedBody = updatedBody.substring(0, twitterCommentStart) + twitterReplacement + updatedBody.substring(twitterNextCommentStart);
              console.log('Twitter tags replaced successfully');
            } else {
              console.error('Could not find Twitter tags section in the HTML');
              
              // Fallback approach: Add after OG tags if we added them
              const ogProjectStart = updatedBody.indexOf('<!-- OpenGraph Meta Tags (Project:');
              if (ogProjectStart !== -1) {
                // Find end of our injected OG section
                const ogSectionEnd = updatedBody.indexOf('-->', ogProjectStart) + 3;
                
                if (ogSectionEnd > 3) {
                  const twitterMeta = `
    <!-- Twitter Card Meta Tags (Project: ${project.name}) -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:site" content="@vibecodinglist" />
    <meta property="twitter:title" content="${project.name} - VibeCodingList" />
    <meta property="twitter:description" content="${project.description}" />
    <meta property="twitter:image" content="${thumbnailUrl}" />
    <meta property="twitter:creator" content="${project.xHandle || '@vibecodinglist'}" />
`;
                  
                  updatedBody = updatedBody.substring(0, ogSectionEnd) + twitterMeta + updatedBody.substring(ogSectionEnd);
                  console.log('Twitter tags added after OG section (fallback method)');
                }
              }
            }
            
            console.log('Meta tags replacement completed for project:', project.name);
            return originalSend.call(this, updatedBody);
          }
          
          // If the body isn't a string, just pass it through unmodified
          return originalSend.call(this, currentBody);
        };
      }
    }
    
    next();
  } catch (error) {
    console.error('SEO middleware error:', error);
    next();
  }
}