import { db } from "../db";
import { sql } from "drizzle-orm";
import { projects } from "@shared/schema";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50); // Limit length
}

async function generateUniqueSlug(baseName: string): Promise<string> {
  let slug = generateSlug(baseName);
  let counter = 1;
  let isUnique = false;

  while (!isUnique) {
    // Check if the current slug exists
    const existing = await db.query.projects.findFirst({
      where: sql`slug = ${slug}`
    });

    if (!existing) {
      isUnique = true;
    } else {
      // If exists, append counter and try again
      slug = `${generateSlug(baseName)}-${counter}`;
      counter++;
    }
  }

  return slug;
}

async function migrateProjectSlugs() {
  try {
    // Get all projects
    const allProjects = await db.query.projects.findMany();
    
    console.log(`Found ${allProjects.length} projects to migrate`);

    for (const project of allProjects) {
      try {
        console.log(`Processing project ${project.id}: ${project.name}`);
        
        // Generate unique slug for this project
        const slug = await generateUniqueSlug(project.name);
        
        // Update the project with the new slug
        await db.update(projects)
          .set({ slug })
          .where(sql`id = ${project.id}`);

        console.log(`Updated project ${project.id} with slug: ${slug}`);
      } catch (error) {
        console.error(`Error processing project ${project.id}:`, error);
      }
    }

    console.log('Slug migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
migrateProjectSlugs().catch(console.error);
