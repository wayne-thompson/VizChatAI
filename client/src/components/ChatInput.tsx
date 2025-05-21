import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isSending: boolean;
}

export default function ChatInput({ onSendMessage, isSending }: ChatInputProps) {
  const [message, setMessage] = useState("");
  
  const suggestions = [
    "Compare regions",
    "Identify trends",
    "Best performing quarter"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;
    
    try {
      await onSendMessage(message);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
  };

  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      <form className="relative" onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="Ask a question about your chart..."
          className="block w-full rounded-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary pr-16 py-3 text-sm"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isSending}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <Button 
            type="submit" 
            size="icon"
            variant="ghost"
            className="inline-flex items-center justify-center h-8 w-8 transition-colors"
            disabled={!message.trim() || isSending}
          >
            {isSending ? (
              <i className="fas fa-spinner fa-spin text-primary text-sm"></i>
            ) : (
              <i className="fas fa-paper-plane text-primary text-sm"></i>
            )}
          </Button>
        </div>
      </form>
      <div className="flex justify-between mt-2 px-2">
        <div className="text-xs text-gray-500">
          <span className="mr-1">Suggested:</span>
          {suggestions.map((suggestion, index) => (
            <Button 
              key={index}
              variant="link" 
              className="text-primary hover:text-primary/80 mr-3 text-xs p-0 h-auto"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-xs text-gray-500 hover:text-gray-700 p-0 h-auto"
        >
          <i className="fas fa-microphone mr-1"></i>
          Voice
        </Button>
      </div>
    </div>
  );
}
