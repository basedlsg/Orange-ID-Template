import { db } from "../db";
import { sql } from "drizzle-orm";
import fs from 'fs';
import path from 'path';
import { uploadToGCS } from "../utils/storage";
import { projects } from "@shared/schema";
import fetch from 'node-fetch';

async function migrateSpecificProjects() {
  try {
    // Get specific projects that still have local thumbnails
    const projectsToMigrate = await db.query.projects.findMany({
      where: sql`id IN (100, 101) AND thumbnail LIKE '/uploads/%'`
    });

    console.log(`Found ${projectsToMigrate.length} projects to migrate`);

    for (const project of projectsToMigrate) {
      try {
        if (!project.thumbnail) continue;

        console.log(`Processing project ${project.id}: ${project.name}`);

        // Create a file object that matches Multer's file interface
        const file = {
          buffer: await fetch(`http://localhost:5000${project.thumbnail}`)
            .then(res => res.buffer()),
          originalname: path.basename(project.thumbnail),
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
migrateSpecificProjects().catch(console.error);