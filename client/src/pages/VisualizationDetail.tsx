import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Visualization } from "@shared/schema";
import ChatMessages from "@/components/ChatMessages";
import ChatInput from "@/components/ChatInput";
import PreviewSection from "@/components/PreviewSection";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { WorkspaceToolbar } from "@/components/workspace/WorkspaceToolbar";
import { useChat } from "@/hooks/useChat";
import { readRecommendedQuestions } from "@/components/workspace/readAnalysis";

export default function VisualizationDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/visualization/:id");
  const id = params ? parseInt(params.id) : 0;
  const queryClient = useQueryClient();
  const [summary, setSummary] = useState<{ summary: string; points: string[] } | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const {
    data: visualization,
    isLoading,
    error,
  } = useQuery<Visualization>({
    queryKey: [`/api/visualizations/${id}`],
    queryFn: () => apiRequest<Visualization>(`/api/visualizations/${id}`),
    enabled: id > 0,
  });

  useEffect(() => {
    if (visualization?.initialSummary) {
      try {
        const parsedSummary = JSON.parse(visualization.initialSummary);
        setSummary(parsedSummary);
      } catch (parseError) {
        console.error("Failed to parse summary:", parseError);
      }
    }
  }, [visualization]);

  const { messages, isTyping, sendMessage, isSending, suggestedFollowUp } = useChat(id);

  const generateInsights = async () => {
    if (!visualization || isGeneratingInsights) return;

    setIsGeneratingInsights(true);
    setAnalysisError(null);

    try {
      const result = await apiRequest<{ visualization?: Visualization; summary: { summary: string; points: string[] } }>(
        visualization.projectGroup
          ? `/api/visualizations/project/${visualization.projectGroup}/analyze`
          : `/api/visualizations/${id}/analyze`,
        { method: "POST" },
      );

      setSummary(result.summary);
      queryClient.setQueryData(
        [`/api/visualizations/${id}`],
        result.visualization || { ...visualization, initialSummary: JSON.stringify(result.summary) },
      );
    } catch (requestError) {
      setAnalysisError(requestError instanceof Error ? requestError.message : "Analysis failed. Please retry.");
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const recommendedQuestions = readRecommendedQuestions(summary, visualization?.initialSummary);

  if (error) {
    return (
      <StatusMessage
        title="Something went wrong"
        body="We couldn't load this visualization. It may have been deleted or might not exist."
        onBack={() => setLocation("/projects")}
      />
    );
  }

  if (isLoading) {
    return (
      <WorkspaceShell
        chatReady
        toolbar={<div className="px-4 py-3 sm:px-6"><Skeleton className="h-6 w-48" /></div>}
        chart={<Skeleton className="mx-auto h-48 w-full max-w-xl rounded-md" />}
        insights={<div className="space-y-3"><Skeleton className="h-4 w-40" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/6" /></div>}
        chat={<div className="space-y-3 p-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-16 w-2/5" /><Skeleton className="h-16 w-3/5" /></div>}
      />
    );
  }

  if (!visualization) {
    return (
      <StatusMessage
        title="Visualization not found"
        body="The visualization you're looking for doesn't exist or has been deleted."
        onBack={() => setLocation("/projects")}
      />
    );
  }

  return (
    <WorkspaceShell
      chatReady
      toolbar={<WorkspaceToolbar visualization={visualization} isGenerating={isGeneratingInsights} />}
      chart={
        <PreviewSection
          part="chart"
          chartFit="panel"
          visualization={visualization}
          summary={summary}
          onGenerateInsights={generateInsights}
          isGenerating={isGeneratingInsights}
          showToolbar={false}
        />
      }
      insights={
        <>
          <PreviewSection
            part="insights"
            insightsDensity="panel"
            visualization={visualization}
            summary={summary}
            onGenerateInsights={generateInsights}
            isGenerating={isGeneratingInsights}
            showToolbar={false}
          />
          {analysisError && (
            <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              <p className="font-semibold">Analysis could not be completed</p>
              <p className="mt-1">{analysisError}</p>
              <p className="mt-1">Your previously saved report is unchanged. Use Reanalyze to retry.</p>
            </div>
          )}
        </>
      }
      chat={
        <>
          <ChatMessages
            messages={messages}
            isTyping={isTyping}
            phase={isGeneratingInsights ? "working" : summary || visualization.initialSummary ? "ready" : "saved"}
            recommendedQuestions={recommendedQuestions}
            onSelectQuestion={(question) => void sendMessage(question)}
            isSending={isSending || isTyping}
          />
          <ChatInput
            onSendMessage={sendMessage}
            isSending={isSending || isTyping}
            suggestedFollowUp={messages.length > 0 ? suggestedFollowUp : null}
          />
        </>
      }
    />
  );
}

function StatusMessage({ title, body, onBack }: { title: string; body: string; onBack: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-6 py-16 text-center">
      <h1 className="text-title font-semibold text-navy">{title}</h1>
      <p className="mt-3 text-body text-storm">{body}</p>
      <Button variant="brand" className="mt-6" onClick={onBack}>
        Back to Archive
      </Button>
    </div>
  );
}
