export type AIProvider = "openai" | "google" | "xai";

export const AI_MODELS = {
  openai: "gpt-4o",
  google: "gemini-2.5-flash",
  xai: "grok-4-0709",
  xaiText: "grok-3",
} as const;

const providerNames = { openai: "OpenAI", google: "Gemini", xai: "xAI" };

export class AIRequestError extends Error {
  constructor(
    message: string,
    public code: string,
    public httpStatus = 502,
    public provider?: AIProvider,
  ) {
    super(message);
    this.name = "AIRequestError";
  }
}

// Never forward SDK error messages/headers: they may contain credentials or URLs.
export function toAIError(error: unknown, provider?: AIProvider): AIRequestError {
  if (error instanceof AIRequestError) {
    error.provider ??= provider;
    return error;
  }
  const detail = error as { status?: number; code?: string | number; message?: string };
  const status = Number(detail?.status || detail?.code);
  const message = typeof detail?.message === "string" ? detail.message.toLowerCase() : "";
  const name = provider ? providerNames[provider] : "The AI provider";
  if (/credit|billing|insufficient_quota|quota.*exceed|resource_exhausted/.test(message)) {
    return new AIRequestError(`${name} has reached its API credit or quota limit. Restore its quota or select another provider in Account Settings.`, "AI_QUOTA_EXCEEDED", 503, provider);
  }
  if (status === 429) {
    return new AIRequestError(`${name} is rate limited. Wait briefly and try again.`, "AI_RATE_LIMITED", 429, provider);
  }
  if (status === 401 || status === 403) {
    return new AIRequestError(`${name} rejected the configured credentials or access. Check the provider setup or select another provider in Account Settings.`, "AI_ACCESS_DENIED", 503, provider);
  }
  if (status === 404) {
    return new AIRequestError(`${name}'s configured model or endpoint is unavailable. Check the AI configuration.`, "AI_MODEL_UNAVAILABLE", 503, provider);
  }
  return new AIRequestError(`${name} could not complete this request. Your image and saved conversation have not been removed. Please try again or select another provider in Account Settings.`, "AI_REQUEST_FAILED", 502, provider);
}

export function parseImage(image: string): { data: string; mimeType: string; dataUrl: string } {
  const match = /^data:(image\/(?:png|jpeg));base64,([\s\S]+)$/i.exec(image);
  const data = match ? match[2] : image;
  const mimeType = match?.[1].toLowerCase() ??
    (data.startsWith("iVBOR") ? "image/png" : data.startsWith("/9j/") ? "image/jpeg" : null);
  if (!mimeType || !data.trim() || !/^[A-Za-z0-9+/\s]*={0,2}$/.test(data)) {
    throw new AIRequestError("The saved image is not a valid JPEG or PNG. Upload the original chart again.", "AI_INVALID_IMAGE", 400);
  }
  return { data, mimeType, dataUrl: `data:${mimeType};base64,${data}` };
}

export type ChartAnalysis = { summary: string; points: string[] };

export function parseAnalysis(text: string): ChartAnalysis {
  const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  try {
    const result = JSON.parse(cleaned);
    if (typeof result.summary === "string" && result.summary.trim() &&
        Array.isArray(result.points) && result.points.length &&
        result.points.every((point: unknown) => typeof point === "string" && point.trim())) {
      return { summary: result.summary.trim(), points: result.points.map((point: string) => point.trim()) };
    }
  } catch {
    // Invalid output must be an explicit failure, never a fabricated analysis.
  }
  throw new AIRequestError("The AI returned an incomplete analysis. Please retry; no replacement summary was saved.", "AI_INVALID_RESPONSE");
}

export function requireText(text: string | undefined): string {
  if (!text?.trim()) throw new AIRequestError("The AI returned an empty response. Please try again.", "AI_INVALID_RESPONSE");
  return text.trim();
}
