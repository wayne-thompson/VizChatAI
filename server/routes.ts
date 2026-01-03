import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { v4 as uuidv4 } from 'uuid';
import OpenAI from "openai";
import { GoogleGenAI, Modality } from "@google/genai";
import { 
  insertVisualizationSchema, 
  insertMessageSchema,
  insertGeneratedVisualizationSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import multer from "multer";
import path from "path";
import fs from "fs";

// Initialize Gemini with Replit AI Integrations
const gemini = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY || "",
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

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

  // Bulk delete visualizations
  app.post("/api/visualizations/bulk-delete", isAuthenticated, async (req: any, res: Response) => {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid request: ids array is required" });
      }
      
      // Delete each visualization
      const results = await Promise.all(
        ids.map(id => storage.deleteVisualization(parseInt(id)))
      );
      
      const successCount = results.filter(r => r).length;
      
      res.json({ 
        success: true, 
        deletedCount: successCount,
        message: `Successfully deleted ${successCount} visualization(s)`
      });
    } catch (error) {
      console.error("Error bulk deleting visualizations:", error);
      res.status(500).json({ message: "Error deleting visualizations" });
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

  // ============================================
  // CREATE VISUALIZATION FEATURE ROUTES
  // ============================================

  // Create a new generated visualization (upload source image + optional style reference)
  app.post("/api/create-viz", isAuthenticated, upload.fields([
    { name: "sourceImage", maxCount: 1 },
    { name: "styleReference", maxCount: 1 }
  ]), async (req: any, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (!files.sourceImage || files.sourceImage.length === 0) {
        return res.status(400).json({ message: "Source image is required" });
      }

      // Convert source image to base64
      const sourceFile = files.sourceImage[0];
      const sourceBase64 = `data:${sourceFile.mimetype};base64,${sourceFile.buffer.toString("base64")}`;

      // Convert style reference to base64 if provided
      let styleBase64: string | undefined;
      if (files.styleReference && files.styleReference.length > 0) {
        const styleFile = files.styleReference[0];
        styleBase64 = `data:${styleFile.mimetype};base64,${styleFile.buffer.toString("base64")}`;
      }

      const prompt = req.body.prompt || "";
      const shareId = uuidv4();

      // Create the generated visualization record
      const genViz = await storage.createGeneratedVisualization({
        userId: req.user.claims.sub,
        sourceImageBase64: sourceBase64,
        styleReferenceBase64: styleBase64 || null,
        prompt: prompt,
        generatedImages: null,
        shareId
      });

      res.status(201).json(genViz);
    } catch (error) {
      console.error("Error creating visualization:", error);
      res.status(500).json({ message: "Error creating visualization" });
    }
  });

  // Generate visualizations using Gemini
  app.post("/api/create-viz/:id/generate", isAuthenticated, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const genViz = await storage.getGeneratedVisualization(id);

      if (!genViz) {
        return res.status(404).json({ message: "Generated visualization not found" });
      }

      // Extract base64 data from data URL
      const sourceImageData = genViz.sourceImageBase64.split(",")[1];
      const sourceImageMime = genViz.sourceImageBase64.split(";")[0].split(":")[1];

      // Build the prompt for Gemini
      let prompt = `You are a data visualization expert. Analyze this screenshot of data and create 3 different professional data visualizations based on it.

The data in this image should be transformed into clear, attractive charts or graphs. For each visualization:
1. A bar chart showing the key metrics
2. A pie chart showing distribution/proportions
3. A line chart or area chart showing trends if applicable

Make the visualizations clean, modern, and professional with clear labels and legends.`;

      if (genViz.styleReferenceBase64) {
        prompt += `\n\nIMPORTANT: Use the visual style from the second image as inspiration for the color scheme, design elements, and overall aesthetic.`;
      }

      if (genViz.prompt) {
        prompt += `\n\nAdditional user instructions: ${genViz.prompt}`;
      }

      // Build the content parts
      const parts: any[] = [
        { text: prompt },
        {
          inlineData: {
            mimeType: sourceImageMime,
            data: sourceImageData
          }
        }
      ];

      // Add style reference if provided
      if (genViz.styleReferenceBase64) {
        const styleImageData = genViz.styleReferenceBase64.split(",")[1];
        const styleImageMime = genViz.styleReferenceBase64.split(";")[0].split(":")[1];
        parts.push({
          inlineData: {
            mimeType: styleImageMime,
            data: styleImageData
          }
        });
      }

      console.log("Generating visualizations with Gemini...");

      // Generate images using Gemini
      const generatedImages: string[] = [];
      
      // Generate 3 visualizations
      for (let i = 0; i < 3; i++) {
        const vizPrompt = `${prompt}\n\nNow generate visualization ${i + 1} of 3. Make it unique and complementary to the others.`;
        
        try {
          const response = await gemini.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: [{ role: "user", parts: [{ text: vizPrompt }, parts[1]] }],
            config: {
              responseModalities: [Modality.TEXT, Modality.IMAGE],
            },
          });

          const candidate = response.candidates?.[0];
          const imagePart = candidate?.content?.parts?.find(
            (part: any) => part.inlineData
          );

          if (imagePart?.inlineData?.data) {
            const mimeType = imagePart.inlineData.mimeType || "image/png";
            generatedImages.push(`data:${mimeType};base64,${imagePart.inlineData.data}`);
          }
        } catch (genError) {
          console.error(`Error generating visualization ${i + 1}:`, genError);
        }
      }

      if (generatedImages.length === 0) {
        return res.status(500).json({ message: "Failed to generate any visualizations" });
      }

      // Update the record with generated images
      const updatedViz = await storage.updateGeneratedVisualization(id, {
        generatedImages
      });

      res.json(updatedViz);
    } catch (error) {
      console.error("Error generating visualizations:", error);
      res.status(500).json({ message: "Error generating visualizations" });
    }
  });

  // Get all generated visualizations for user
  app.get("/api/create-viz", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const vizs = await storage.getAllGeneratedVisualizations(userId);
      res.json(vizs);
    } catch (error) {
      console.error("Error fetching generated visualizations:", error);
      res.status(500).json({ message: "Error fetching generated visualizations" });
    }
  });

  // Get a specific generated visualization
  app.get("/api/create-viz/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const viz = await storage.getGeneratedVisualization(id);

      if (!viz) {
        return res.status(404).json({ message: "Generated visualization not found" });
      }

      res.json(viz);
    } catch (error) {
      console.error("Error fetching generated visualization:", error);
      res.status(500).json({ message: "Error fetching generated visualization" });
    }
  });

  // Get generated visualization by share ID (public access)
  app.get("/api/create-viz/share/:shareId", async (req: Request, res: Response) => {
    try {
      const { shareId } = req.params;
      const viz = await storage.getGeneratedVisualizationByShareId(shareId);

      if (!viz) {
        return res.status(404).json({ message: "Shared visualization not found" });
      }

      res.json(viz);
    } catch (error) {
      console.error("Error fetching shared visualization:", error);
      res.status(500).json({ message: "Error fetching shared visualization" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
