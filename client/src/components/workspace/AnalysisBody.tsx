import { Button } from "@/components/ui/button";
import { AnalysisContent, analysisHasContent } from "@/components/workspace/readAnalysis";
import { cn } from "@/lib/utils";

type AnalysisBodyProps = {
  analysis: AnalysisContent;
  isGenerating: boolean;
  chartCount: number;
  onGenerateInsights?: () => Promise<void>;
  density?: "default" | "panel";
};

export function AnalysisBody({
  analysis,
  isGenerating,
  chartCount,
  onGenerateInsights,
  density = "default",
}: AnalysisBodyProps) {
  const hasContent = analysisHasContent(analysis);
  const isPanel = density === "panel";
  const bodyClass = isPanel ? "text-sm leading-relaxed" : "text-body";

  return (
    <div>
      {!isPanel && (
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-heading font-semibold text-navy">
              <span className="h-4 w-1 rounded-full bg-forest" aria-hidden />
              AI Insights
            </h2>
            {chartCount > 1 && (
              <p className="mt-1 text-caption text-storm">Written across all {chartCount} charts.</p>
            )}
          </div>
          {onGenerateInsights && (
            <Button
              type="button"
              variant="brandOutline"
              size="sm"
              disabled={isGenerating}
              onClick={() => void onGenerateInsights()}
            >
              {isGenerating ? "Analyzing..." : hasContent ? "Reanalyze" : "Analyze chart"}
            </Button>
          )}
        </div>
      )}

      {isPanel && chartCount > 1 && (
        <p className="mb-3 text-caption text-storm">Written across all {chartCount} charts.</p>
      )}

      {isGenerating ? (
        <p className={cn(bodyClass, "text-storm")}>Analyzing your visualization...</p>
      ) : hasContent ? (
        <div className={cn(isPanel ? "space-y-4" : "space-y-6")}>
          {analysis.overview && (
            <section>
              <h3 className="text-caption font-medium uppercase tracking-[0.08em] text-forest">Overview</h3>
              <p className={cn("mt-2 max-w-prose whitespace-pre-wrap text-navy", bodyClass)}>{analysis.overview}</p>
            </section>
          )}
          {analysis.findings.length > 0 && (
            <section className={analysis.overview ? (isPanel ? "border-t border-sky pt-4" : "border-t border-sky pt-6") : undefined}>
              <h3 className="text-caption font-medium uppercase tracking-[0.08em] text-forest">Key Findings</h3>
              <ul className={cn("mt-3 max-w-prose", isPanel ? "space-y-2" : "space-y-3")}>
                {analysis.findings.map((point, index) => (
                  <li key={`${index}-${point.slice(0, 24)}`} className={cn("flex gap-3 text-navy", bodyClass)}>
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-forest" aria-hidden />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {analysis.details.length > 0 && (
            <section className={cn("border-t border-sky", isPanel ? "pt-4" : "pt-6")}>
              <h3 className="text-caption font-medium uppercase tracking-[0.08em] text-forest">Additional details</h3>
              <div className={cn("mt-3 max-w-prose", isPanel ? "space-y-3" : "space-y-4")}>
                {analysis.details.map((detail) => (
                  <div key={detail.label}>
                    <p className="text-caption font-medium text-slateblue">{detail.label}</p>
                    <p className={cn("mt-1 whitespace-pre-wrap text-navy", bodyClass)}>{detail.text}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
          {isPanel && onGenerateInsights && (
            <div className="border-t border-sky pt-4">
              <Button
                type="button"
                variant="brandOutline"
                size="sm"
                disabled={isGenerating}
                onClick={() => void onGenerateInsights()}
              >
                {isGenerating ? "Analyzing..." : hasContent ? "Reanalyze" : "Analyze chart"}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <p className={cn(bodyClass, "text-storm")}>No analysis has been saved for this visualization yet.</p>
          {isPanel && onGenerateInsights && (
            <Button
              type="button"
              variant="brandOutline"
              size="sm"
              className="mt-3"
              disabled={isGenerating}
              onClick={() => void onGenerateInsights()}
            >
              {isGenerating ? "Analyzing..." : "Analyze chart"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}