import wordmarkUrl from "@brand/VizChat Green and Navy Wordmark.png";
import { cn } from "@/lib/utils";

type WordmarkProps = {
  className?: string;
};

export function Wordmark({ className }: WordmarkProps) {
  return (
    <img
      src={wordmarkUrl}
      alt="VizChat"
      className={cn("h-9 w-auto", className)}
    />
  );
}
