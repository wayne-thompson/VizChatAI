import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateVisualization } from '@/lib/openai';
import { useToast } from '@/hooks/use-toast';

export function useSharing(visualizationId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const tagsMutation = useMutation({
    mutationFn: async (tags: string[]) => {
      if (!visualizationId) {
        throw new Error("No visualization selected");
      }
      return await updateVisualization(visualizationId, { tags });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/visualizations/${visualizationId}`] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update tags",
        description: error instanceof Error ? error.message : "Something went wrong",
      });
    }
  });

  const updateVisualizationTags = async (tags: string[]): Promise<void> => {
    await tagsMutation.mutateAsync(tags);
  };

  return {
    updateVisualizationTags,
    isUpdating: tagsMutation.isPending
  };
}
