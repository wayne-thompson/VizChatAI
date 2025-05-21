import { useEffect, useRef } from "react";
import { Message } from "@shared/schema";
import { cn } from "@/lib/utils";

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
    <div id="chat-messages" className="flex-1 p-4 overflow-y-auto custom-scrollbar chat-container bg-gray-50">
      {messages.map((message, index) => (
        <div key={index} className={cn(
          "flex items-start mb-4",
          message.role === "user" && "justify-end"
        )}>
          {message.role === "assistant" && (
            <div className="flex-shrink-0 mr-3">
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                <i className="fas fa-robot text-primary text-sm"></i>
              </div>
            </div>
          )}
          
          <div className={cn(
            "chat-message p-3 rounded-lg shadow-sm",
            message.role === "assistant" 
              ? "viz-message bg-gray-100 text-gray-700 rounded-lg rounded-tl-sm" 
              : "user-message bg-primary text-white rounded-lg rounded-br-sm"
          )}>
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
          
          {message.role === "user" && (
            <div className="flex-shrink-0 ml-3">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <i className="fas fa-user text-gray-500 text-sm"></i>
              </div>
            </div>
          )}
        </div>
      ))}
      
      {isTyping && (
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0 mr-3">
            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
              <i className="fas fa-robot text-primary text-sm"></i>
            </div>
          </div>
          <div className="chat-message viz-message p-3 rounded-lg shadow-sm bg-gray-100">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}
