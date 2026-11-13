import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { User as UserIcon, Mail, LogOut, Bot } from "lucide-react";
import type { User } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export default function Account() {
  const { user, isAuthenticated } = useAuth();
  const typedUser = user as User | undefined;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState<string>(typedUser?.llmProvider || "openai");

  useEffect(() => {
    setSelectedProvider(typedUser?.llmProvider || "openai");
  }, [typedUser?.llmProvider]);

  const updateLlmMutation = useMutation({
    mutationFn: async (provider: string) => {
      return await apiRequest('/api/user/llm-provider', {
        method: 'PATCH',
        data: { llmProvider: provider }
      });
    },
    onSuccess: () => {
      toast({
        title: "LLM Provider updated",
        description: "Your AI model preference has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error) => {
      setSelectedProvider(typedUser?.llmProvider || "openai");
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update LLM provider",
      });
    }
  });

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    updateLlmMutation.mutate(provider);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          {typedUser?.profileImageUrl ? (
            <img 
              src={typedUser.profileImageUrl} 
              alt="Profile" 
              className="w-20 h-20 rounded-full object-cover mr-4"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mr-4">
              <UserIcon className="h-10 w-10 text-gray-500" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {typedUser?.firstName} {typedUser?.lastName}
            </h2>
            <p className="text-gray-600 flex items-center mt-1">
              <Mail className="h-4 w-4 mr-2" />
              {typedUser?.email}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 mb-6">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Bot className="h-5 w-5 mr-2" />
            AI Model Preference
          </h3>
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select AI Provider
            </label>
            <Select 
              value={selectedProvider} 
              onValueChange={handleProviderChange}
              disabled={updateLlmMutation.isPending}
            >
              <SelectTrigger data-testid="select-llm-provider">
                <SelectValue placeholder="Select AI provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI (GPT-4o)</SelectItem>
                <SelectItem value="google">Google (Gemini)</SelectItem>
                <SelectItem value="xai">xAI (Grok)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-2">
              Choose which AI model to use for analyzing your visualizations
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium mb-4">Account Actions</h3>
          <Button 
            variant="destructive"
            onClick={() => window.location.href = '/api/logout'}
            className="flex items-center"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
