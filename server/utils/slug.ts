import { sql } from "drizzle-orm";
import { db } from "../db";
import { projects } from "@shared/schema";

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50); // Limit length
}

export async function generateUniqueSlug(baseName: string): Promise<string> {
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
