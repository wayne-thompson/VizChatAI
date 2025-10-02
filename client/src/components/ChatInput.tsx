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
    <div className="border-t border-slate-200 p-5 bg-white">
      <form className="relative" onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="Ask me anything about your data..."
          className="block w-full rounded-2xl border-slate-200 bg-slate-50 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-16 py-3.5 text-sm placeholder:text-slate-400"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isSending}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <Button 
            type="submit" 
            size="icon"
            variant="ghost"
            className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
            disabled={!message.trim() || isSending}
          >
            {isSending ? (
              <i className="fas fa-spinner fa-spin text-white text-sm"></i>
            ) : (
              <i className="fas fa-paper-plane text-white text-sm"></i>
            )}
          </Button>
        </div>
      </form>
      <div className="flex items-center gap-2 mt-3 px-1">
        <span className="text-xs text-slate-400 font-medium">Quick:</span>
        {suggestions.map((suggestion, index) => (
          <button 
            key={index}
            className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs font-medium"
            onClick={() => handleSuggestionClick(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
