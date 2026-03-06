import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Initialize XAI
const xai = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: "https://api.x.ai/v1"
});

// Analyze visualization with selected LLM provider
export async function analyzeVisualization(
  imageBase64: string,
  provider: string = "openai"
): Promise<{ summary: string; points: string[] }> {
  switch (provider) {
    case "google":
      return analyzeWithGemini(imageBase64);
    case "xai":
      return analyzeWithXAI(imageBase64);
    case "openai":
    default:
      return analyzeWithOpenAI(imageBase64);
  }
}

// Get chat response with selected LLM provider
export async function getVisualizationChatResponse(
  imageBase64: string,
  userMessage: string,
  chatHistory: Array<{ role: string; content: string }>,
  provider: string = "openai"
): Promise<string> {
  switch (provider) {
    case "google":
      return chatWithGemini(imageBase64, userMessage, chatHistory);
    case "xai":
      return chatWithXAI(imageBase64, userMessage, chatHistory);
    case "openai":
    default:
      return chatWithOpenAI(imageBase64, userMessage, chatHistory);
  }
}

// OpenAI Implementation
async function analyzeWithOpenAI(imageBase64: string): Promise<{ summary: string; points: string[] }> {
  try {
    const imageUrl = imageBase64.startsWith('data:') 
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;
    
    console.log("Analyzing with OpenAI GPT-4o");
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert data visualization analyst. Analyze the chart or graph in the image and provide a concise, insightful summary. Your response should be in JSON format with a 'summary' field containing a paragraph overview and a 'points' array containing 3-5 key observations as simple strings (NOT objects)."
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
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 800
    });
    
    const result = JSON.parse(response.choices[0].message.content || '{}');
    if (!result.summary || !Array.isArray(result.points)) {
      throw new Error("Invalid response format from OpenAI");
    }
    return result;
  } catch (error) {
    console.error("Error with OpenAI:", error);
    return getFallbackResponse();
  }
}

async function chatWithOpenAI(
  imageBase64: string,
  userMessage: string,
  chatHistory: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    const imageUrl = imageBase64.startsWith('data:') 
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;
    
    const systemPrompt = "You are Data Vizard, a friendly and expert-level data visualization analyst. You're helping a user understand their chart or graph. Provide clear, insightful explanations about the visualization shown in the image. Refer directly to visual elements, data points, trends, and patterns visible in the chart.";
    
    const formattedHistory = chatHistory.map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content
    }));
    
    const messages = [
      { role: "system" as const, content: systemPrompt },
      {
        role: "user" as const,
        content: [
          { type: "text" as const, text: "Here is the data visualization I want to discuss:" },
          { type: "image_url" as const, image_url: { url: imageUrl } }
        ]
      },
      ...formattedHistory,
      { role: "user" as const, content: userMessage }
    ];
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
      max_tokens: 1000
    });
    
    return response.choices[0].message.content || "I couldn't analyze the visualization properly.";
  } catch (error) {
    console.error("Error in OpenAI chat:", error);
    return "I'm having trouble connecting. Please try again.";
  }
}

// Google Gemini Implementation
async function analyzeWithGemini(imageBase64: string): Promise<{ summary: string; points: string[] }> {
  try {
    console.log("Analyzing with Google Gemini");
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    // Extract base64 data without prefix
    const base64Data = imageBase64.includes(',') 
      ? imageBase64.split(',')[1] 
      : imageBase64;
    
    const prompt = `Analyze this data visualization and provide insights. Return your response in JSON format with:
- "summary": A paragraph overview of what the chart shows
- "points": An array of 3-5 key observations as strings

What does this chart show? What are the key trends or patterns? What might be important to know about this data?`;
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      }
    ]);
    
    const response = await result.response;
    const text = response.text();
    
    // Try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.summary && Array.isArray(parsed.points)) {
        return parsed;
      }
    }
    
    // Fallback parsing
    return {
      summary: text.split('\n')[0] || text,
      points: text.split('\n').slice(1, 6).filter(line => line.trim())
    };
  } catch (error) {
    console.error("Error with Gemini:", error);
    return getFallbackResponse();
  }
}

async function chatWithGemini(
  imageBase64: string,
  userMessage: string,
  chatHistory: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const base64Data = imageBase64.includes(',') 
      ? imageBase64.split(',')[1] 
      : imageBase64;
    
    // Build chat context
    const historyText = chatHistory.map(msg => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');
    
    const prompt = `You are Data Vizard, an expert data visualization analyst. A user is asking about their chart.

Previous conversation:
${historyText}

Current question: ${userMessage}

Provide a clear, insightful response about the visualization.`;
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      }
    ]);
    
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error in Gemini chat:", error);
    return "I'm having trouble connecting. Please try again.";
  }
}

// XAI (Grok) Implementation
async function analyzeWithXAI(imageBase64: string): Promise<{ summary: string; points: string[] }> {
  try {
    console.log("Analyzing with xAI Grok");
    
    const imageUrl = imageBase64.startsWith('data:') 
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;
    
    const response = await xai.chat.completions.create({
      model: "grok-2-vision-latest",
      messages: [
        {
          role: "system",
          content: "You are an expert data visualization analyst. Analyze the chart or graph in the image and provide a concise, insightful summary. Your response should be in JSON format with a 'summary' field containing a paragraph overview and a 'points' array containing 3-5 key observations as simple strings (NOT objects)."
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
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      max_tokens: 800
    });
    
    // Strip markdown code blocks if present
    let content = response.choices[0].message.content || '{}';
    content = content.replace(/```json\s*|\s*```/g, '').trim();
    
    const result = JSON.parse(content);
    if (!result.summary || !Array.isArray(result.points)) {
      throw new Error("Invalid response format from xAI");
    }
    return result;
  } catch (error) {
    console.error("Error with xAI:", error);
    return getFallbackResponse();
  }
}

async function chatWithXAI(
  imageBase64: string,
  userMessage: string,
  chatHistory: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    const imageUrl = imageBase64.startsWith('data:') 
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;
    
    const systemPrompt = "You are Data Vizard, a friendly and expert-level data visualization analyst. You're helping a user understand their chart or graph. Provide clear, insightful explanations about the visualization shown in the image.";
    
    const formattedHistory = chatHistory.map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content
    }));
    
    const messages = [
      { role: "system" as const, content: systemPrompt },
      {
        role: "user" as const,
        content: [
          { type: "text" as const, text: "Here is the data visualization I want to discuss:" },
          { type: "image_url" as const, image_url: { url: imageUrl } }
        ]
      },
      ...formattedHistory,
      { role: "user" as const, content: userMessage }
    ];
    
    const response = await xai.chat.completions.create({
      model: "grok-2-vision-latest",
      messages: messages as any,
      max_tokens: 1000
    });
    
    return response.choices[0].message.content || "I couldn't analyze the visualization properly.";
  } catch (error) {
    console.error("Error in xAI chat:", error);
    return "I'm having trouble connecting. Please try again.";
  }
}

// Generate comprehensive analysis from text prompt (for multi-visualization projects)
export async function generateComprehensiveAnalysis(
  prompt: string,
  provider: string = "openai"
): Promise<{ summary: string; points: string[] }> {
  switch (provider) {
    case "google":
      return generateComprehensiveWithGemini(prompt);
    case "xai":
      return generateComprehensiveWithXAI(prompt);
    case "openai":
    default:
      return generateComprehensiveWithOpenAI(prompt);
  }
}

async function generateComprehensiveWithOpenAI(prompt: string): Promise<{ summary: string; points: string[] }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are Data Vizard, an expert business analyst. Analyze multiple related visualizations to provide comprehensive business insights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });
    
    const result = JSON.parse(response.choices[0].message.content || '{}');
    if (!result.summary || !Array.isArray(result.points)) {
      throw new Error("Invalid response format from OpenAI");
    }
    return result;
  } catch (error) {
    console.error("Error with OpenAI comprehensive analysis:", error);
    return getFallbackResponse();
  }
}

async function generateComprehensiveWithGemini(prompt: string): Promise<{ summary: string; points: string[] }> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.summary && Array.isArray(parsed.points)) {
        return parsed;
      }
    }
    
    // Fallback parsing
    return {
      summary: text.split('\n')[0] || text,
      points: text.split('\n').slice(1, 6).filter(line => line.trim())
    };
  } catch (error) {
    console.error("Error with Gemini comprehensive analysis:", error);
    return getFallbackResponse();
  }
}

async function generateComprehensiveWithXAI(prompt: string): Promise<{ summary: string; points: string[] }> {
  try {
    const response = await xai.chat.completions.create({
      model: "grok-2-latest",
      messages: [
        {
          role: "system",
          content: "You are Data Vizard, an expert business analyst. Analyze multiple related visualizations to provide comprehensive business insights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000
    });
    
    const text = response.choices[0].message.content || '';
    
    // Try to parse as JSON
    try {
      const result = JSON.parse(text);
      if (result.summary && Array.isArray(result.points)) {
        return result;
      }
    } catch {
      // Not JSON, fallback parsing
      return {
        summary: text.split('\n')[0] || text,
        points: text.split('\n').slice(1, 6).filter(line => line.trim())
      };
    }
    
    return getFallbackResponse();
  } catch (error) {
    console.error("Error with xAI comprehensive analysis:", error);
    return getFallbackResponse();
  }
}

// Fallback response
function getFallbackResponse(): { summary: string; points: string[] } {
  return {
    summary: "This visualization contains data that you can explore through our chat interface.",
    points: [
      "The chart format presents information in a structured way",
      "You can ask specific questions about elements in the visualization",
      "Try asking about trends, patterns, or specific data points"
    ]
  };
}
