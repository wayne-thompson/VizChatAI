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

export interface MessageResponse {
  userMessage: Message;
  assistantMessage: Message;
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
}

// Generate initial analysis for a visualization
export async function analyzeVisualization(id: number): Promise<AnalysisResult> {
  const response = await apiRequest('POST', `/api/visualizations/${id}/analyze`);
  return await response.json();
}

// Send a message to the AI assistant and get a response
export async function sendMessage(visualizationId: number, content: string): Promise<MessageResponse> {
  const response = await apiRequest('POST', `/api/visualizations/${visualizationId}/messages`, { content });
  return await response.json();
}

// Get a shared visualization and its messages
export async function getSharedVisualization(shareId: string): Promise<VisualizationWithMessages> {
  const response = await apiRequest('GET', `/api/share/${shareId}`);
  return await response.json();
}

// Get all messages for a visualization
export async function getMessages(visualizationId: number): Promise<Message[]> {
  const response = await apiRequest('GET', `/api/visualizations/${visualizationId}/messages`);
  return await response.json();
}

// Update visualization metadata
export async function updateVisualization(id: number, data: { title?: string; description?: string; tags?: string[] }): Promise<Visualization> {
  const response = await apiRequest('PATCH', `/api/visualizations/${id}`, data);
  return await response.json();
}
