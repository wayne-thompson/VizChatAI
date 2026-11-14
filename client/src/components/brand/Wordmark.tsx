import wordmarkUrl from "@brand/VizChat Green and Navy Wordmark.png";
import railMarkUrl from "@brand/Forest Green V Mark.png";
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

export function RailMark({ className }: { className?: string }) {
  return (
    <img
      src={railMarkUrl}
      alt=""
      draggable={false}
      className={cn("h-10 w-10 object-contain", className)}
    />
  );
}
