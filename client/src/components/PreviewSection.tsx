import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Visualization } from '@shared/schema';
import { AnalysisResult } from '@/lib/openai';

interface PreviewSectionProps {
  visualization: Visualization | null;
  summary: { summary: string; points: string[] } | null;
  onGenerateInsights: () => Promise<void>;
  isGenerating: boolean;
}

export default function PreviewSection({ 
  visualization, 
  summary, 
  onGenerateInsights, 
  isGenerating 
}: PreviewSectionProps) {
  const [summaryData, setSummaryData] = useState<{ summary: string; points: string[] } | null>(null);
  
  useEffect(() => {
    if (summary) {
      setSummaryData(summary);
    } else if (visualization?.initialSummary) {
      try {
        setSummaryData(JSON.parse(visualization.initialSummary));
      } catch (e) {
        setSummaryData(null);
      }
    } else {
      setSummaryData(null);
    }
  }, [summary, visualization]);

  if (!visualization) return null;
  
  return (
    <div id="preview-section" className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">Visualization Preview</h2>
        <Button
          id="generate-insights-btn"
          onClick={onGenerateInsights}
          disabled={isGenerating}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium"
        >
          {isGenerating ? (
            <>
              <i className="fas fa-spinner fa-spin mr-1.5"></i>
              Generating...
            </>
          ) : (
            <>
              <i className="fas fa-magic mr-1.5"></i>
              Generate Insights
            </>
          )}
        </Button>
      </div>
      
      <div className="preview-container overflow-y-auto bg-white rounded-lg border border-gray-200 p-4">
        {visualization.imageBase64 ? (
          <img 
            src={visualization.imageBase64} 
            alt="Uploaded visualization" 
            className="mx-auto max-h-[320px] w-auto object-contain rounded" 
          />
        ) : (
          <Skeleton className="h-64 w-full" />
        )}
      </div>
      
      <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-medium mb-2 text-gray-800">Initial Summary</h3>
        <div id="ai-summary" className="text-sm text-gray-600">
          {isGenerating ? (
            <div className="flex space-x-1 items-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              <span className="ml-2">Analyzing your visualization...</span>
            </div>
          ) : summaryData ? (
            <>
              <p>{summaryData.summary}</p>
              {summaryData.points && summaryData.points.length > 0 && (
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {summaryData.points.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p>Click "Generate Insights" to analyze this visualization with AI.</p>
          )}
        </div>
      </div>
    </div>
  );
}
