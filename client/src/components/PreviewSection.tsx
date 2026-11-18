import { useMemo } from "react";
import { Visualization } from "@shared/schema";
import { AnalysisBody } from "@/components/workspace/AnalysisBody";
import { ChartViewer } from "@/components/workspace/ChartViewer";
import { readAnalysis } from "@/components/workspace/readAnalysis";
import { WorkspaceToolbar } from "@/components/workspace/WorkspaceToolbar";

interface PreviewSectionProps {
  visualization: Visualization | null;
  visualizations?: Visualization[];
  summary: { summary: string; points: string[] } | null;
  isGenerating: boolean;
  onGenerateInsights?: () => Promise<void>;
  showToolbar?: boolean;
  part?: "all" | "chart" | "insights";
  chartFit?: "stage" | "panel";
  insightsDensity?: "default" | "panel";
}

export default function PreviewSection({
  visualization,
  visualizations = [],
  summary,
  isGenerating,
  onGenerateInsights,
  showToolbar = true,
  part = "all",
  chartFit = "stage",
  insightsDensity = "default",
}: PreviewSectionProps) {
  const charts = useMemo(() => {
    if (!visualization) return [];
    return visualizations.length > 0 ? visualizations : [visualization];
  }, [visualization, visualizations]);

  if (!visualization) return null;

  const analysis = readAnalysis(summary, visualization.initialSummary);

  const chartView = <ChartViewer charts={charts} fit={chartFit} />;
  const insights = (
    <AnalysisBody
      analysis={analysis}
      isGenerating={isGenerating}
      chartCount={charts.length}
      onGenerateInsights={onGenerateInsights}
      density={insightsDensity}
    />
  );

  if (part === "chart") return chartView;
  if (part === "insights") return insights;

  return (
    <div id="preview-section">
      {showToolbar && (
        <div className="mb-4 overflow-hidden rounded-lg border border-sky bg-white">
          <WorkspaceToolbar visualization={visualization} isGenerating={isGenerating} />
        </div>
      )}
      {chartView}
      <div className="mt-6">{insights}</div>
    </div>
  );
}
