import { 
  users, type User, type InsertUser,
  projects, type Project, type InsertProject,
  likes, type Like, type InsertLike
} from "@shared/schema";
import { db, sql } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByOrangeId(orangeId: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Project operations
  getProjects(approved?: boolean): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject, userId: number): Promise<Project>;
  approveProject(id: number): Promise<Project>;
  incrementViews(id: number): Promise<void>;
  deleteProject(id: number): Promise<void>;
  getUserProjects(orangeId: string): Promise<Project[]>; // Added getUserProjects

  // Like operations
  createLike(orangeId: string, projectId: number): Promise<Like>;
  deleteLike(orangeId: string, projectId: number): Promise<void>;
  getUserLikes(orangeId: string): Promise<(Like & { project: Project })[]>;
  getLike(orangeId: string, projectId: number): Promise<Like | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByOrangeId(orangeId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.orangeId, orangeId));
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
      return db
        .select({
          ...projects,
          likeCount: sql`COALESCE(${projects.likeCount}, 0)`,
        })
        .from(projects)
        .where(eq(projects.approved, approved));
    }
    return db
      .select({
        ...projects,
        likeCount: sql`COALESCE(${projects.likeCount}, 0)`,
      })
      .from(projects);
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(insertProject: InsertProject, userId: number): Promise<Project> {
    if (!userId) {
      throw new Error("User ID is required to create a project");
    }

    const aiToolsArray = `{${insertProject.aiTools.map(tool => `"${tool}"`).join(',')}}`;
    const genresArray = `{${insertProject.genres.map(genre => `"${genre}"`).join(',')}}`;

    const [project] = await db
      .insert(projects)
      .values({
        name: insertProject.name,
        description: insertProject.description,
        url: insertProject.url,
        thumbnail: insertProject.thumbnail,
        xHandle: insertProject.xHandle,
        userId,
        aiTools: sql`${aiToolsArray}::text[]`,
        genres: sql`${genresArray}::text[]`,
        sponsorshipEnabled: insertProject.sponsorshipEnabled || false,
        sponsorshipUrl: insertProject.sponsorshipUrl,
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

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async getUserLikes(orangeId: string): Promise<(Like & { project: Project })[]> {
    return db
      .select({
        id: likes.id,
        orangeId: likes.orangeId,
        projectId: likes.projectId,
        createdAt: likes.createdAt,
        project: projects
      })
      .from(likes)
      .innerJoin(projects, eq(likes.projectId, projects.id))
      .where(eq(likes.orangeId, orangeId))
      .execute();
  }

  async getLike(orangeId: string, projectId: number): Promise<Like | undefined> {
    const [like] = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.orangeId, orangeId),
          eq(likes.projectId, projectId)
        )
      );
    return like;
  }

  async createLike(orangeId: string, projectId: number): Promise<Like> {
    // Start a transaction to ensure atomicity
    return await db.transaction(async (tx) => {
      // Create the like
      const [like] = await tx
        .insert(likes)
        .values({ orangeId, projectId })
        .returning();

      // Increment the project's like count
      await tx
        .update(projects)
        .set({ likeCount: sql`${projects.likeCount} + 1` })
        .where(eq(projects.id, projectId));

      return like;
    });
  }

  async deleteLike(orangeId: string, projectId: number): Promise<void> {
    // Start a transaction to ensure atomicity
    await db.transaction(async (tx) => {
      // Delete the like
      await tx
        .delete(likes)
        .where(
          and(
            eq(likes.orangeId, orangeId),
            eq(likes.projectId, projectId)
          )
        );

      // Decrement the project's like count
      await tx
        .update(projects)
        .set({ likeCount: sql`${projects.likeCount} - 1` })
        .where(eq(projects.id, projectId));
    });
  }

  async getUserProjects(orangeId: string): Promise<Project[]> {
    return db
      .select({
        ...projects,
        likeCount: sql`COALESCE(${projects.likeCount}, 0)`,
      })
      .from(projects)
      .where(eq(projects.userId, orangeId)) //Corrected to use userId instead of orangeId
      .execute();
  }
}

export const storage = new DatabaseStorage();