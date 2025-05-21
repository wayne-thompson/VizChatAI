import { useState } from 'react';
import { uploadVisualization, analyzeVisualization, AnalysisResult } from '@/lib/openai';
import { Visualization } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

export function useImageUpload() {
  const { toast } = useToast();
  const [visualization, setVisualization] = useState<Visualization | null>(null);
  const [summary, setSummary] = useState<{ summary: string; points: string[] } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  const uploadImage = async (file: File): Promise<Visualization> => {
    try {
      setIsUploading(true);
      
      // Upload the image
      const uploadedViz = await uploadVisualization(file);
      setVisualization(uploadedViz);
      
      toast({
        title: "Upload successful",
        description: "Your visualization has been uploaded. Generate insights to analyze it.",
      });
      
      return uploadedViz;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const generateInsights = async (): Promise<void> => {
    if (!visualization?.id) return;
    
    try {
      setIsGeneratingInsights(true);
      
      const result = await analyzeVisualization(visualization.id);
      setVisualization(result.visualization);
      setSummary(result.summary);
      
      toast({
        title: "Analysis complete",
        description: "AI has generated insights for your visualization.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Failed to analyze visualization",
      });
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  return {
    visualization,
    summary,
    isUploading,
    isGeneratingInsights,
    uploadImage,
    generateInsights
  };
}
