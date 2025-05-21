import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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

// Initialize OpenAI with API key
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Utility function to safely process OpenAI API calls
const safeOpenAIRequest = async <T>(callback: () => Promise<T>): Promise<T> => {
  try {
    const result = await callback();
    return result;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error(`Error communicating with OpenAI: ${error.message || "Unknown error"}`);
  }
};

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
  // API health check
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok" });
  });
  
  // Get all visualizations
  app.get("/api/visualizations", async (req: Request, res: Response) => {
    try {
      const visualizations = await storage.getAllVisualizations();
      res.json(visualizations);
    } catch (error) {
      console.error("Error fetching all visualizations:", error);
      res.status(500).json({ message: "Error fetching visualizations" });
    }
  });

  // Upload a visualization image and get initial summary
  app.post("/api/visualizations", upload.single("image"), async (req: Request, res: Response) => {
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
        userId: null, // Not requiring authentication for this MVP
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

  // Generate initial summary for a visualization
  app.post("/api/visualizations/:id/analyze", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const visualization = await storage.getVisualization(id);
      
      if (!visualization) {
        return res.status(404).json({ message: "Visualization not found" });
      }

      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }

      try {
        console.log("Starting visualization analysis with OpenAI...");
        // The newest OpenAI model is "gpt-4o" which was released May 13, 2024
        
        // Make sure the image URL is properly formatted for OpenAI
        const imageUrl = visualization.imageBase64.startsWith('data:') 
          ? visualization.imageBase64 
          : `data:image/jpeg;base64,${visualization.imageBase64}`;
        
        console.log("Sending request to OpenAI Vision API...");
        
        const visionResponse = await safeOpenAIRequest(async () => {
          return await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "You are Viz, an expert data visualization analyst. Analyze the chart or graph in the image and provide a concise, insightful summary. Format your response as JSON with a 'summary' field containing a paragraph overview and a 'points' field containing an array of key observations as bullet points."
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Analyze this data visualization and provide a brief but insightful summary. What does this chart show? What are the key trends or patterns? What might be important to know about this data?"
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: imageUrl
                    }
                  }
                ],
              },
            ],
            response_format: { type: "json_object" },
            max_tokens: 800,
          });
        });
        
        console.log("Received response from OpenAI");
        
        let result;
        try {
          const responseContent = visionResponse.choices[0].message.content || '{"summary": "Could not analyze the image", "points": ["No data available"]}';
          result = JSON.parse(responseContent);
          console.log("Successfully parsed OpenAI response");
        } catch (parseError) {
          console.error("Error parsing OpenAI response:", parseError);
          result = {
            summary: "I analyzed your visualization but had trouble formatting the results.",
            points: ["The visualization contains data that could be analyzed further.", 
                    "Try asking specific questions about elements you see in the chart."]
          };
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
  app.get("/api/visualizations/:id", async (req: Request, res: Response) => {
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
  app.patch("/api/visualizations/:id", async (req: Request, res: Response) => {
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

  // Get messages for a visualization
  app.get("/api/visualizations/:id/messages", async (req: Request, res: Response) => {
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
  app.post("/api/visualizations/:id/messages", async (req: Request, res: Response) => {
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
      
      // Get previous messages (limit to last 5 for context)
      const messages = await storage.getMessagesByVisualization(id);
      const recentMessages = messages.slice(-5);
      
      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }

      try {
        // The newest OpenAI model is "gpt-4o" which was released May 13, 2024
        console.log("Preparing chat message for OpenAI API");
        
        // Format the most recent messages properly (latest 5)
        const latestMessages = recentMessages.slice(-5).map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content
        }));
        
        // Create a clean array of messages for the API
        const apiMessages = [
          {
            role: "system",
            content: "You are Viz, a friendly and expert-level data visualization analyst. You're helping a user understand their chart or graph. Provide clear, insightful explanations. Be concise but thorough."
          },
          ...latestMessages
        ];
        
        console.log("Sending chat request to OpenAI");
        const chatResponse = await safeOpenAIRequest(async () => {
          return await openai.chat.completions.create({
            model: "gpt-4o",
            messages: apiMessages as any, // Type assertion to work around TypeScript errors
            max_tokens: 1000,
          });
        });
        console.log("Received chat response from OpenAI");

        // Save assistant response
        const assistantMessage = await storage.createMessage({
          visualizationId: id,
          role: "assistant",
          content: chatResponse.choices[0].message.content || "I'm sorry, I couldn't analyze that properly."
        });
        
        res.json({
          userMessage,
          assistantMessage
        });
      } catch (error) {
        console.error("OpenAI API error:", error);
        res.status(500).json({ message: "Error generating AI response", error: String(error) });
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
