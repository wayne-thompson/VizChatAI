import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Visualization, Message } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export default function StaticReport() {
  const [, params] = useRoute<{ shareId: string }>("/report/:shareId");
  const [summary, setSummary] = useState<{ summary: string; points: string[] } | null>(null);
  
  // Fetch the shared visualization data
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/share/${params?.shareId}`],
    queryFn: () => apiRequest<{
      visualization: Visualization;
      messages: Message[];
    }>(`/api/share/${params?.shareId}`),
    enabled: !!params?.shareId,
  });
  
  useEffect(() => {
    if (data?.visualization?.initialSummary) {
      try {
        setSummary(JSON.parse(data.visualization.initialSummary));
      } catch (e) {
        setSummary(null);
      }
    }
  }, [data]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <Skeleton className="h-12 w-3/4 mb-6" />
        <Skeleton className="h-40 w-full mb-8" />
        <Skeleton className="h-24 w-full mb-4" />
        <div className="space-y-4 mt-8">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4 text-center">
        <div className="mb-4 text-red-500">
          <i className="fas fa-exclamation-triangle text-4xl"></i>
        </div>
        <h1 className="text-2xl font-bold mb-2">Report Not Found</h1>
        <p className="text-gray-600">
          The shared report link might be invalid or has expired.
        </p>
      </div>
    );
  }
  
  const { visualization, messages } = data;
  
  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Report Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{visualization.title || "Untitled Visualization"}</h1>
        <div className="flex items-center text-gray-500 mb-4">
          <i className="fas fa-calendar-alt mr-2"></i>
          <span>Generated {formatDistanceToNow(new Date(visualization.createdAt), { addSuffix: true })}</span>
        </div>
        {visualization.description && (
          <p className="text-gray-700 mb-4">{visualization.description}</p>
        )}
        {visualization.tags && visualization.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {visualization.tags.map((tag, i) => (
              <Badge key={i} variant="secondary">{tag}</Badge>
            ))}
          </div>
        )}
      </div>
      
      {/* Visualization Image */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Data Visualization</h2>
        <div className="flex justify-center mb-4">
          <img 
            src={visualization.imageBase64} 
            alt={visualization.title || "Visualization"} 
            className="max-h-[500px] object-contain rounded-md"
          />
        </div>
      </div>
      
      {/* AI Analysis */}
      {summary && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            <i className="fas fa-robot text-primary mr-2"></i>
            AI Analysis
          </h2>
          <div className="prose max-w-none">
            <p className="text-gray-800 mb-4">{summary.summary}</p>
            
            {summary.points && summary.points.length > 0 && (
              <>
                <h3 className="text-lg font-medium mb-2">Key Insights</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {summary.points.map((point, i) => (
                    <li key={i} className="text-gray-700">{point}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Conversation History */}
      {messages && messages.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            <i className="fas fa-comments text-primary mr-2"></i>
            Discussion and Analysis
          </h2>
          
          <div className="space-y-6 mt-4">
            {messages.map((message, i) => (
              <div 
                key={i} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="font-medium mb-1">
                    {message.role === 'user' ? 'Question' : 'Viz Assistant'}
                  </div>
                  <div className="whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Footer with branding */}
      <div className="mt-10 text-center text-gray-500 text-sm">
        <p>Generated with VizChat</p>
        <p className="mt-1">An AI-powered visualization analysis tool</p>
      </div>
    </div>
  );
}