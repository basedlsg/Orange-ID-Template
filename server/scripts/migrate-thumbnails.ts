import { db } from "../db";
import { sql } from "drizzle-orm";
import fs from 'fs';
import path from 'path';
import { uploadToGCS } from "../utils/storage";
import { projects } from "@shared/schema";

async function migrateProjectThumbnails() {
  try {
    // Get all projects with local thumbnails
    const projectsToMigrate = await db.query.projects.findMany({
      where: sql`thumbnail LIKE '/uploads/%'`
    });

    console.log(`Found ${projectsToMigrate.length} projects with local thumbnails to migrate`);

    for (const project of projectsToMigrate) {
      try {
        if (!project.thumbnail) continue;

        // Get the local file path
        const localPath = path.join(process.cwd(), project.thumbnail);

        if (!fs.existsSync(localPath)) {
          console.log(`File not found for project ${project.id}: ${localPath}`);
          continue;
        }

        // Create a file object that matches Multer's file interface
        const file = {
          buffer: fs.readFileSync(localPath),
          originalname: path.basename(localPath),
          mimetype: 'image/jpeg'
        };

        // Upload to Google Cloud Storage
        const gcsUrl = await uploadToGCS(file as Express.Multer.File);

        // Update the project with the new URL
        await db.update(projects)
          .set({ thumbnail: gcsUrl })
          .where(sql`id = ${project.id}`);

        console.log(`Migrated thumbnail for project ${project.id}: ${gcsUrl}`);
      } catch (error) {
        console.error(`Error migrating project ${project.id}:`, error);
      }
    }

    console.log('Thumbnail migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
migrateProjectThumbnails().catch(console.error);