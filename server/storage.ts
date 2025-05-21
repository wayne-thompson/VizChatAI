import { v4 as uuidv4 } from 'uuid';
import {
  User, InsertUser,
  Visualization, InsertVisualization,
  Message, InsertMessage
} from '@shared/schema';

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createVisualization(visualization: InsertVisualization): Promise<Visualization>;
  getVisualization(id: number): Promise<Visualization | undefined>;
  getVisualizationByShareId(shareId: string): Promise<Visualization | undefined>;
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
    const createdAt = new Date();
    
    const newVisualization: Visualization = {
      ...visualization,
      id,
      shareId,
      createdAt,
    };
    
    this.visualizations.set(id, newVisualization);
    return newVisualization;
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

export const storage = new MemStorage();
