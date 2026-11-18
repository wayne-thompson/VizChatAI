import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Message } from "@shared/schema";
import { cn } from "@/lib/utils";
import AssistantMarkdown from "@/components/AssistantMarkdown";

interface ChatMessagesProps {
  messages: Message[];
  isTyping: boolean;
  phase?: "ready" | "working" | "saved";
  recommendedQuestions?: string[];
  onSelectQuestion?: (question: string) => void;
  isSending?: boolean;
}

export default function ChatMessages({
  messages,
  isTyping,
  phase = "ready",
  recommendedQuestions = [],
  onSelectQuestion,
  isSending = false,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const showRecommendations =
    messages.length === 0 &&
    !isTyping &&
    phase === "ready" &&
    recommendedQuestions.length === 3 &&
    Boolean(onSelectQuestion);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div id="chat-messages" className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-5 sm:px-6">
      <div className="mx-auto w-full max-w-[760px]">
        {messages.length === 0 && !isTyping && (
          <EmptyConversation
            phase={phase}
            showRecommendations={showRecommendations}
            recommendedQuestions={recommendedQuestions}
            onSelectQuestion={onSelectQuestion}
            isSending={isSending}
          />
        )}
        <div className="space-y-3">
          {messages.map((message, index) => (
            <div key={message.id ?? index} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "w-fit max-w-[min(100%,85%)] rounded-lg px-3 py-2",
                message.role === "user" ? "bg-navy text-white" : "border border-sky bg-white text-navy",
              )}
            >
              {message.role === "assistant" ? (
                <AssistantMarkdown content={message.content} />
              ) : (
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
              )}
            </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start" aria-live="polite" aria-label="Data Vizard is writing">
              <div className="rounded-lg border border-sky bg-cloud px-3.5 py-2.5">
                <span className="text-caption text-storm">Writing...</span>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

type EmptyConversationProps = {
  phase: "ready" | "working" | "saved";
  showRecommendations: boolean;
  recommendedQuestions: string[];
  onSelectQuestion?: (question: string) => void;
  isSending: boolean;
};

function EmptyConversation({
  phase,
  showRecommendations,
  recommendedQuestions,
  onSelectQuestion,
  isSending,
}: EmptyConversationProps) {
  if (phase === "working") {
    return <p className="text-body text-storm">Analyzing your chart…</p>;
  }

  if (showRecommendations) {
    return (
      <div className="w-full">
        <p className="text-heading font-semibold text-navy">Explore this chart</p>
        <p className="mt-2 text-body text-storm">Here are a few questions to get you started.</p>
        <ul className="mt-4 flex flex-col gap-2" aria-label="Suggested questions">
          {recommendedQuestions.map((question) => (
            <li key={question}>
              <button
                type="button"
                disabled={isSending}
                onClick={() => onSelectQuestion?.(question)}
                className={cn(
                  "flex w-full items-start gap-2 rounded-lg border border-sky bg-white px-3 py-2.5 text-left text-sm leading-snug text-navy",
                  "transition-colors hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                <span className="min-w-0 flex-1 break-words">{question}</span>
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-forest" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (phase === "saved") {
    return (
      <div className="w-full">
        <p className="text-heading font-semibold text-navy">Your chart is saved.</p>
        <p className="mt-2 text-body text-storm">Ask Data Vizard about what you see in the image.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <p className="text-heading font-semibold text-navy">Your chart is ready to explore.</p>
      <p className="mt-2 text-body text-storm">Ask Data Vizard about trends, comparisons, or anything that stands out.</p>
    </div>
  );
}