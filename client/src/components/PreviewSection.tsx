import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Visualization } from '@shared/schema';
import { AnalysisResult } from '@/lib/openai';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface PreviewSectionProps {
  visualization: Visualization | null;
  visualizations?: Visualization[];
  summary: { summary: string; points: string[] } | null;
  onGenerateInsights: () => Promise<void>;
  isGenerating: boolean;
}

export default function PreviewSection({ 
  visualization, 
  visualizations = [],
  summary, 
  onGenerateInsights, 
  isGenerating 
}: PreviewSectionProps) {
  const { toast } = useToast();
  const [summaryData, setSummaryData] = useState<{ summary: string; points: string[] } | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  
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
    
    // Set title from visualization when it changes
    if (visualization) {
      setTitle(visualization.title || 'Untitled Visualization');
    }
  }, [summary, visualization]);
  
  // Handle editing title
  const startEditingTitle = () => {
    setIsEditingTitle(true);
    // Focus the input after render
    setTimeout(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
        titleInputRef.current.select();
      }
    }, 100);
  };
  
  // Handle saving the title
  const saveTitle = async () => {
    if (!visualization) return;
    
    // Don't save empty titles
    if (!title.trim()) {
      setTitle(visualization.title || 'Untitled Visualization');
      setIsEditingTitle(false);
      return;
    }
    
    // Skip if title hasn't changed
    if (title === visualization.title) {
      setIsEditingTitle(false);
      return;
    }
    
    try {
      setIsSavingTitle(true);
      
      // Call API to update title
      await apiRequest(`/api/visualizations/${visualization.id}`, {
        method: 'PATCH',
        data: { title }
      });
      
      toast({
        title: 'Title updated',
        description: 'Visualization title has been updated',
        variant: 'default'
      });
      
      setIsEditingTitle(false);
    } catch (error) {
      toast({
        title: 'Error updating title',
        description: 'Could not update the visualization title',
        variant: 'destructive'
      });
      // Reset to original title on error
      setTitle(visualization.title || 'Untitled Visualization');
    } finally {
      setIsSavingTitle(false);
    }
  };
  
  // Handle key press events in title input
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveTitle();
    } else if (e.key === 'Escape') {
      // Reset to original title and exit edit mode
      setTitle(visualization?.title || 'Untitled Visualization');
      setIsEditingTitle(false);
    }
  };

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
      
      {/* Editable Title */}
      <div className="mb-4 flex items-center">
        {isEditingTitle ? (
          <div className="flex-1 flex space-x-2 items-center">
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              onBlur={saveTitle}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Enter visualization title"
              disabled={isSavingTitle}
            />
            {isSavingTitle && (
              <i className="fas fa-spinner fa-spin text-gray-400"></i>
            )}
          </div>
        ) : (
          <div 
            onClick={startEditingTitle}
            className="flex items-center space-x-2 cursor-pointer group px-1 py-0.5 rounded-md hover:bg-gray-100"
          >
            <h3 className="text-lg font-medium text-gray-800">{title || "Untitled Visualization"}</h3>
            <i className="fas fa-pencil-alt text-gray-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity"></i>
          </div>
        )}
      </div>
      
      <div className="preview-container overflow-y-auto bg-white rounded-lg border border-gray-200 p-4">
        {visualizations.length > 1 ? (
          <div className="space-y-6">
            {visualizations.map((viz, index) => (
              <div key={viz.id} className="space-y-2">
                <h4 className="text-sm font-medium text-gray-600">Chart {index + 1}</h4>
                <img 
                  src={viz.imageBase64} 
                  alt={`Visualization ${index + 1}`} 
                  className="mx-auto max-h-[320px] w-auto object-contain rounded" 
                />
              </div>
            ))}
          </div>
        ) : visualization?.imageBase64 ? (
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
        <h3 className="font-medium mb-2 text-gray-800">Summary</h3>
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
                    <li key={index}>
                      {typeof point === 'string' ? point : 
                       typeof point === 'object' && point && 'content' in point ? (point as any).content :
                       JSON.stringify(point)}
                    </li>
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
