import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import PreviewSection from "@/components/PreviewSection";
import ShareSection from "@/components/ShareSection";
import ChatHeader from "@/components/ChatHeader";
import ChatMessages from "@/components/ChatMessages";
import ChatInput from "@/components/ChatInput";
import { getSharedVisualization, sendMessage } from "@/lib/openai";
import { Message, Visualization } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { updateVisualization } from "@/lib/openai";

export default function Shared() {
  const [, params] = useRoute<{ shareId: string }>("/share/:shareId");
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/share/${params?.shareId}`],
    enabled: !!params?.shareId,
  });
  
  useEffect(() => {
    if (data) {
      setMessages(data.messages || []);
    }
  }, [data]);
  
  const handleSendMessage = async (content: string) => {
    if (!data?.visualization?.id) return;
    
    try {
      // Add user message to UI immediately
      const tempUserMsg: Message = {
        id: Date.now(),
        visualizationId: data.visualization.id,
        role: "user",
        content,
        createdAt: new Date()
      };
      
      setMessages(prev => [...prev, tempUserMsg]);
      setIsTyping(true);
      
      // Send to API
      const response = await sendMessage(data.visualization.id, content);
      
      // Update messages with actual response
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempUserMsg.id),
        response.userMessage,
        response.assistantMessage
      ]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "Something went wrong",
      });
    } finally {
      setIsTyping(false);
    }
  };
  
  const handleUpdateTags = async (tags: string[]) => {
    if (!data?.visualization?.id) return;
    
    await updateVisualization(data.visualization.id, { tags });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <div className="mb-4">
            <i className="fas fa-spinner fa-spin text-4xl text-primary"></i>
          </div>
          <h2 className="text-xl font-medium">Loading shared visualization...</h2>
        </div>
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <div className="mb-4 text-red-500">
            <i className="fas fa-exclamation-triangle text-4xl"></i>
          </div>
          <h2 className="text-xl font-medium">Error loading visualization</h2>
          <p className="mt-2 text-gray-600">
            The shared link might be invalid or has expired.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Left Panel: Preview */}
      <div className="w-full md:w-1/2 p-4 md:p-6 md:border-r border-gray-200 md:overflow-y-auto mobile-full">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{data.visualization.title || "Shared Visualization"}</h2>
          {data.visualization.description && (
            <p className="text-gray-600 mb-4">{data.visualization.description}</p>
          )}
        </div>
        
        <PreviewSection 
          visualization={data.visualization} 
          summary={data.visualization.initialSummary ? JSON.parse(data.visualization.initialSummary) : null}
          onGenerateInsights={async () => {}}
          isGenerating={false}
        />
        
        <ShareSection 
          visualization={data.visualization}
          onUpdateTags={handleUpdateTags}
        />
      </div>

      {/* Right Panel: Chat Interface */}
      <div className="w-full md:w-1/2 flex flex-col h-screen md:h-auto mobile-full">
        <ChatHeader />
        
        <ChatMessages messages={messages} isTyping={isTyping} />
        
        <ChatInput 
          onSendMessage={handleSendMessage} 
          isSending={isTyping} 
        />
      </div>
    </div>
  );
}
