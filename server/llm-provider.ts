import OpenAI from "openai";
import { GoogleGenAI, type Content, type Part } from "@google/genai";
import {
  AI_MODELS, AIRequestError, type AIProvider, type ChartAnalysis,
  parseAnalysis, parseImage, requireText, toAIError,
} from "./ai-utils";

type ChatMessage = { role: string; content: string };
type OpenAIMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

const analysisInstruction = "You are an expert data visualization analyst. Describe only the information visible in the supplied charts. Do not invent values or causal explanations. Return JSON with a 'summary' paragraph and a 'points' array of 3-5 nonempty strings containing chart-specific observations.";
const chatInstruction = `You are Data Vizard, a friendly expert data visualization analyst. Answer questions using the supplied chart images and previous conversation. Refer to visible labels, values, trends and comparisons. When something cannot be read or established from the charts, say so. If several charts are supplied, consider all of them.

Distinguish three kinds of claims:
- What the chart directly shows (labels, values, units, trends).
- A calculation or comparison derived from those values. Give the result first, then the figures you used.
- A possible external explanation the chart cannot establish. Label it as a possibility, never as a finding.

Do not invent values, units, or causes. Preserve the chart's units.

Write for a narrow chat panel:
- Start with the answer in one or two short sentences. A simple question can stop there.
- When there is more than one supporting point, use a Markdown hyphen list (\`-\`). This includes explanations and comparisons.
- Do not use a numbered list unless the user asked for steps, a sequence, or an explicit ranking.
- Bold the category, year, or metric, then add one short clause. Do not write a paragraph inside a bullet.
- For a calculation, give the result and the figures used. Do not add bullets.
- Skip long introductions, headings, and a closing paragraph that repeats the bullets.
- Format with Markdown only. Do not use HTML.

When you offer explanations the chart cannot prove, call them possible explanations. Do not present them as causes the chart establishes.`;

function providerName(provider: string): AIProvider {
  if (provider === "google" || provider === "openai" || provider === "xai") return provider;
  throw new AIRequestError("Select a supported AI provider in Account Settings.", "AI_INVALID_PROVIDER", 400);
}

// Clients are initialized only for the selected provider. An unconfigured,
// unrelated provider must not prevent the configured provider from working.
function openAIClient(provider: "openai" | "xai"): OpenAI {
  const key = provider === "openai" ? process.env.OPENAI_API_KEY : process.env.XAI_API_KEY;
  if (!key) throw new AIRequestError(`${provider === "openai" ? "OpenAI" : "xAI"} is not configured. Select another provider in Account Settings.`, "AI_NOT_CONFIGURED", 503, provider);
  return new OpenAI({
    apiKey: key,
    ...(provider === "xai" ? { baseURL: "https://api.x.ai/v1" } : {}),
    timeout: 60000,
    maxRetries: 1,
  });
}

function geminiClient(): GoogleGenAI {
  const key = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
  if (key || baseUrl) {
    if (!key || !baseUrl) throw new AIRequestError("The Replit Gemini integration is incomplete. Its key and base URL must both be configured.", "AI_NOT_CONFIGURED", 503, "google");
    return new GoogleGenAI({ apiKey: key, httpOptions: { baseUrl, apiVersion: "", timeout: 60000 } });
  }
  if (!process.env.GEMINI_API_KEY) throw new AIRequestError("Gemini is not configured. Select another provider in Account Settings.", "AI_NOT_CONFIGURED", 503, "google");
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { timeout: 60000 } });
}

function geminiImage(image: string): Part {
  const { data, mimeType } = parseImage(image);
  return { inlineData: { data, mimeType } };
}

function openAIImages(images: string[]): OpenAI.Chat.Completions.ChatCompletionContentPart[] {
  return images.map(image => ({ type: "image_url", image_url: { url: parseImage(image).dataUrl } }));
}

async function callProvider<T>(provider: AIProvider, call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    throw toAIError(error, provider);
  }
}

export async function analyzeVisualization(image: string, provider = "openai"): Promise<ChartAnalysis> {
  const selected = providerName(provider);
  return callProvider(selected, async () => {
    if (selected === "google") {
      const response = await geminiClient().models.generateContent({
        model: AI_MODELS.google,
        contents: [{ role: "user", parts: [{ text: "Analyze this chart." }, geminiImage(image)] }],
        config: { systemInstruction: analysisInstruction, responseMimeType: "application/json" },
      });
      return parseAnalysis(requireText(response.text));
    }
    const response = await openAIClient(selected).chat.completions.create({
      model: AI_MODELS[selected],
      messages: [
        { role: "system", content: analysisInstruction },
        { role: "user", content: [{ type: "text", text: "Analyze this chart." }, ...openAIImages([image])] },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1200,
    });
    return parseAnalysis(requireText(response.choices[0]?.message.content ?? undefined));
  });
}

export async function getVisualizationChatResponse(
  image: string | string[],
  userMessage: string,
  chatHistory: ChatMessage[],
  provider = "openai",
): Promise<string> {
  const selected = providerName(provider);
  const images = Array.isArray(image) ? image : [image];
  if (!images.length) throw new AIRequestError("This report has no chart images. Upload the chart again.", "AI_INVALID_IMAGE", 400);
  return callProvider(selected, async () => {
    if (selected === "google") {
      const contents: Content[] = [
        { role: "user", parts: [{ text: `These are the ${images.length} chart image(s) for this conversation.` }, ...images.map(geminiImage)] },
        ...chatHistory.filter(message => ["user", "assistant"].includes(message.role)).map(message => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }],
        })),
        { role: "user", parts: [{ text: userMessage }] },
      ];
      const response = await geminiClient().models.generateContent({
        model: AI_MODELS.google, contents, config: { systemInstruction: chatInstruction },
      });
      return requireText(response.text);
    }
    const messages: OpenAIMessage[] = [
      { role: "system", content: chatInstruction },
      { role: "user", content: [{ type: "text", text: `These are the ${images.length} chart image(s) for this conversation.` }, ...openAIImages(images)] },
      ...chatHistory.filter(message => ["user", "assistant"].includes(message.role)).map(message => ({
        role: message.role as "user" | "assistant", content: message.content,
      })),
      { role: "user", content: userMessage },
    ];
    const response = await openAIClient(selected).chat.completions.create({
      model: AI_MODELS[selected], messages, max_tokens: 1400,
    });
    return requireText(response.choices[0]?.message.content ?? undefined);
  });
}

export async function generateComprehensiveAnalysis(prompt: string, provider = "openai"): Promise<ChartAnalysis> {
  const selected = providerName(provider);
  return callProvider(selected, async () => {
    if (selected === "google") {
      const response = await geminiClient().models.generateContent({
        model: AI_MODELS.google, contents: prompt,
        config: { systemInstruction: analysisInstruction, responseMimeType: "application/json" },
      });
      return parseAnalysis(requireText(response.text));
    }
    const response = await openAIClient(selected).chat.completions.create({
      model: selected === "xai" ? AI_MODELS.xaiText : AI_MODELS.openai,
      messages: [{ role: "system", content: analysisInstruction }, { role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 1800,
    });
    return parseAnalysis(requireText(response.choices[0]?.message.content ?? undefined));
  });
}

// Create uses the same client/model/error handling as Gemini chart analysis.
export async function generateGeminiText(parts: Part[]): Promise<string> {
  return callProvider("google", async () => {
    const response = await geminiClient().models.generateContent({
      model: AI_MODELS.google,
      contents: [{ role: "user", parts }],
      config: { responseMimeType: "application/json" },
    });
    return requireText(response.text);
  });
}
