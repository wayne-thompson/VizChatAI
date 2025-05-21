import OpenAI from "openai";

// Create OpenAI client directly with API key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Function for text-only chat completions
export async function getChatCompletion(prompt: string): Promise<string> {
  try {
    console.log("Sending text completion request to OpenAI");
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    });
    
    console.log("Received response from OpenAI chat completion");
    return response.choices[0].message.content || "No response generated.";
  } catch (error: any) {
    console.error("Error in OpenAI chat completion:", error.message);
    return "I encountered an issue connecting to my knowledge source. Please try again in a moment.";
  }
}

// Function for analyzing images with Vision API
export async function analyzeImage(imageBase64: string): Promise<string> {
  try {
    console.log("Sending image analysis request to OpenAI Vision");
    
    // Ensure the image URL is properly formatted
    const imageUrl = imageBase64.startsWith('data:') 
      ? imageBase64 
      : `data:image/jpeg;base64,${imageBase64}`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model with vision capabilities
      messages: [
        {
          role: "system", 
          content: "You are a data visualization analysis expert. Analyze the chart and provide insights."
        },
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Analyze this data visualization. What does it show? What are the key insights?" 
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
    
    console.log("Received response from OpenAI Vision");
    return response.choices[0].message.content || "I couldn't analyze the image.";
  } catch (error: any) {
    console.error("Error in OpenAI Vision analysis:", error.message);
    return "I encountered an issue analyzing the image. Please try again later.";
  }
}