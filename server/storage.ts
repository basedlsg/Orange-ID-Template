import { 
  users, type User, type InsertUser,
  projects, type Project, type InsertProject 
} from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private userId: number;
  private projectId: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.userId = 1;
    this.projectId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id, isAdmin: false };
    this.users.set(id, user);
    return user;
  }

  async getProjects(approved?: boolean): Promise<Project[]> {
    const projects = Array.from(this.projects.values());
    if (approved !== undefined) {
      return projects.filter(p => p.approved === approved);
    }
    return projects;
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject, userId: number): Promise<Project> {
    const id = this.projectId++;
    const now = new Date();
    const project: Project = {
      ...insertProject,
      id,
      userId,
      approved: false,
      views: 0,
      createdAt: now,
    };
    this.projects.set(id, project);
    return project;
  }

  async approveProject(id: number): Promise<Project> {
    const project = await this.getProject(id);
    if (!project) {
      throw new Error("Project not found");
    }
    const updatedProject = { ...project, approved: true };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async incrementViews(id: number): Promise<void> {
    const project = await this.getProject(id);
    if (!project) {
      throw new Error("Project not found");
    }
    const updatedProject = { ...project, views: project.views + 1 };
    this.projects.set(id, updatedProject);
  }
}

export const storage = new MemStorage();
