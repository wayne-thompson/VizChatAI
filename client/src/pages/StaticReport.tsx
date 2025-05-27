import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Visualization, Message } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function StaticReport() {
  const [, params] = useRoute<{ shareId: string }>("/report/:shareId");
  const [summary, setSummary] = useState<{ summary: string; points: string[] } | null>(null);
  const { toast } = useToast();
  
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
    
    // Set page title for better SEO and user experience
    if (data?.visualization?.title) {
      document.title = `${data.visualization.title} - VizChat Report`;
    } else {
      document.title = "Data Visualization Report - VizChat";
    }
  }, [data]);

  const handleDownloadPDF = () => {
    toast({
      title: "Downloading PDF",
      description: "Opening print dialog to save as PDF",
    });
    
    // Trigger the browser's print dialog which allows saving as PDF
    window.print();
  };
  
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
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Report Header - Card style */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2 text-gray-900">{visualization.title || "Untitled Visualization"}</h1>
              <div className="flex items-center text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Generated {formatDistanceToNow(new Date(visualization.createdAt), { addSuffix: true })}</span>
              </div>
            </div>
            <Button 
              onClick={handleDownloadPDF}
              className="bg-primary text-white hover:bg-primary/90 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
          {visualization.description && (
            <p className="text-gray-700 mb-4 max-w-3xl">{visualization.description}</p>
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
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Data Visualization
          </h2>
          <div className="flex justify-center p-2 bg-gray-50 rounded-md mb-4">
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
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI Analysis
            </h2>
            <div className="prose max-w-none">
              <p className="text-gray-800 mb-6 text-lg">{summary.summary}</p>
              
              {summary.points && summary.points.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Key Insights
                  </h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {summary.points.map((point, i) => (
                      <li key={i} className="text-gray-700">{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Conversation History */}
        {messages && messages.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
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
                        ? 'bg-primary text-white shadow-md' 
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}
                  >
                    <div className="font-medium mb-2 flex items-center">
                      {message.role === 'user' ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Question
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Viz Assistant
                        </>
                      )}
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
        <div className="mt-10 text-center text-gray-500">
          <div className="flex items-center justify-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="font-medium text-base">VizChat</span>
          </div>
          <p>An AI-powered visualization analysis tool</p>
          <p className="mt-2 text-xs">{new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}