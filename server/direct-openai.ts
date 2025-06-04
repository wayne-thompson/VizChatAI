import OpenAI from "openai";

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Function to check if the API key is valid
export async function isApiKeyValid(): Promise<boolean> {
  try {
    await openai.models.retrieve("gpt-4o");
    return true;
  } catch (error) {
    console.error("Error validating OpenAI API key:", error);
    return false;
  }
}

// Send a message to chat with context about a visualization
export async function getVisualizationChatResponse(
  imageBase64: string, 
  userMessage: string, 
  chatHistory: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    // Ensure image URL is properly formatted
    const imageUrl = imageBase64.startsWith('data:') 
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;
    
    console.log("Preparing to send message to OpenAI Vision API");
    
    // Create system message to explain the assistant's role
    const systemPrompt = "You are Viz, a friendly and expert-level data visualization analyst. You're helping a user understand their chart or graph. Provide clear, insightful explanations about the visualization shown in the image. Refer directly to visual elements, data points, trends, and patterns visible in the chart. If you're uncertain about something, acknowledge it. Your goal is to help extract valuable insights from the data visualization.";
    
    // Format chat history for the API
    const formattedHistory = chatHistory.map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content
    }));
    
    // Build messages array with system message, image, and chat history
    const messages = [
      {
        role: "system" as const,
        content: systemPrompt
      },
      {
        role: "user" as const,
        content: [
          {
            type: "text" as const,
            text: "Here is the data visualization I want to discuss:"
          },
          {
            type: "image_url" as const,
            image_url: {
              url: imageUrl
            }
          }
        ]
      },
      ...formattedHistory,
      {
        role: "user" as const,
        content: userMessage
      }
    ];
    
    console.log("Sending request to OpenAI with visualization context");
    
    // Make API call
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any, // Type assertion needed due to complex message structure
      max_tokens: 1000
    });
    
    return response.choices[0].message.content || "I couldn't analyze the visualization properly.";
  } catch (error) {
    console.error("Error in OpenAI chat:", error);
    return "I'm having trouble connecting to analyze your visualization right now. Could you please try again in a moment?";
  }
}

// Analyze a visualization image
export async function analyzeVisualization(imageBase64: string): Promise<{ summary: string; points: string[] }> {
  try {
    // Ensure image URL is properly formatted
    const imageUrl = imageBase64.startsWith('data:') 
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;
    
    console.log("Sending visualization to OpenAI for analysis");
    
    // Make the API call
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
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 800
    });
    
    // Parse and validate response
    const responseText = response.choices[0].message.content || '';
    const result = JSON.parse(responseText);
    
    if (!result.summary || !Array.isArray(result.points)) {
      throw new Error("Invalid response format from OpenAI");
    }
    
    return result;
  } catch (error) {
    console.error("Error analyzing visualization with OpenAI:", error);
    
    // Return a fallback response
    return {
      summary: "This visualization contains data that you can explore through our chat interface.",
      points: [
        "The chart format presents information in a structured way",
        "You can ask specific questions about elements in the visualization",
        "Try asking about trends, patterns, or specific data points"
      ]
    };
  }
}