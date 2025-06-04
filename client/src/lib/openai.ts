import { Visualization, Message } from "@shared/schema";
import { apiRequest } from "./queryClient";

export interface VisualizationWithMessages {
  visualization: Visualization;
  messages: Message[];
}

export interface AnalysisResult {
  visualization: Visualization;
  summary: {
    summary: string;
    points: string[];
  };
}

export interface ProjectAnalysisResult {
  visualizations: Visualization[];
  summary: {
    summary: string;
    points: string[];
  };
  projectGroup: string;
}

export interface MessageResponse {
  userMessage: Message;
  assistantMessage: Message;
}

// Upload multiple visualization images as a project
export async function uploadMultipleVisualizations(files: File[], tags?: string[]): Promise<Visualization[]> {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('images', file);
  });
  
  if (tags && tags.length > 0) {
    formData.append('tags', tags.join(','));
  }
  
  try {
    const response = await fetch('/api/visualizations/multi', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${response.status}: ${text || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error uploading multiple visualizations:", error);
    throw new Error("Failed to upload visualizations. Please try again.");
  }
}

// Upload a visualization image
export async function uploadVisualization(file: File, title?: string, description?: string, tags?: string[]): Promise<Visualization> {
  const formData = new FormData();
  formData.append('image', file);
  
  if (title) {
    formData.append('title', title);
  }
  
  if (description) {
    formData.append('description', description);
  }
  
  if (tags && tags.length > 0) {
    formData.append('tags', tags.join(','));
  }
  
  try {
    const response = await fetch('/api/visualizations', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${response.status}: ${text || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error uploading visualization:", error);
    throw new Error("Failed to upload visualization. Please try again.");
  }
}

// Analyze multiple visualizations as a project
export async function analyzeProject(projectGroup: string): Promise<ProjectAnalysisResult> {
  try {
    return await apiRequest(`/api/visualizations/project/${projectGroup}/analyze`, {
      method: 'POST'
    });
  } catch (error) {
    console.error("Error analyzing project:", error);
    throw new Error("Failed to analyze project. Please try again.");
  }
}

// Generate initial analysis for a visualization
export async function analyzeVisualization(id: number): Promise<AnalysisResult> {
  try {
    return await apiRequest(`/api/visualizations/${id}/analyze`, {
      method: 'POST'
    });
  } catch (error) {
    console.error("Error analyzing visualization:", error);
    throw new Error("Failed to analyze visualization. Please try again.");
  }
}

// Send a message to the AI assistant and get a response
export async function sendMessage(visualizationId: number, content: string): Promise<MessageResponse> {
  try {
    return await apiRequest(`/api/visualizations/${visualizationId}/messages`, { 
      method: 'POST',
      data: { content }
    });
  } catch (error) {
    console.error("Error sending message:", error);
    throw new Error("Failed to send message. Please try again.");
  }
}

// Get a shared visualization and its messages
export async function getSharedVisualization(shareId: string): Promise<VisualizationWithMessages> {
  return await apiRequest(`/api/share/${shareId}`);
}

// Get all messages for a visualization
export async function getMessages(visualizationId: number): Promise<Message[]> {
  return await apiRequest(`/api/visualizations/${visualizationId}/messages`);
}

// Update visualization metadata
export async function updateVisualization(id: number, data: { title?: string; description?: string; tags?: string[] }): Promise<Visualization> {
  return await apiRequest(`/api/visualizations/${id}`, {
    method: 'PATCH',
    data
  });
}
