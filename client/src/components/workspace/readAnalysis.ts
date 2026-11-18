export { readRecommendedQuestions } from "@shared/recommendedQuestions";

export type AnalysisDetail = {
  label: string;
  text: string;
};

export type AnalysisContent = {
  overview: string | null;
  findings: string[];
  details: AnalysisDetail[];
};

function pointText(point: unknown): string | null {
  if (typeof point === "string") {
    const trimmed = point.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (point && typeof point === "object") {
    const record = point as Record<string, unknown>;
    for (const key of ["content", "text", "point", "description", "insight"]) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }

    const keys = Object.keys(record);
    if (keys.length === 1) {
      const only = record[keys[0]];
      if (typeof only === "string" && only.trim()) return only.trim();
      if (only != null && typeof only !== "object") {
        const text = String(only).trim();
        return text || null;
      }
    }

    const text = JSON.stringify(point).replace(/[{}]/g, "").replace(/"/g, "").trim();
    return text || null;
  }

  if (point == null) return null;
  const text = String(point).trim();
  return text || null;
}

function labelFor(key: string): string {
  const spaced = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function detailText(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!Array.isArray(value)) return null;
  const lines = value.map(pointText).filter((line): line is string => Boolean(line));
  return lines.length > 0 ? lines.join("\n") : null;
}

function fromRecord(record: Record<string, unknown>): AnalysisContent {
  const overview =
    typeof record.summary === "string" && record.summary.trim() ? record.summary.trim() : null;
  const findings = Array.isArray(record.points)
    ? record.points.map(pointText).filter((point): point is string => Boolean(point))
    : [];

  const details: AnalysisDetail[] = [];
  for (const [key, value] of Object.entries(record)) {
    if (key === "summary" || key === "points" || key === "recommendedQuestions") continue;
    const text = detailText(value);
    if (text) details.push({ label: labelFor(key), text });
  }

  return { overview, findings, details };
}

export function readAnalysis(
  summary: unknown,
  initialSummary?: string | null,
): AnalysisContent {
  if (summary && typeof summary === "object") {
    return fromRecord(summary as Record<string, unknown>);
  }

  if (!initialSummary?.trim()) {
    return { overview: null, findings: [], details: [] };
  }

  try {
    const parsed: unknown = JSON.parse(initialSummary);
    if (parsed && typeof parsed === "object") {
      return fromRecord(parsed as Record<string, unknown>);
    }
  } catch {
    return { overview: initialSummary.trim(), findings: [], details: [] };
  }

  return { overview: null, findings: [], details: [] };
}

export function analysisHasContent(analysis: AnalysisContent): boolean {
  return Boolean(analysis.overview || analysis.findings.length || analysis.details.length);
}
