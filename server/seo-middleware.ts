import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import fs from 'fs';
import path from 'path';

// This middleware injects SEO meta tags for specific routes by modifying the index.html template
export async function seoMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const url = req.originalUrl || req.url;
    console.log('SEO middleware processing URL:', url);
    
    // Only process HTML requests, not assets, JavaScript, CSS, etc.
    if (url.includes('.') && !url.endsWith('.html')) {
      return next(); // Skip for non-HTML resources
    }
    
    // Check if it's a project page (match both singular and plural forms)
    const projectSlugMatch = url.match(/\/projects?\/([^\/\?]+)/);
    
    if (projectSlugMatch) {
      const slug = projectSlugMatch[1];
      console.log('Found project slug:', slug);
      
      const project = await storage.getProjectBySlug(slug);
      console.log('DB Query result for project slug:', slug, project ? 'Found' : 'Not found');
      
      if (project) {
        console.log('Found project with name:', project.name, 'and thumbnail:', project.thumbnail);
        
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

        // Store the original send function
        const originalEnd = res.end;
        const originalWrite = res.write;
        const originalWriteHead = res.writeHead;
        
        // Create buffer to collect response data
        let chunks: Buffer[] = [];
        let isHtml = false;
        
        // Override writeHead to check content type
        res.writeHead = function(statusCode: number, headers?: any) {
          console.log(`writeHead called for project ${project.name} with status ${statusCode}`);
          
          // Log headers for debugging
          if (headers) {
            console.log('Headers in writeHead:', JSON.stringify(headers));
          } else {
            // Log all response headers
            const allHeaders: Record<string, any> = {};
            const headerNames = res.getHeaderNames();
            headerNames.forEach(name => {
              allHeaders[name] = res.getHeader(name);
            });
            console.log('Current response headers:', JSON.stringify(allHeaders));
          }
          
          // Always set the flag to true for project pages to ensure we capture the response
          isHtml = true;
          console.log(`isHtml set to ${isHtml} for project ${project.name}`);
          
          // Call original method
          return originalWriteHead.apply(this, arguments as any);
        };
        
        // Override write method to capture chunks
        res.write = function(chunk: any, ...args: any[]) {
          console.log(`write called for project ${project.name}, chunk length: ${chunk ? (Buffer.isBuffer(chunk) ? chunk.length : chunk.toString().length) : 'undefined'}`);
          
          if (isHtml) {
            console.log(`Capturing HTML chunk for project ${project.name}`);
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            return true;
          }
          
          console.log(`Not capturing chunk for project ${project.name} (not HTML)`);
          return originalWrite.apply(this, [chunk, ...args]);
        };
        
        // Override end method to process and inject meta tags
        res.end = function(chunk?: any, ...args: any[]) {
          console.log(`end called for project ${project.name}, chunk: ${chunk ? 'provided' : 'not provided'}`);
          
          if (isHtml) {
            console.log(`Processing HTML response for project ${project.name}`);
            if (chunk) {
              console.log(`Adding final chunk for project ${project.name}`);
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }
            
            const body = Buffer.concat(chunks).toString();
            console.log(`Captured HTML response for project ${project.name}, length: ${body.length}`);
            
            // Create meta tags for this project
            const ogTags = `
    <!-- OpenGraph Meta Tags for ${project.name} -->
    <meta property="og:title" content="${project.name} - VibeCodingList" />
    <meta property="og:description" content="${project.description || 'A coding project on VibeCodingList'}" />
    <meta property="og:image" content="${thumbnailUrl}" />
    <meta property="og:url" content="${baseUrl}${req.originalUrl}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="VibeCodingList" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />`;
    
            const twitterTags = `
    <!-- Twitter Card Meta Tags for ${project.name} -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:site" content="@vibecodinglist" />
    <meta property="twitter:title" content="${project.name} - VibeCodingList" />
    <meta property="twitter:description" content="${project.description || 'A coding project on VibeCodingList'}" />
    <meta property="twitter:image" content="${thumbnailUrl}" />
    <meta property="twitter:creator" content="${project.xHandle || '@vibecodinglist'}" />`;
            
            // Find where to insert meta tags (after title tag is ideal)
            let modifiedBody = body;
            
            // Look for specific tags to replace
            const ogSection = modifiedBody.indexOf('<!-- Default Open Graph Meta Tags');
            const ogSectionEnd = modifiedBody.indexOf('<!-- Default Twitter Card Meta Tags');
            
            if (ogSection !== -1 && ogSectionEnd !== -1) {
              // Replace OpenGraph section
              console.log(`Found OG section from ${ogSection} to ${ogSectionEnd}, replacing it`);
              modifiedBody = modifiedBody.substring(0, ogSection) + ogTags + '\n' + modifiedBody.substring(ogSectionEnd);
            }
            
            // Now find Twitter section in the modified body
            const twitterSection = modifiedBody.indexOf('<!-- Default Twitter Card Meta Tags');
            const twitterSectionEnd = modifiedBody.indexOf('<!-- Robots and Canonical', twitterSection);
            
            if (twitterSection !== -1 && twitterSectionEnd !== -1) {
              // Replace Twitter section
              console.log(`Found Twitter section from ${twitterSection} to ${twitterSectionEnd}, replacing it`);
              modifiedBody = modifiedBody.substring(0, twitterSection) + twitterTags + '\n' + modifiedBody.substring(twitterSectionEnd);
            }
            
            // Fallback: if no sections found, try to insert after title tag
            if (ogSection === -1 || twitterSection === -1) {
              const titleEnd = modifiedBody.indexOf('</title>');
              if (titleEnd !== -1) {
                console.log('Using fallback: inserting meta tags after title tag');
                modifiedBody = modifiedBody.substring(0, titleEnd + 8) + 
                              '\n' + ogTags + '\n' + twitterTags + '\n' + 
                              modifiedBody.substring(titleEnd + 8);
              }
            }
            
            console.log('Meta tags injection completed for project: ' + project.name);
            return originalEnd.call(this, modifiedBody);
          }
          
          // For non-HTML responses, proceed normally
          if (chunk) {
            return originalEnd.call(this, chunk, ...args);
          }
          return originalEnd.call(this);
        };
      }
    }
    
    next();
  } catch (error) {
    console.error('SEO middleware error:', error);
    next();
  }
}