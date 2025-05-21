import OpenAI from "openai";

// Create a simple OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Simple function to generate a text response
export async function getSimpleResponse(prompt: string): Promise<string> {
  try {
    console.log("Sending simple text request to OpenAI");
    
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500
    });

    console.log("Received response from OpenAI");
    return response.choices[0].message.content || "No response received";
  } catch (error) {
    console.error("Error in simple OpenAI request:", error);
    return `Sorry, I'm having trouble connecting to my AI services. Error: ${error.message}`;
  }
}