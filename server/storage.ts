import { 
  users, type User, type InsertUser,
  projects, type Project, type InsertProject 
} from "@shared/schema";
import { db, sql } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Project operations
  getProjects(approved?: boolean): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject, userId: number): Promise<Project>;
  approveProject(id: number): Promise<Project>;
  incrementViews(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getProjects(approved?: boolean): Promise<Project[]> {
    if (approved !== undefined) {
      return db.select().from(projects).where(eq(projects.approved, approved));
    }
    return db.select().from(projects);
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(insertProject: InsertProject, userId: number): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values({
        ...insertProject,
        userId,
        aiTools: sql`${insertProject.aiTools}::text[]`,
      })
      .returning();
    return project;
  }

  async approveProject(id: number): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ approved: true })
      .where(eq(projects.id, id))
      .returning();
    if (!project) throw new Error("Project not found");
    return project;
  }

  async incrementViews(id: number): Promise<void> {
    await db
      .update(projects)
      .set({
        views: sql`${projects.views} + 1`,
      })
      .where(eq(projects.id, id));
  }
}

export const storage = new DatabaseStorage();