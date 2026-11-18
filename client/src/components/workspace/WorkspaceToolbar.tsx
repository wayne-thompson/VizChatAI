import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useLocation } from "wouter";
import { Loader2, PanelRightOpen, Pencil } from "lucide-react";
import { Visualization } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ActiveModelChip from "@/components/ActiveModelChip";
import { useContextPanel } from "@/components/workspace/WorkspaceShell";

type WorkspaceToolbarProps = {
  visualization: Visualization;
  isGenerating: boolean;
};

export function WorkspaceToolbar({ visualization, isGenerating }: WorkspaceToolbarProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const contextPanel = useContextPanel();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const titleSaveInFlight = useRef(false);
  const committedTitle = useRef(visualization.title || "");
  const [title, setTitle] = useState(visualization.title || "Untitled Visualization");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    committedTitle.current = visualization.title || "";
    setTitle(visualization.title || "Untitled Visualization");
  }, [visualization.id, visualization.title]);

  const startEditingTitle = () => {
    setIsEditingTitle(true);
    setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }, 0);
  };

  const saveTitle = async () => {
    const nextTitle = title.trim();
    if (!nextTitle) {
      setTitle(visualization.title || "Untitled Visualization");
      setIsEditingTitle(false);
      return;
    }

    if (nextTitle === committedTitle.current || titleSaveInFlight.current) {
      setIsEditingTitle(false);
      return;
    }

    titleSaveInFlight.current = true;
    try {
      setIsSavingTitle(true);
      await apiRequest(`/api/visualizations/${visualization.id}`, {
        method: "PATCH",
        data: { title: nextTitle },
      });
      committedTitle.current = nextTitle;
      toast({
        title: "Title updated",
        description: "Visualization title has been updated",
      });
      setIsEditingTitle(false);
    } catch {
      toast({
        title: "Error updating title",
        description: "Could not update the visualization title",
        variant: "destructive",
      });
      setTitle(visualization.title || "Untitled Visualization");
    } finally {
      titleSaveInFlight.current = false;
      setIsSavingTitle(false);
    }
  };

  const handleTitleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void saveTitle();
    }
    if (event.key === "Escape") {
      setTitle(visualization.title || "Untitled Visualization");
      setIsEditingTitle(false);
    }
  };

  const saveReport = async () => {
    setIsSaving(true);
    try {
      toast({
        title: "Report saved",
        description: "Your analysis has been archived successfully.",
      });
      setLocation("/");
    } catch {
      toast({
        title: "Error",
        description: "Failed to save report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = () => {
    if (!visualization.shareId) return;
    const reportUrl = `${window.location.origin}/report/${visualization.shareId}`;
    navigator.clipboard.writeText(reportUrl);
    toast({
      title: "Link copied",
      description: "Report link has been copied to clipboard",
    });
  };

  return (
    <div className="flex h-full w-full min-w-0 items-center gap-3 px-4 sm:px-5">
      <div className="min-w-0 flex-1">
        {isEditingTitle ? (
          <div className="flex items-center gap-2">
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              aria-label="Analysis title"
              placeholder="Enter visualization title"
              disabled={isSavingTitle}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={handleTitleKeyDown}
              onBlur={saveTitle}
              className="h-9 w-full min-w-0 rounded-md border border-sky bg-white px-3 text-heading font-semibold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
            />
            {isSavingTitle && <Loader2 className="h-4 w-4 animate-spin text-storm" aria-hidden />}
          </div>
        ) : (
          <button
            type="button"
            onClick={startEditingTitle}
            className="group flex max-w-full items-center gap-2 rounded-md px-1 py-1 text-left hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
          >
            <span className="truncate text-heading font-semibold text-navy">
              {title || "Untitled Visualization"}
            </span>
            <Pencil className="h-3.5 w-3.5 shrink-0 text-storm" aria-hidden />
            <span className="sr-only">Edit title</span>
          </button>
        )}
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {contextPanel && !contextPanel.isContextPanelOpen && (
          <Button
            type="button"
            variant="brandOutline"
            size="sm"
            className="lg:hidden"
            aria-label="Open Chart and Insights"
            onClick={contextPanel.openContextPanel}
          >
            <PanelRightOpen className="mr-1.5 h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Chart &amp; Insights</span>
            <span className="sm:hidden">Chart</span>
          </Button>
        )}
        <ActiveModelChip />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="brandOutline"
              size="sm"
              onClick={handleShare}
              disabled={!visualization.shareId}
              data-testid="button-share"
              aria-label="Share. Copy report link."
            >
              Share
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy report link</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="brand"
              size="sm"
              onMouseDown={(event) => {
                if (isEditingTitle) event.preventDefault();
              }}
              onClick={() => {
                if (isEditingTitle) {
                  void saveTitle();
                  return;
                }
                void saveReport();
              }}
              disabled={isSaving || isGenerating}
              aria-label={isEditingTitle ? "Save title" : "Save. Already saved to your archive. Returns home."}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
                {isEditingTitle ? "Save title" : "Already saved to your archive. Returns home."}
              </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

export function WorkspaceTitle({ children }: { children: string }) {
  return (
    <div className="flex h-14 items-center px-4 sm:px-5">
      <p className="text-nav font-semibold text-navy">{children}</p>
    </div>
  );
}
