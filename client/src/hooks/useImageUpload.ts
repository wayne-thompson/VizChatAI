import { useState } from 'react';
import { uploadVisualization, uploadMultipleVisualizations, analyzeVisualization, analyzeProject, AnalysisResult, ProjectAnalysisResult } from '@/lib/openai';
import { Visualization } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

export function useImageUpload() {
  const { toast } = useToast();
  const [visualization, setVisualization] = useState<Visualization | null>(null);
  const [visualizations, setVisualizations] = useState<Visualization[]>([]);
  const [summary, setSummary] = useState<{ summary: string; points: string[] } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [projectGroup, setProjectGroup] = useState<string | null>(null);

  const uploadMultipleImages = async (files: File[]): Promise<Visualization[]> => {
    try {
      setIsUploading(true);
      
      // Upload all files as a project
      const uploadedVizs = await uploadMultipleVisualizations(files);
      setVisualizations(uploadedVizs);
      
      // Set the first visualization as the primary one for chat
      if (uploadedVizs.length > 0) {
        setVisualization(uploadedVizs[0]);
        setProjectGroup(uploadedVizs[0].projectGroup || null);
      }
      
      toast({
        title: "Upload successful",
        description: `${files.length} visualizations uploaded. Generate insights to analyze them together.`,
      });
      
      return uploadedVizs;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload images",
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

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
    try {
      setIsGeneratingInsights(true);
      
      // If multiple visualizations exist, analyze as a project
      if (visualizations.length > 1 && projectGroup) {
        const result = await analyzeProject(projectGroup);
        setVisualizations(result.visualizations);
        setSummary(result.summary);
        
        toast({
          title: "Project analysis complete",
          description: `AI has analyzed all ${visualizations.length} visualizations together for comprehensive insights.`,
        });
      } else if (visualization?.id) {
        // Single visualization analysis
        const result = await analyzeVisualization(visualization.id);
        setVisualization(result.visualization);
        setSummary(result.summary);
        
        toast({
          title: "Analysis complete",
          description: "AI has generated insights for your visualization.",
        });
      }
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
    visualizations,
    summary,
    isUploading,
    isGeneratingInsights,
    uploadImage,
    uploadMultipleImages,
    generateInsights,
    projectGroup
  };
}
