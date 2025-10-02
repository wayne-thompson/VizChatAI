import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { v4 as uuidv4 } from 'uuid';
import OpenAI from "openai";
import { 
  insertVisualizationSchema, 
  insertMessageSchema 
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import multer from "multer";
import path from "path";
import fs from "fs";

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

// Setup multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG and PNG are allowed."));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);
  
  // API health check
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  // Auth user endpoint
  app.get('/api/auth/user', async (req: any, res: Response) => {
    try {
      // Check if user is authenticated and has valid session
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);
      
      // If user doesn't exist in our database, create them from the session claims
      if (!user) {
        const claims = req.user.claims;
        user = await storage.upsertUser({
          id: claims.sub,
          email: claims.email,
          firstName: claims.first_name,
          lastName: claims.last_name,
          profileImageUrl: claims.profile_image_url,
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user's LLM provider preference
  app.patch('/api/user/llm-provider', isAuthenticated, async (req: any, res: Response) => {
    try {
      const { llmProvider } = req.body;
      
      if (!llmProvider || !['openai', 'google', 'xai'].includes(llmProvider)) {
        return res.status(400).json({ message: "Invalid LLM provider" });
      }

      const userId = req.user.claims.sub;
      const updatedUser = await storage.updateUserLlmProvider(userId, llmProvider);
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating LLM provider:", error);
      res.status(500).json({ message: "Failed to update LLM provider" });
    }
  });
  
  // Get all visualizations
  app.get("/api/visualizations", isAuthenticated, async (req: any, res: Response) => {
    try {
      const visualizations = await storage.getAllVisualizations();
      res.json(visualizations);
    } catch (error) {
      console.error("Error fetching all visualizations:", error);
      res.status(500).json({ message: "Error fetching visualizations" });
    }
  });

  // Upload multiple visualization images as a project
  app.post("/api/visualizations/multi", isAuthenticated, upload.array("images", 10), async (req: any, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No image files provided" });
      }

      // Convert files to visualizations
      const visualizationData = files.map((file, index) => {
        const base64Image = file.buffer.toString("base64");
        const mimeType = file.mimetype;
        const dataUrl = `data:${mimeType};base64,${base64Image}`;
        
        return {
          userId: req.user.claims.sub,
          title: `Chart ${index + 1}`,
          description: `Uploaded visualization ${index + 1}`,
          imageBase64: dataUrl,
          initialSummary: "",
          shareId: uuidv4(),
          tags: req.body.tags ? req.body.tags.split(",") : [],
        };
      });

      // Create all visualizations as a project group
      const visualizations = await storage.createMultipleVisualizations(visualizationData);
      
      res.status(201).json(visualizations);
    } catch (error) {
      console.error("Error uploading multiple visualizations:", error);
      res.status(500).json({ message: "Error uploading visualizations" });
    }
  });

  // Upload a visualization image and get initial summary
  app.post("/api/visualizations", isAuthenticated, upload.single("image"), async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Convert file to Base64
      const base64Image = req.file.buffer.toString("base64");
      const mimeType = req.file.mimetype;
      const dataUrl = `data:${mimeType};base64,${base64Image}`;

      // Generate a unique share ID
      const shareId = uuidv4();
      
      // Create visualization without initial summary first
      const visualization = await storage.createVisualization({
        userId: req.user.claims.sub,
        title: req.body.title || "Untitled Visualization",
        description: req.body.description || "",
        imageBase64: dataUrl,
        initialSummary: "",
        shareId,
        tags: req.body.tags ? req.body.tags.split(",") : [],
      });

      res.status(201).json(visualization);
    } catch (error) {
      console.error("Error uploading visualization:", error);
      res.status(500).json({ message: "Error uploading visualization" });
    }
  });

  // Analyze multiple visualizations as a project
  app.post("/api/visualizations/project/:projectGroup/analyze", isAuthenticated, async (req: any, res: Response) => {
    try {
      const projectGroup = req.params.projectGroup;
      const visualizations = await storage.getVisualizationsByProjectGroup(projectGroup);
      
      if (!visualizations || visualizations.length === 0) {
        return res.status(404).json({ message: "Project visualizations not found" });
      }

      // Get user's LLM provider preference
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const llmProvider = user?.llmProvider || 'openai';

      try {
        // Import our LLM provider module
        const { analyzeVisualization, generateComprehensiveAnalysis } = await import('./llm-provider');
        
        console.log(`Analyzing project with ${llmProvider}:`, projectGroup);
        
        // Analyze each visualization individually first
        const individualAnalyses = [];
        for (const viz of visualizations) {
          const analysis = await analyzeVisualization(viz.imageBase64, llmProvider);
          individualAnalyses.push({
            title: viz.title || `Chart ${viz.id}`,
            analysis
          });
        }
        
        // Generate comprehensive project analysis
        const comprehensivePrompt = `
          I have analyzed ${visualizations.length} related business visualizations. Here are the individual analyses:
          
          ${individualAnalyses.map((item, i) => `
          Chart ${i + 1} (${item.title}):
          ${item.analysis.summary}
          Key Points: ${item.analysis.points.join(', ')}
          `).join('\n')}
          
          Please provide a comprehensive business analysis that looks at the bigger picture across all these visualizations. Focus on:
          1. Overall business health and performance
          2. Key relationships and correlations between the different metrics
          3. Strategic insights and recommendations
          4. Areas of concern or opportunity
          
          Provide the response as a JSON object with:
          - 'summary': a string containing the main analysis paragraph
          - 'points': an array of strings, where each string is a complete bullet point (NOT objects)
        `;

        const comprehensiveAnalysis = await generateComprehensiveAnalysis(comprehensivePrompt, llmProvider);
        
        console.log("Comprehensive analysis received:", comprehensiveAnalysis);
        
        // Ensure points is an array of strings - more aggressive extraction
        if (comprehensiveAnalysis.points && Array.isArray(comprehensiveAnalysis.points)) {
          comprehensiveAnalysis.points = comprehensiveAnalysis.points.map((point: any) => {
            if (typeof point === 'string') {
              return point;
            }
            if (typeof point === 'object' && point !== null) {
              // Try various possible property names
              if (point.text) return point.text;
              if (point.content) return point.content;
              if (point.point) return point.point;
              if (point.description) return point.description;
              if (point.insight) return point.insight;
              // If it's an object with only one property, use that value
              const keys = Object.keys(point);
              if (keys.length === 1) {
                return point[keys[0]];
              }
              // Last resort - stringify and clean up
              return JSON.stringify(point).replace(/[{}]/g, '').replace(/"/g, '');
            }
            return String(point);
          });
        }
        
        console.log("Comprehensive analysis processed:", comprehensiveAnalysis);
        
        // Update all visualizations with project analysis
        for (const viz of visualizations) {
          await storage.updateVisualization(viz.id, {
            initialSummary: JSON.stringify(comprehensiveAnalysis)
          });
        }

        // Create welcome message for the first visualization (as chat entry point)
        await storage.createMessage({
          visualizationId: visualizations[0].id,
          role: "assistant",
          content: "Hi there! I'm Data Vizard, your business analysis assistant. I've analyzed all your visualizations together to give you comprehensive insights about your business. Feel free to ask me any questions about the patterns, trends, or strategic implications I've discovered!"
        });

        // Create comprehensive analysis message
        await storage.createMessage({
          visualizationId: visualizations[0].id,
          role: "assistant",
          content: `I've analyzed your ${visualizations.length} visualizations together! ${comprehensiveAnalysis.summary} Would you like me to dive deeper into any specific area or relationship between your data?`
        });

        res.json({ 
          visualizations,
          summary: comprehensiveAnalysis,
          projectGroup
        });
      } catch (error) {
        console.error("OpenAI API error:", error);
        res.status(500).json({ message: "Error analyzing visualizations with AI" });
      }
    } catch (error) {
      console.error("Error analyzing project:", error);
      res.status(500).json({ message: "Error analyzing project" });
    }
  });

  // Generate initial summary for a visualization
  app.post("/api/visualizations/:id/analyze", isAuthenticated, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const visualization = await storage.getVisualization(id);
      
      if (!visualization) {
        return res.status(404).json({ message: "Visualization not found" });
      }

      // Get user's LLM provider preference
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const llmProvider = user?.llmProvider || 'openai';

      try {
        // Import our LLM provider module
        const { analyzeVisualization } = await import('./llm-provider');
        
        console.log(`Analyzing visualization with ${llmProvider}:`, id);
        
        // Get analysis from the selected LLM provider
        const result = await analyzeVisualization(visualization.imageBase64, llmProvider);
        console.log("Received analysis:", result);
        
        // Ensure points is an array of strings - more aggressive extraction
        if (result.points && Array.isArray(result.points)) {
          result.points = result.points.map((point: any) => {
            if (typeof point === 'string') {
              return point;
            }
            if (typeof point === 'object' && point !== null) {
              // Try various possible property names
              if (point.text) return point.text;
              if (point.content) return point.content;
              if (point.point) return point.point;
              if (point.description) return point.description;
              if (point.insight) return point.insight;
              // If it's an object with only one property, use that value
              const keys = Object.keys(point);
              if (keys.length === 1) {
                return point[keys[0]];
              }
              // Last resort - stringify and clean up
              return JSON.stringify(point).replace(/[{}]/g, '').replace(/"/g, '');
            }
            return String(point);
          });
        }
        
        // Update visualization with initial summary
        const updatedVisualization = await storage.updateVisualization(id, {
          initialSummary: JSON.stringify(result)
        });

        // Create welcome message
        await storage.createMessage({
          visualizationId: id,
          role: "assistant",
          content: "Hi there! I'm Viz, your chart analysis assistant. I've analyzed your visualization, and I'm ready to help you understand it better. Feel free to ask me any questions about the data, trends, or patterns you see!"
        });

        // Create initial analysis message
        await storage.createMessage({
          visualizationId: id,
          role: "assistant",
          content: `I've analyzed your visualization! ${result.summary} Would you like me to explain any specific aspect in more detail?`
        });

        res.json({ 
          visualization: updatedVisualization,
          summary: result
        });
      } catch (error) {
        console.error("OpenAI API error:", error);
        res.status(500).json({ message: "Error analyzing visualization with AI" });
      }
    } catch (error) {
      console.error("Error analyzing visualization:", error);
      res.status(500).json({ message: "Error analyzing visualization" });
    }
  });

  // Get visualization by ID
  app.get("/api/visualizations/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const visualization = await storage.getVisualization(id);
      
      if (!visualization) {
        return res.status(404).json({ message: "Visualization not found" });
      }
      
      res.json(visualization);
    } catch (error) {
      console.error("Error fetching visualization:", error);
      res.status(500).json({ message: "Error fetching visualization" });
    }
  });

  // Get visualization by share ID
  app.get("/api/share/:shareId", async (req: Request, res: Response) => {
    try {
      const { shareId } = req.params;
      const visualization = await storage.getVisualizationByShareId(shareId);
      
      if (!visualization) {
        return res.status(404).json({ message: "Shared visualization not found" });
      }
      
      // Get messages for this visualization
      const messages = await storage.getMessagesByVisualization(visualization.id);
      
      res.json({
        visualization,
        messages
      });
    } catch (error) {
      console.error("Error fetching shared visualization:", error);
      res.status(500).json({ message: "Error fetching shared visualization" });
    }
  });

  // Update visualization (title, description, tags)
  app.patch("/api/visualizations/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const visualization = await storage.getVisualization(id);
      
      if (!visualization) {
        return res.status(404).json({ message: "Visualization not found" });
      }
      
      const updatedVisualization = await storage.updateVisualization(id, {
        title: req.body.title ?? visualization.title,
        description: req.body.description ?? visualization.description,
        tags: req.body.tags ?? visualization.tags
      });
      
      res.json(updatedVisualization);
    } catch (error) {
      console.error("Error updating visualization:", error);
      res.status(500).json({ message: "Error updating visualization" });
    }
  });
  
  // Delete visualization and associated data
  app.delete("/api/visualizations/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const visualization = await storage.getVisualization(id);
      
      if (!visualization) {
        return res.status(404).json({ message: "Visualization not found" });
      }
      
      // Delete the visualization
      const success = await storage.deleteVisualization(id);
      
      if (success) {
        res.status(204).end(); // 204 No Content indicates successful deletion
      } else {
        res.status(500).json({ message: "Error deleting visualization" });
      }
    } catch (error) {
      console.error("Error deleting visualization:", error);
      res.status(500).json({ message: "Error deleting visualization" });
    }
  });

  // Get messages for a visualization
  app.get("/api/visualizations/:id/messages", isAuthenticated, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const visualization = await storage.getVisualization(id);
      
      if (!visualization) {
        return res.status(404).json({ message: "Visualization not found" });
      }
      
      const messages = await storage.getMessagesByVisualization(id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Error fetching messages" });
    }
  });

  // Send a message and get AI response
  app.post("/api/visualizations/:id/messages", isAuthenticated, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const visualization = await storage.getVisualization(id);
      
      if (!visualization) {
        return res.status(404).json({ message: "Visualization not found" });
      }
      
      // Validate message content
      const messageData = insertMessageSchema.parse({
        visualizationId: id,
        role: "user",
        content: req.body.content
      });
      
      // Save user message
      const userMessage = await storage.createMessage(messageData);
      
      // Get all previous messages
      const messages = await storage.getMessagesByVisualization(id);
      
      // Get user's LLM provider preference
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const llmProvider = user?.llmProvider || 'openai';

      try {
        // Import our LLM provider module
        const { getVisualizationChatResponse } = await import('./llm-provider');
        
        console.log(`Processing chat with ${llmProvider} for visualization:`, id);
        
        // Format previous messages for the API
        const chatHistory = messages
          .slice(0, -1) // Exclude the message we just saved
          .map(msg => ({
            role: msg.role,
            content: msg.content
          }));
        
        // Get response from the selected LLM provider
        const responseText = await getVisualizationChatResponse(
          visualization.imageBase64,
          req.body.content,
          chatHistory,
          llmProvider
        );
        
        console.log("Received response from LLM");

        // Save assistant response
        const assistantMessage = await storage.createMessage({
          visualizationId: id,
          role: "assistant",
          content: responseText
        });
        
        res.json({
          userMessage,
          assistantMessage
        });
      } catch (error) {
        console.error("OpenAI API error:", error);
        res.status(500).json({ message: "Error generating AI response" });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Error sending message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
