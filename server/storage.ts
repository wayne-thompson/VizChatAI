import { v4 as uuidv4 } from 'uuid';
import {
  users, messages, visualizations, generatedVisualizations,
  User, UpsertUser,
  Visualization, InsertVisualization,
  Message, InsertMessage,
  GeneratedVisualization, InsertGeneratedVisualization
} from '@shared/schema';
import { db } from './db';
import { eq, desc } from 'drizzle-orm';

export interface IStorage {
  // User operations for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserLlmProvider(id: string, llmProvider: string): Promise<User | undefined>;
  
  createVisualization(visualization: InsertVisualization): Promise<Visualization>;
  createMultipleVisualizations(visualizations: InsertVisualization[]): Promise<Visualization[]>;
  getVisualization(id: number): Promise<Visualization | undefined>;
  getVisualizationByShareId(shareId: string): Promise<Visualization | undefined>;
  getVisualizationsByProjectGroup(projectGroup: string): Promise<Visualization[]>;
  updateVisualization(id: number, data: Partial<Visualization>): Promise<Visualization | undefined>;
  deleteVisualization(id: number): Promise<boolean>;
  
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByVisualization(visualizationId: number): Promise<Message[]>;
  
  // Generated visualizations (Create feature)
  createGeneratedVisualization(data: InsertGeneratedVisualization): Promise<GeneratedVisualization>;
  getGeneratedVisualization(id: number): Promise<GeneratedVisualization | undefined>;
  getGeneratedVisualizationByShareId(shareId: string): Promise<GeneratedVisualization | undefined>;
  updateGeneratedVisualization(id: number, data: Partial<GeneratedVisualization>): Promise<GeneratedVisualization | undefined>;
  getAllGeneratedVisualizations(userId?: string): Promise<GeneratedVisualization[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private visualizations: Map<number, Visualization>;
  private messages: Map<number, Message>;
  private generatedVizs: Map<number, GeneratedVisualization>;

  private visualizationCurrentId: number;
  private messageCurrentId: number;
  private generatedVizCurrentId: number;

  constructor() {
    this.users = new Map();
    this.visualizations = new Map();
    this.messages = new Map();
    this.generatedVizs = new Map();

    this.visualizationCurrentId = 1;
    this.messageCurrentId = 1;
    this.generatedVizCurrentId = 1;
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id);
    if (existingUser) {
      const updatedUser = { ...existingUser, ...userData, updatedAt: new Date() };
      this.users.set(userData.id, updatedUser);
      return updatedUser;
    } else {
      const newUser: User = {
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(userData.id, newUser);
      return newUser;
    }
  }

  async updateUserLlmProvider(id: string, llmProvider: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, llmProvider, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
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

  // Generated visualization methods (MemStorage)
  async createGeneratedVisualization(data: InsertGeneratedVisualization): Promise<GeneratedVisualization> {
    const id = this.generatedVizCurrentId++;
    const newViz: GeneratedVisualization = {
      id,
      userId: data.userId ?? null,
      sourceImageBase64: data.sourceImageBase64,
      styleReferenceBase64: data.styleReferenceBase64 ?? null,
      prompt: data.prompt ?? null,
      generatedImages: data.generatedImages ?? null,
      shareId: data.shareId || uuidv4(),
      createdAt: new Date()
    };
    this.generatedVizs.set(id, newViz);
    return newViz;
  }

  async getGeneratedVisualization(id: number): Promise<GeneratedVisualization | undefined> {
    return this.generatedVizs.get(id);
  }

  async getGeneratedVisualizationByShareId(shareId: string): Promise<GeneratedVisualization | undefined> {
    return Array.from(this.generatedVizs.values()).find(v => v.shareId === shareId);
  }

  async updateGeneratedVisualization(id: number, data: Partial<GeneratedVisualization>): Promise<GeneratedVisualization | undefined> {
    const viz = this.generatedVizs.get(id);
    if (!viz) return undefined;
    const updated = { ...viz, ...data };
    this.generatedVizs.set(id, updated);
    return updated;
  }

  async getAllGeneratedVisualizations(userId?: string): Promise<GeneratedVisualization[]> {
    const all = Array.from(this.generatedVizs.values());
    if (userId) {
      return all.filter(v => v.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserLlmProvider(id: string, llmProvider: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ llmProvider, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
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

  // Generated visualization methods (Create feature)
  async createGeneratedVisualization(data: InsertGeneratedVisualization): Promise<GeneratedVisualization> {
    const vizData = {
      ...data,
      shareId: data.shareId || uuidv4(),
      createdAt: new Date()
    };
    const [newViz] = await db.insert(generatedVisualizations).values(vizData).returning();
    return newViz;
  }

  async getGeneratedVisualization(id: number): Promise<GeneratedVisualization | undefined> {
    const [viz] = await db.select().from(generatedVisualizations).where(eq(generatedVisualizations.id, id));
    return viz;
  }

  async getGeneratedVisualizationByShareId(shareId: string): Promise<GeneratedVisualization | undefined> {
    const [viz] = await db.select().from(generatedVisualizations).where(eq(generatedVisualizations.shareId, shareId));
    return viz;
  }

  async updateGeneratedVisualization(id: number, data: Partial<GeneratedVisualization>): Promise<GeneratedVisualization | undefined> {
    const [updated] = await db
      .update(generatedVisualizations)
      .set(data)
      .where(eq(generatedVisualizations.id, id))
      .returning();
    return updated;
  }

  async getAllGeneratedVisualizations(userId?: string): Promise<GeneratedVisualization[]> {
    if (userId) {
      return await db
        .select()
        .from(generatedVisualizations)
        .where(eq(generatedVisualizations.userId, userId))
        .orderBy(desc(generatedVisualizations.createdAt));
    }
    return await db
      .select()
      .from(generatedVisualizations)
      .orderBy(desc(generatedVisualizations.createdAt));
  }
}

// Export the database storage instance
export const storage = new DatabaseStorage();
