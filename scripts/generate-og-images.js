import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the public directory exists
const publicDir = path.join(__dirname, '../client/public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Create a simple OG image with logo and text
async function generateOgImage() {
  // First create an SVG with the logo and text
  const svgBuffer = Buffer.from(`
  <svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="630" fill="#000000"/>
    <g transform="translate(600,315) scale(5)">
      <path d="M16 2L3 9L16 16L29 9L16 2Z" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M3 23L16 30L29 23" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M3 16L16 23L29 16" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <text x="600" y="500" font-family="Arial, sans-serif" font-size="60" fill="#ffffff" text-anchor="middle">VibeCodingList</text>
  </svg>
  `);

  // Convert SVG to PNG
  await sharp(svgBuffer)
    .png()
    .toFile(path.join(publicDir, 'og-image.png'));
  
  console.log('Generated og-image.png');
  
  // Also create a default thumbnail without text
  const defaultThumbnailSvg = Buffer.from(`
  <svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="630" fill="#000000"/>
    <g transform="translate(600,315) scale(5)">
      <path d="M16 2L3 9L16 16L29 9L16 2Z" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M3 23L16 30L29 23" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M3 16L16 23L29 16" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </svg>
  `);

  await sharp(defaultThumbnailSvg)
    .png()
    .toFile(path.join(publicDir, 'default-thumbnail.png'));
  
  console.log('Generated default-thumbnail.png');
}

generateOgImage().catch(console.error);