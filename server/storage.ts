import { 
  users, type User, type InsertUser,
  projects, type Project, type InsertProject,
  likes, type Like, type InsertLike,
  advertisingRequests, type AdvertisingRequest, type InsertAdvertisingRequest,
  feedbacks, type Feedback, type InsertFeedback,
  feedbackVotes, type FeedbackVote, type InsertFeedbackVote
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import { generateUniqueSlug } from "./utils/slug";

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
  createProjects(insertProjects: InsertProject[], userId: number): Promise<Project[]>;
  getProjectById(id: number): Promise<Project | undefined>;
  getProjectBySlug(slug: string): Promise<Project | undefined>;
  updateProject(id: number, project: InsertProject): Promise<Project>;

  // Like operations
  createLike(orangeId: string, projectId: number): Promise<Like>;
  deleteLike(orangeId: string, projectId: number): Promise<void>;
  getUserLikes(orangeId: string): Promise<number[]>;
  getLike(orangeId: string, projectId: number): Promise<Like | undefined>;

  // Advertising request operations
  createAdvertisingRequest(request: InsertAdvertisingRequest): Promise<AdvertisingRequest>;
  getAdvertisingRequests(): Promise<AdvertisingRequest[]>;
  markAdvertisingRequestProcessed(id: number): Promise<AdvertisingRequest>;
  
  // Feedback operations
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  getProjectFeedbacks(projectId: number): Promise<Feedback[]>;
  getFeedbackById(id: number): Promise<Feedback | undefined>;
  deleteFeedback(id: number): Promise<void>;
  getAllFeedbackCounts(): Promise<Record<number, number>>;
  
  // Feedback vote operations
  createFeedbackVote(vote: InsertFeedbackVote): Promise<FeedbackVote>;
  deleteFeedbackVote(orangeId: string, feedbackId: number): Promise<void>;
  getUserFeedbackVotes(orangeId: string): Promise<number[]>;
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
      return db.select().from(projects).where(eq(projects.approved, approved));
    }
    return db.select().from(projects);
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

    // Generate a unique slug from the project name
    const slug = await generateUniqueSlug(insertProject.name);

    const [project] = await db
      .insert(projects)
      .values({
        name: insertProject.name,
        slug,
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

  async createProjects(insertProjects: InsertProject[], userId: number): Promise<Project[]> {
    if (!userId) {
      throw new Error("User ID is required to create projects");
    }

    const values = await Promise.all(insertProjects.map(async project => {
      const slug = await generateUniqueSlug(project.name);
      return {
        name: project.name,
        slug,
        description: project.description,
        url: project.url,
        thumbnail: project.thumbnail,
        xHandle: project.xHandle,
        userId,
        aiTools: sql`${`{${project.aiTools.map(tool => `"${tool}"`).join(',')}}`}::text[]`,
        genres: sql`${`{${project.genres.map(genre => `"${genre}"`).join(',')}}`}::text[]`,
        sponsorshipEnabled: project.sponsorshipEnabled || false,
        sponsorshipUrl: project.sponsorshipUrl,
      };
    }));

    return db.insert(projects).values(values).returning();
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

  async getUserLikes(orangeId: string): Promise<number[]> {
    const userLikes = await db
      .select({ projectId: likes.projectId })
      .from(likes)
      .where(eq(likes.orangeId, orangeId));
    return userLikes.map(like => like.projectId);
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

  async createAdvertisingRequest(request: InsertAdvertisingRequest): Promise<AdvertisingRequest> {
    console.log('Creating advertising request with data:', request);
    const [adRequest] = await db.insert(advertisingRequests).values(request).returning();
    console.log('Successfully created advertising request:', adRequest);
    return adRequest;
  }

  async getAdvertisingRequests(): Promise<AdvertisingRequest[]> {
    return db.select().from(advertisingRequests).orderBy(sql`${advertisingRequests.createdAt} DESC`);
  }

  async markAdvertisingRequestProcessed(id: number): Promise<AdvertisingRequest> {
    const [request] = await db
      .update(advertisingRequests)
      .set({ processed: true })
      .where(eq(advertisingRequests.id, id))
      .returning();
    if (!request) throw new Error("Advertising request not found");
    return request;
  }

  async getProjectById(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async updateProject(id: number, updateProject: InsertProject): Promise<Project> {
    const aiToolsArray = `{${updateProject.aiTools.map(tool => `"${tool}"`).join(',')}}`;
    const genresArray = `{${updateProject.genres.map(genre => `"${genre}"`).join(',')}}`;

    const [project] = await db
      .update(projects)
      .set({
        name: updateProject.name,
        description: updateProject.description,
        url: updateProject.url,
        thumbnail: updateProject.thumbnail,
        xHandle: updateProject.xHandle,
        aiTools: sql`${aiToolsArray}::text[]`,
        genres: sql`${genresArray}::text[]`,
        sponsorshipEnabled: updateProject.sponsorshipEnabled || false,
        sponsorshipUrl: updateProject.sponsorshipUrl,
      })
      .where(eq(projects.id, id))
      .returning();

    if (!project) throw new Error("Project not found");
    return project;
  }
  
  async getProjectBySlug(slug: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.slug, slug));
    return project;
  }

  // Feedback methods
  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const [feedback] = await db.insert(feedbacks).values(insertFeedback).returning();
    return feedback;
  }

  async getProjectFeedbacks(projectId: number): Promise<Feedback[]> {
    return db
      .select()
      .from(feedbacks)
      .where(eq(feedbacks.projectId, projectId))
      .orderBy(sql`${feedbacks.upvoteCount} DESC, ${feedbacks.createdAt} DESC`);
  }

  async getFeedbackById(id: number): Promise<Feedback | undefined> {
    const [feedback] = await db.select().from(feedbacks).where(eq(feedbacks.id, id));
    return feedback;
  }

  async deleteFeedback(id: number): Promise<void> {
    await db.delete(feedbacks).where(eq(feedbacks.id, id));
  }

  // Feedback vote methods
  async createFeedbackVote(vote: InsertFeedbackVote): Promise<FeedbackVote> {
    return await db.transaction(async (tx) => {
      // Create the vote
      const [feedbackVote] = await tx
        .insert(feedbackVotes)
        .values(vote)
        .returning();

      // Increment the feedback's upvote count
      await tx
        .update(feedbacks)
        .set({ upvoteCount: sql`${feedbacks.upvoteCount} + 1` })
        .where(eq(feedbacks.id, vote.feedbackId));

      return feedbackVote;
    });
  }

  async deleteFeedbackVote(orangeId: string, feedbackId: number): Promise<void> {
    await db.transaction(async (tx) => {
      // Delete the vote
      await tx
        .delete(feedbackVotes)
        .where(
          and(
            eq(feedbackVotes.orangeId, orangeId),
            eq(feedbackVotes.feedbackId, feedbackId)
          )
        );

      // Decrement the feedback's upvote count
      await tx
        .update(feedbacks)
        .set({ upvoteCount: sql`${feedbacks.upvoteCount} - 1` })
        .where(eq(feedbacks.id, feedbackId));
    });
  }

  async getUserFeedbackVotes(orangeId: string): Promise<number[]> {
    const userVotes = await db
      .select({ feedbackId: feedbackVotes.feedbackId })
      .from(feedbackVotes)
      .where(eq(feedbackVotes.orangeId, orangeId));
    return userVotes.map(vote => vote.feedbackId);
  }
  
  async getAllFeedbackCounts(): Promise<Record<number, number>> {
    // Use SQL's COUNT and GROUP BY to efficiently get counts by project
    const counts = await db
      .select({
        projectId: feedbacks.projectId,
        count: sql<number>`COUNT(*)`,
      })
      .from(feedbacks)
      .groupBy(feedbacks.projectId);
    
    // Convert array of counts to a map of projectId -> count
    const countMap: Record<number, number> = {};
    for (const item of counts) {
      countMap[item.projectId] = item.count;
    }
    
    return countMap;
  }
}

export const storage = new DatabaseStorage();