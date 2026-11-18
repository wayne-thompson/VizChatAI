import { useEffect, useState } from "react";
import { Expand } from "lucide-react";
import { Visualization } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ChartViewerProps = {
  charts: Visualization[];
  fit?: "stage" | "panel";
};

export function ChartViewer({ charts, fit = "stage" }: ChartViewerProps) {
  const isPanel = fit === "panel";
  const [selectedId, setSelectedId] = useState<number | null>(charts[0]?.id ?? null);
  const [expanded, setExpanded] = useState(false);
  const firstId = charts[0]?.id ?? null;
  const selectedStillPresent = selectedId != null && charts.some((chart) => chart.id === selectedId);

  useEffect(() => {
    if (!selectedStillPresent && selectedId !== firstId) setSelectedId(firstId);
  }, [selectedStillPresent, firstId, selectedId]);

  const selected = charts.find((chart) => chart.id === selectedId) ?? charts[0];
  if (!selected?.imageBase64) return <Skeleton className="h-64 w-full rounded-lg" />;

  const selectedIndex = Math.max(0, charts.findIndex((chart) => chart.id === selected.id));
  const imageAlt = selected.title || `Chart ${selectedIndex + 1}`;

  return (
    <div
      className={cn(
        "flex flex-col",
        isPanel ? "px-3 py-3" : "h-full min-h-0 px-4 py-2 sm:px-6",
      )}
    >
      {!isPanel && (
        <div className="flex h-8 shrink-0 items-center justify-between gap-3">
          <p className="text-caption text-storm">
            {charts.length > 1 ? `Chart ${selectedIndex + 1} of ${charts.length}` : "Chart"}
          </p>
          <Button type="button" variant="brandOutline" size="sm" aria-label="Expand chart" onClick={() => setExpanded(true)}>
            <Expand className="h-4 w-4" aria-hidden />
            Expand
          </Button>
        </div>
      )}
      <div
        className={cn(
          "relative flex items-center justify-center",
          isPanel ? "rounded-md bg-cloud px-2 py-2" : "min-h-0 flex-1",
        )}
      >
        <img
          src={selected.imageBase64}
          alt={imageAlt}
          className={cn(
            "w-full object-contain",
            isPanel ? "max-h-[22rem]" : "h-full",
          )}
        />
        {isPanel && (
          <Button
            type="button"
            variant="brandOutline"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 border-sky bg-white/95 shadow-card backdrop-blur-[2px] hover:bg-white"
            aria-label="Expand chart"
            onClick={() => setExpanded(true)}
          >
            <Expand className="h-4 w-4" aria-hidden />
          </Button>
        )}
      </div>
      {charts.length > 1 && (
        <div className="mt-1 flex shrink-0 gap-2 overflow-x-auto pb-1" role="list" aria-label="Charts in this analysis">
          {charts.map((chart, index) => {
            const isSelected = chart.id === selected.id;
            return (
              <button
                key={chart.id}
                type="button"
                role="listitem"
                aria-pressed={isSelected}
                aria-label={chart.title || `Show chart ${index + 1}`}
                onClick={() => setSelectedId(chart.id)}
                className={cn(
                  "h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-white p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30",
                  isSelected ? "border-navy ring-2 ring-navy/15" : "border-sky hover:border-slateblue",
                )}
              >
                <img src={chart.imageBase64} alt="" className="h-full w-full object-contain" />
              </button>
            );
          })}
        </div>
      )}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="w-fit max-w-[92vw] border-sky bg-cloud p-4 pt-10 sm:p-6">
          <DialogTitle className="sr-only">{imageAlt}</DialogTitle>
          <img src={selected.imageBase64} alt={imageAlt} className="mx-auto max-h-[85vh] max-w-full object-contain" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
