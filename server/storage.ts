import { v4 as uuidv4 } from 'uuid';
import {
  users, messages, visualizations,
  User, InsertUser,
  Visualization, InsertVisualization,
  Message, InsertMessage
} from '@shared/schema';
import { db } from './db';
import { eq, desc } from 'drizzle-orm';

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createVisualization(visualization: InsertVisualization): Promise<Visualization>;
  createMultipleVisualizations(visualizations: InsertVisualization[]): Promise<Visualization[]>;
  getVisualization(id: number): Promise<Visualization | undefined>;
  getVisualizationByShareId(shareId: string): Promise<Visualization | undefined>;
  getVisualizationsByProjectGroup(projectGroup: string): Promise<Visualization[]>;
  updateVisualization(id: number, data: Partial<Visualization>): Promise<Visualization | undefined>;
  deleteVisualization(id: number): Promise<boolean>;
  
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByVisualization(visualizationId: number): Promise<Message[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private visualizations: Map<number, Visualization>;
  private messages: Map<number, Message>;
  private userCurrentId: number;
  private visualizationCurrentId: number;
  private messageCurrentId: number;

  constructor() {
    this.users = new Map();
    this.visualizations = new Map();
    this.messages = new Map();
    this.userCurrentId = 1;
    this.visualizationCurrentId = 1;
    this.messageCurrentId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Visualization methods
  async createVisualization(visualization: InsertVisualization): Promise<Visualization> {
    const id = this.visualizationCurrentId++;
    const shareId = visualization.shareId || uuidv4();
    const now = new Date();
    
    const newVisualization: Visualization = {
      id,
      userId: visualization.userId ?? null,
      projectGroup: visualization.projectGroup ?? null,
      title: visualization.title ?? null,
      description: visualization.description ?? null,
      imageBase64: visualization.imageBase64,
      initialSummary: visualization.initialSummary ?? null,
      analysis: visualization.analysis ?? null,
      insights: visualization.insights ?? null,
      shareId,
      createdAt: now,
      updatedAt: now,
      tags: visualization.tags ?? null,
      isPublic: visualization.isPublic ?? false
    };
    
    this.visualizations.set(id, newVisualization);
    return newVisualization;
  }

  async createMultipleVisualizations(visualizations: InsertVisualization[]): Promise<Visualization[]> {
    const results: Visualization[] = [];
    const projectGroup = uuidv4(); // Generate unique project group ID
    
    for (const viz of visualizations) {
      const vizWithProject = { ...viz, projectGroup };
      const created = await this.createVisualization(vizWithProject);
      results.push(created);
    }
    
    return results;
  }

  async getVisualizationsByProjectGroup(projectGroup: string): Promise<Visualization[]> {
    return Array.from(this.visualizations.values()).filter(
      (viz) => viz.projectGroup === projectGroup
    );
  }

  async getVisualization(id: number): Promise<Visualization | undefined> {
    return this.visualizations.get(id);
  }

  async getVisualizationByShareId(shareId: string): Promise<Visualization | undefined> {
    return Array.from(this.visualizations.values()).find(
      (viz) => viz.shareId === shareId,
    );
  }

  async updateVisualization(id: number, data: Partial<Visualization>): Promise<Visualization | undefined> {
    const visualization = this.visualizations.get(id);
    if (!visualization) return undefined;

    const updatedVisualization = {
      ...visualization,
      ...data,
    };

    this.visualizations.set(id, updatedVisualization);
    return updatedVisualization;
  }

  async deleteVisualization(id: number): Promise<boolean> {
    return this.visualizations.delete(id);
  }

  // Message methods
  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageCurrentId++;
    const createdAt = new Date();
    
    const newMessage: Message = {
      ...message,
      id,
      createdAt,
    };
    
    this.messages.set(id, newMessage);
    return newMessage;
  }

  async getMessagesByVisualization(visualizationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.visualizationId === visualizationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}

export class DatabaseStorage implements IStorage {
  // User methods
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

  // Visualization methods
  async createVisualization(visualization: InsertVisualization): Promise<Visualization> {
    // Ensure we have a shareId
    if (!visualization.shareId) {
      visualization.shareId = uuidv4();
    }
    
    // Include current date for createdAt and updatedAt
    const now = new Date();
    const vizWithDates = {
      ...visualization,
      createdAt: now,
      updatedAt: now
    };
    
    const [newVisualization] = await db.insert(visualizations).values(vizWithDates).returning();
    return newVisualization;
  }

  async createMultipleVisualizations(visualizations: InsertVisualization[]): Promise<Visualization[]> {
    const results: Visualization[] = [];
    const projectGroup = uuidv4(); // Generate unique project group ID
    
    for (const viz of visualizations) {
      const vizWithProject = { ...viz, projectGroup };
      const created = await this.createVisualization(vizWithProject);
      results.push(created);
    }
    
    return results;
  }

  async getVisualizationsByProjectGroup(projectGroup: string): Promise<Visualization[]> {
    return await db
      .select()
      .from(visualizations)
      .where(eq(visualizations.projectGroup, projectGroup))
      .orderBy(visualizations.createdAt);
  }

  async getVisualization(id: number): Promise<Visualization | undefined> {
    const [visualization] = await db.select().from(visualizations).where(eq(visualizations.id, id));
    return visualization;
  }

  async getVisualizationByShareId(shareId: string): Promise<Visualization | undefined> {
    const [visualization] = await db.select().from(visualizations).where(eq(visualizations.shareId, shareId));
    return visualization;
  }

  async updateVisualization(id: number, data: Partial<Visualization>): Promise<Visualization | undefined> {
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    
    const [updated] = await db
      .update(visualizations)
      .set(updateData)
      .where(eq(visualizations.id, id))
      .returning();
    
    return updated;
  }

  async deleteVisualization(id: number): Promise<boolean> {
    try {
      // First delete all messages associated with this visualization
      // to avoid foreign key constraint violations
      await db
        .delete(messages)
        .where(eq(messages.visualizationId, id));
      
      console.log(`Deleted messages for visualization ${id}`);
      
      // Then delete the visualization itself
      await db
        .delete(visualizations)
        .where(eq(visualizations.id, id));
      
      console.log(`Deleted visualization ${id}`);
      
      return true;
    } catch (error) {
      console.error("Failed to delete visualization:", error);
      return false;
    }
  }

  // Get all visualizations
  async getAllVisualizations(): Promise<Visualization[]> {
    return await db
      .select()
      .from(visualizations)
      .orderBy(desc(visualizations.createdAt));
  }
  
  // Message methods
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getMessagesByVisualization(visualizationId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.visualizationId, visualizationId))
      .orderBy(messages.createdAt);
  }
}

// Export the database storage instance
export const storage = new DatabaseStorage();
