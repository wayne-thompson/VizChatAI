import { OpenAIMark } from "@/components/brand/OpenAIMark";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

function ModelSignalBars() {
  return (
    <div className="flex items-end gap-px pl-2" aria-hidden>
      {Array.from({ length: 8 }).map((_, index) => (
        <span key={index} className="h-3 w-0.5 rounded-sm bg-navy/80" />
      ))}
    </div>
  );
}

function ModelDetailsCard() {
  return (
    <div className="inline-flex max-w-full items-center gap-2 py-0.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center text-navy">
        <OpenAIMark className="h-5 w-5" />
      </span>
      <div className="min-w-0 leading-tight">
        <p className="text-caption font-medium text-navy">GPT-4o</p>
        <p className="text-[0.6875rem] text-storm">OpenAI</p>
      </div>
      <ModelSignalBars />
    </div>
  );
}

export default function ActiveModelChip() {
  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-sky bg-white text-navy hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
          aria-label="Model: GPT-4o by OpenAI"
        >
          <OpenAIMark className="h-[18px] w-[18px]" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent align="end" side="bottom" sideOffset={8} className="w-auto border-sky bg-white p-2 shadow-card">
        <ModelDetailsCard />
      </HoverCardContent>
    </HoverCard>
  );
}