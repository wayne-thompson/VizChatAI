import { useState, type FormEvent } from "react";
import { ArrowRight, ArrowUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isSending: boolean;
  disabled?: boolean;
  suggestedFollowUp?: string | null;
}

export default function ChatInput({
  onSendMessage,
  isSending,
  disabled = false,
  suggestedFollowUp = null,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const cannotSend = !message.trim() || isSending || disabled;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (cannotSend) return;

    const content = message;
    try {
      await onSendMessage(content);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const showFollowUp = Boolean(suggestedFollowUp) && !isSending && !disabled;

  return (
    <div className="shrink-0 border-t border-sky bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
      <div className="mx-auto w-full max-w-[760px]">
        {showFollowUp && suggestedFollowUp && (
          <PageFollowUp suggestion={suggestedFollowUp} isSending={isSending} onSend={onSendMessage} />
        )}
        <form className={cn("flex items-center gap-2", showFollowUp && "mt-2")} onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="Ask about your chart..."
          aria-label="Message Data Vizard"
          className="h-11 flex-1 border-sky bg-white text-navy placeholder:text-storm focus-visible:ring-navy/30 focus-visible:ring-offset-0"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          disabled={isSending || disabled}
        />
        <Button
          type="submit"
          variant="brand"
          size="icon"
          className="h-11 w-11"
          aria-label={isSending ? "Sending message" : "Send message"}
          disabled={cannotSend}
        >
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
        </Button>
        </form>
      </div>
    </div>
  );
}

function PageFollowUp({
  suggestion,
  isSending,
  onSend,
}: {
  suggestion: string;
  isSending: boolean;
  onSend: (message: string) => Promise<void>;
}) {
  return (
    <div className="max-w-full">
      <p className="text-caption font-medium text-storm">Continue exploring</p>
      <button
        type="button"
        disabled={isSending}
        onClick={() => void onSend(suggestion)}
        className={cn(
          "mt-2 flex w-full items-start gap-2 rounded-lg border border-sky bg-white px-3 py-2.5 text-left text-sm leading-snug text-navy",
          "transition-colors hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        <span className="min-w-0 flex-1 break-words">{suggestion}</span>
        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-forest" aria-hidden />
      </button>
    </div>
  );
}