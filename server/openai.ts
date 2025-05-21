import OpenAI from "openai";

// Initialize OpenAI client with API key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Async function to check if the OpenAI API key is valid
export async function checkOpenAIKey(): Promise<boolean> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not found in environment variables");
      return false;
    }

    // Make a simple models list call to verify the key works
    await openai.models.list();
    console.log("OpenAI API key is valid");
    return true;
  } catch (error) {
    console.error("OpenAI API key verification failed:", error);
    return false;
  }
}

// Function to analyze a visualization image
export async function analyzeVisualization(imageBase64: string): Promise<{ summary: string; points: string[] }> {
  try {
    // Ensure the image URL is properly formatted
    const imageUrl = imageBase64.startsWith('data:') 
      ? imageBase64 
      : `data:image/jpeg;base64,${imageBase64}`;

    console.log("Sending analysis request to OpenAI");
    
    // Make the API call with proper error handling
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: "You are an expert data visualization analyst. Analyze the chart or graph in the image and provide a concise, insightful summary. Respond with JSON containing a 'summary' (paragraph overview) and 'points' (array of key insights)."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this data visualization and provide key insights about the trends, patterns, and notable data points."
            },
            {
              type: "image_url",
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
    });

    // Parse and validate the JSON response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    const result = JSON.parse(content);
    
    // Validate the result structure
    if (!result.summary || !Array.isArray(result.points)) {
      throw new Error("Invalid response format from OpenAI");
    }

    return result;
  } catch (error) {
    console.error("Error in OpenAI visualization analysis:", error);
    // Return a fallback result
    return {
      summary: "I couldn't analyze this visualization properly. Please try again or ask me specific questions about what you see.",
      points: [
        "The visualization might contain interesting data points to explore",
        "Consider what trends or patterns you notice visually",
        "Try asking about specific elements in the chart"
      ]
    };
  }
}

// Function to get a chat response
export async function getChatResponse(messages: Array<{ role: string; content: string }>): Promise<string> {
  try {
    // Format messages for the API
    const formattedMessages = messages.map(msg => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content
    }));

    // Add system message if not present
    if (!formattedMessages.some(msg => msg.role === "system")) {
      formattedMessages.unshift({
        role: "system",
        content: "You are Viz, a friendly and expert-level data visualization analyst. You're helping a user understand their chart or graph. Provide clear, insightful explanations. Be concise but thorough."
      });
    }

    // Make the API call
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: formattedMessages,
      max_tokens: 1000,
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't provide a response at the moment.";
  } catch (error) {
    console.error("Error in OpenAI chat response:", error);
    return "I'm having trouble connecting to my knowledge database right now. Could you please try again in a moment?";
  }
}

export default openai;