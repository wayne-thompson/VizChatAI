import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Visualization } from "@shared/schema";
import ChatHeader from "@/components/ChatHeader";
import ChatMessages from "@/components/ChatMessages";
import ChatInput from "@/components/ChatInput";
import PreviewSection from "@/components/PreviewSection";
import ShareSection from "@/components/ShareSection";
import { useChat } from "@/hooks/useChat";
import { useSharing } from "@/hooks/useSharing";

export default function VisualizationDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/visualization/:id");
  const id = params ? parseInt(params.id) : 0;
  const queryClient = useQueryClient();
  const [summary, setSummary] = useState<{ summary: string; points: string[] } | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  
  // No need for "New" button handling - it's now managed in the Layout component

  // Fetch visualization data
  const { 
    data: visualization, 
    isLoading, 
    error 
  } = useQuery<Visualization>({
    queryKey: [`/api/visualizations/${id}`],
    queryFn: () => apiRequest<Visualization>(`/api/visualizations/${id}`),
    enabled: id > 0
  });

  // Parse summary from visualization data
  useEffect(() => {
    if (visualization?.initialSummary) {
      try {
        const parsedSummary = JSON.parse(visualization.initialSummary);
        setSummary(parsedSummary);
      } catch (e) {
        console.error("Failed to parse summary:", e);
      }
    }
  }, [visualization]);

  // Set up chat functionality
  const {
    messages,
    isTyping,
    sendMessage
  } = useChat(id);

  // Set up sharing functionality
  const {
    updateVisualizationTags
  } = useSharing(id);

  // Generate insights function
  const generateInsights = async () => {
    if (!visualization || isGeneratingInsights) return;
    
    setIsGeneratingInsights(true);
    
    try {
      const result = await apiRequest<{ visualization: Visualization; summary: { summary: string; points: string[] } }>(
        `/api/visualizations/${id}/analyze`,
        { method: 'POST' }
      );
      
      setSummary(result.summary);
      
      // Update the visualization in the cache
      queryClient.setQueryData([`/api/visualizations/${id}`], result.visualization);
      
    } catch (error) {
      console.error("Failed to generate insights:", error);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  // Handle error state
  if (error) {
    return (
      <div className="container py-12 px-4 text-center">
        <h1 className="text-2xl font-bold mb-6">Something went wrong</h1>
        <p className="text-gray-600 mb-8">
          We couldn't load this visualization. It may have been deleted or might not exist.
        </p>
        <Button onClick={() => setLocation("/projects")}>
          Back to Projects
        </Button>
      </div>
    );
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex flex-col md:flex-row h-[calc(100vh-64px)]">
        <div className="w-full md:w-1/2 p-4 md:p-6 md:border-r border-gray-200 overflow-y-auto h-[50vh] md:h-full">
          <div className="max-w-xl mx-auto">
            <Skeleton className="h-6 w-1/2 mb-3" />
            <Skeleton className="h-4 w-3/4 mb-6" />
            <Skeleton className="h-64 w-full rounded-md mb-6" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-2" />
            <Skeleton className="h-4 w-4/6 mb-4" />
            <div className="flex space-x-2 mb-8">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/2 flex flex-col h-[50vh] md:h-full">
          <Skeleton className="h-14 w-full" />
          <div className="flex-1 p-4">
            <Skeleton className="h-10 w-5/6 mb-4" />
            <Skeleton className="h-10 w-4/6 mb-4" />
            <Skeleton className="h-10 w-3/4 mb-4" />
          </div>
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  // If no visualization found, show empty state
  if (!visualization) {
    return (
      <div className="container py-12 px-4 text-center">
        <h1 className="text-2xl font-bold mb-6">Visualization Not Found</h1>
        <p className="text-gray-600 mb-8">
          The visualization you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => setLocation("/projects")}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)]">
      {/* Left Panel: Preview */}
      <div className="w-full md:w-1/2 p-4 md:p-6 md:border-r border-gray-200 overflow-y-auto h-[50vh] md:h-full">
        <div className="max-w-xl mx-auto">
          <PreviewSection 
            visualization={visualization} 
            summary={summary}
            onGenerateInsights={generateInsights}
            isGenerating={isGeneratingInsights}
          />
          
          <ShareSection 
            visualization={visualization} 
            onUpdateTags={updateVisualizationTags}
          />
        </div>
      </div>

      {/* Right Panel: Chat Interface */}
      <div className="w-full md:w-1/2 flex flex-col h-[50vh] md:h-full">
        <ChatHeader />
        
        <ChatMessages messages={messages} isTyping={isTyping} />
        
        <ChatInput 
          onSendMessage={sendMessage} 
          isSending={isTyping} 
        />
      </div>
    </div>
  );
}