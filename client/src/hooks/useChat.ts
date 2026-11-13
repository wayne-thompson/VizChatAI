import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sendMessage, getMessages } from '@/lib/openai';
import { Message } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

export function useChat(visualizationId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const activeVisualizationId = useRef(visualizationId);
  activeVisualizationId.current = visualizationId;

  useEffect(() => {
    setMessages([]);
    setIsTyping(false);
  }, [visualizationId]);

  // Fetch messages if visualization ID is valid
  const { data: fetchedMessages, isLoading } = useQuery<Message[]>({
    queryKey: [`/api/visualizations/${visualizationId}/messages`],
    enabled: visualizationId > 0,
  });

  // Update local messages state when fetched messages change
  useEffect(() => {
    if (fetchedMessages) {
      setMessages(fetchedMessages);
    }
  }, [fetchedMessages]);

  // Message sending mutation
  const messageMutation = useMutation({
    mutationFn: async (content: string) => {
      const targetId = visualizationId;
      setIsTyping(true);
      
      // Create a temporary user message to show immediately
      const tempUserMsg: Message = {
        id: Date.now(),
        visualizationId,
        role: "user",
        content,
        createdAt: new Date()
      };
      
      // Add user message to UI immediately
      setMessages(prev => [...prev, tempUserMsg]);
      
      try {
        // Create a direct fetch request to ensure we have more control
        const response = await fetch(`/api/visualizations/${visualizationId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
          credentials: 'include',
        });
        
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.message || `Unable to send message (${response.status})`);
        }
        
        const data = await response.json();
        
        // Update messages with actual response
        if (activeVisualizationId.current === targetId) {
          setMessages(prev => [
            ...prev.filter(m => m.id !== tempUserMsg.id),
            data.userMessage,
            data.assistantMessage
          ]);
        }
        
        return data;
      } catch (error) {
        // The server may already have saved the user message. Refresh that
        // history, but never fabricate an assistant reply for a failed call.
        if (activeVisualizationId.current === targetId) {
          setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
        }
        queryClient.invalidateQueries({ queryKey: [`/api/visualizations/${targetId}/messages`] });
        throw error;
      } finally {
        if (activeVisualizationId.current === targetId) setIsTyping(false);
      }
    },
    onSuccess: (data) => {
      // Invalidate the messages query to fetch fresh data
      queryClient.invalidateQueries({ queryKey: [`/api/visualizations/${data.userMessage.visualizationId}/messages`] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "Something went wrong",
      });
    }
  });

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !visualizationId) return;
    await messageMutation.mutateAsync(content);
  };

  return {
    messages,
    isLoading,
    isTyping,
    sendMessage: handleSendMessage
  };
}
