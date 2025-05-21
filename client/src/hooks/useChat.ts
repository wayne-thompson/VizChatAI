import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sendMessage, getMessages } from '@/lib/openai';
import { Message } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

export function useChat(visualizationId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  // Fetch messages if visualization ID is valid
  const { data: fetchedMessages, isLoading } = useQuery({
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
          throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update messages with actual response
        setMessages(prev => [
          ...prev.filter(m => m.id !== tempUserMsg.id),
          data.userMessage,
          data.assistantMessage
        ]);
        
        return data;
      } catch (error) {
        console.error("Error sending message:", error);
        
        // Add a fallback assistant message when there's an error
        const fallbackAssistantMsg: Message = {
          id: Date.now() + 1,
          visualizationId,
          role: "assistant",
          content: "I apologize, but I'm having trouble processing your request right now. Please try again.",
          createdAt: new Date()
        };
        
        // Update messages with user message and fallback response
        setMessages(prev => [
          ...prev.filter(m => m.id !== tempUserMsg.id),
          tempUserMsg,
          fallbackAssistantMsg
        ]);
        
        return {
          userMessage: tempUserMsg,
          assistantMessage: fallbackAssistantMsg
        };
      } finally {
        setIsTyping(false);
      }
    },
    onSuccess: () => {
      // Invalidate the messages query to fetch fresh data
      queryClient.invalidateQueries({ queryKey: [`/api/visualizations/${visualizationId}/messages`] });
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
