import { useEffect, useRef } from "react";
import { Message } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface ChatMessagesProps {
  messages: Message[];
  isTyping: boolean;
}

export default function ChatMessages({ messages, isTyping }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Scroll to bottom of messages whenever messages change or typing state changes
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div id="chat-messages" className="flex-1 p-6 overflow-y-auto custom-scrollbar chat-container bg-gradient-to-b from-slate-50 to-white">
      {messages.map((message, index) => (
        <div key={index} className={cn(
          "flex items-start mb-5 animate-in fade-in slide-in-from-bottom-4 duration-300",
          message.role === "user" && "justify-end"
        )}>
          {message.role === "assistant" && (
            <div className="flex-shrink-0 mr-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
            </div>
          )}
          
          <div className={cn(
            "chat-message p-4 rounded-2xl shadow-sm max-w-[85%]",
            message.role === "assistant" 
              ? "viz-message bg-white border border-slate-200 text-slate-700 rounded-tl-md" 
              : "user-message bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-md shadow-lg shadow-blue-500/30"
          )}>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
          </div>
          
          {message.role === "user" && (
            <div className="flex-shrink-0 ml-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg">
                <i className="fas fa-user text-white text-sm"></i>
              </div>
            </div>
          )}
        </div>
      ))}
      
      {isTyping && (
        <div className="flex items-start mb-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex-shrink-0 mr-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="chat-message viz-message p-4 rounded-2xl shadow-sm bg-white border border-slate-200">
            <div className="flex space-x-1.5">
              <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce"></div>
              <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}
