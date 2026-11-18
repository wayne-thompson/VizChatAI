export const RECOMMENDED_QUESTION_MAX_LENGTH = 180;

export type RecommendedQuestionsOmitReason =
  | "missing"
  | "not_array"
  | "wrong_count"
  | "invalid_entry"
  | "too_long";

export function parseRecommendedQuestions(
  value: unknown,
): { questions: string[] } | { reason: RecommendedQuestionsOmitReason } {
  if (value === undefined || value === null) {
    return { reason: "missing" };
  }
  if (!Array.isArray(value)) {
    return { reason: "not_array" };
  }
  if (value.length !== 3) {
    return { reason: "wrong_count" };
  }
  const questions: string[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !item.trim()) {
      return { reason: "invalid_entry" };
    }
    const trimmed = item.trim();
    if (trimmed.length > RECOMMENDED_QUESTION_MAX_LENGTH) {
      return { reason: "too_long" };
    }
    questions.push(trimmed);
  }
  return { questions };
}

function questionsFromRecord(record: Record<string, unknown>): string[] {
  const parsed = parseRecommendedQuestions(record.recommendedQuestions);
  return "questions" in parsed ? parsed.questions : [];
}

export type SuggestedFollowUpOmitReason = "missing" | "invalid" | "too_long";

export function parseSuggestedFollowUp(
  value: unknown,
): { question: string } | { reason: SuggestedFollowUpOmitReason } {
  if (value === undefined || value === null || value === "") {
    return { reason: "missing" };
  }
  if (typeof value !== "string" || !value.trim()) {
    return { reason: "invalid" };
  }
  const trimmed = value.trim();
  if (trimmed.length > RECOMMENDED_QUESTION_MAX_LENGTH) {
    return { reason: "too_long" };
  }
  return { question: trimmed };
}

export function readRecommendedQuestions(summary: unknown, initialSummary?: string | null): string[] {
  if (summary && typeof summary === "object") {
    return questionsFromRecord(summary as Record<string, unknown>);
  }

  if (!initialSummary?.trim()) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(initialSummary);
    if (parsed && typeof parsed === "object") {
      return questionsFromRecord(parsed as Record<string, unknown>);
    }
  } catch {
    return [];
  }

  return [];
}