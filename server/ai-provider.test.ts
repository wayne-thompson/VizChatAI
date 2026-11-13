import { strict as assert } from "node:assert";
import { createServer } from "node:http";
import { test } from "node:test";
import { AI_MODELS, parseAnalysis, parseImage, toAIError } from "./ai-utils";
import { analyzeVisualization, generateComprehensiveAnalysis, generateGeminiText, getVisualizationChatResponse } from "./llm-provider";
import { loadChatContext } from "./chat-context";
import type { Visualization, Message } from "@shared/schema";

const png = "data:image/png;base64,iVBORw0KGgo=";
const jpeg = "data:image/jpeg;base64,/9j/2Q==";

test("preserves JPEG and PNG content types and rejects invalid saved images", () => {
  assert.equal(parseImage(png).mimeType, "image/png");
  assert.equal(parseImage(jpeg).mimeType, "image/jpeg");
  assert.equal(parseImage("iVBORw0KGgo=").mimeType, "image/png");
  assert.throws(() => parseImage("data:image/gif;base64,R0lG"), /not a valid JPEG or PNG/);
});

test("requires real, structured analysis rather than a canned fallback", () => {
  assert.deepEqual(parseAnalysis('```json\n{"summary":"Revenue rose.","points":["June had the highest revenue."]}\n```'), {
    summary: "Revenue rose.", points: ["June had the highest revenue."],
  });
  assert.throws(() => parseAnalysis(""), /incomplete analysis/);
  assert.throws(() => parseAnalysis('{"summary":"Result","points":[{}]}'), /incomplete analysis/);
});

test("turns provider failures into safe actionable messages without echoing details", () => {
  const failure = toAIError({ status: 429, message: "No credits remaining; private-header=test-secret" }, "openai");
  assert.equal(failure.code, "AI_QUOTA_EXCEEDED");
  assert.match(failure.message, /Account Settings/);
  assert.doesNotMatch(failure.message, /test-secret|private-header/);
  assert.equal(toAIError({ status: 401 }, "xai").code, "AI_ACCESS_DENIED");
  assert.equal(toAIError({ status: 404 }, "google").code, "AI_MODEL_UNAVAILABLE");
});

test("saved chart groups reload every owned image and a chronological conversation without rewriting records", async () => {
  const charts = [
    { id: 1, userId: "owner", projectGroup: "group", imageBase64: png },
    { id: 2, userId: "owner", projectGroup: "group", imageBase64: jpeg },
    { id: 3, userId: "other-owner", projectGroup: "group", imageBase64: "private" },
  ] as Visualization[];
  const messages = [
    { id: 2, visualizationId: 2, role: "assistant", content: "B is highest.", createdAt: new Date(2000) },
    { id: 1, visualizationId: 1, role: "user", content: "Which is highest?", createdAt: new Date(1000) },
  ] as Message[];
  const readIds: number[] = [];
  const storage = {
    getVisualizationsByProjectGroup: async () => charts,
    getMessagesByVisualization: async (id: number) => {
      readIds.push(id);
      return messages.filter(message => message.visualizationId === id);
    },
  };
  const context = await loadChatContext(storage, charts[1]);
  assert.deepEqual(context.charts.map(chart => chart.imageBase64), [png, jpeg]);
  assert.deepEqual(context.messages.map(message => message.id), [1, 2]);
  assert.deepEqual(readIds, [1, 2]);
  const single = await loadChatContext(storage, { ...charts[0], projectGroup: null });
  assert.equal(single.charts.length, 1);
  assert.equal(single.messages[0].content, "Which is highest?");
});

test("Gemini analysis, saved chat context, group images and Create use the Replit SDK request shape", async () => {
  const requests: { url: string; body: any }[] = [];
  let fail = false;
  const server = createServer(async (req, res) => {
    let data = "";
    for await (const chunk of req) data += chunk;
    requests.push({ url: req.url || "", body: JSON.parse(data) });
    res.setHeader("Content-Type", "application/json");
    if (fail) {
      res.statusCode = 429;
      res.end(JSON.stringify({ error: { code: 429, status: "RESOURCE_EXHAUSTED", message: "No credits remaining" } }));
      return;
    }
    const text = JSON.stringify({ summary: "June revenue was highest.", points: ["June exceeded May."] });
    res.end(JSON.stringify({ candidates: [{ content: { role: "model", parts: [{ text }] }, finishReason: "STOP" }] }));
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  // These are test-process-only placeholders, never workspace or production Secrets.
  process.env.AI_INTEGRATIONS_GEMINI_API_KEY = "test-only";
  process.env.AI_INTEGRATIONS_GEMINI_BASE_URL = `http://127.0.0.1:${address.port}`;
  try {
    const result = await analyzeVisualization(png, "google");
    assert.match(result.summary, /June/);
    assert.match(requests[0].url, new RegExp(AI_MODELS.google));
    assert.equal(requests[0].body.contents[0].parts[1].inlineData.mimeType, "image/png");
    assert.equal(requests[0].body.generationConfig.responseMimeType, "application/json");

    await getVisualizationChatResponse([png, jpeg], "Compare both charts.", [
      { role: "user", content: "What happened in May?" },
      { role: "assistant", content: "May revenue was lower." },
    ], "google");
    const chat = requests[1].body.contents;
    assert.equal(chat[0].parts.filter((part: any) => part.inlineData).length, 2);
    assert.equal(chat[0].parts[2].inlineData.mimeType, "image/jpeg");
    assert.equal(chat[2].role, "model");
    assert.equal(chat[2].parts[0].text, "May revenue was lower.");
    assert.equal(chat[3].parts[0].text, "Compare both charts.");

    await generateComprehensiveAnalysis("Compare chart summaries", "google");
    await generateGeminiText([{ text: "Create three chart specifications" }]);
    assert.ok(requests.every(request => request.url.includes(AI_MODELS.google)));

    fail = true;
    await assert.rejects(analyzeVisualization(png, "google"), (error: any) => error.code === "AI_QUOTA_EXCEEDED");
    await assert.rejects(getVisualizationChatResponse(png, "Why?", [], "google"), (error: any) => error.code === "AI_QUOTA_EXCEEDED");
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
