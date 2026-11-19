import { useState } from "react";
import { OpenAIMark } from "@/components/brand/OpenAIMark";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ModelOption = {
  id: string;
  label: string;
  Mark: typeof OpenAIMark;
};

const MODELS: ModelOption[] = [
  { id: "openai", label: "ChatGPT", Mark: OpenAIMark },
];

export function ModelRail() {
  const [selectedId, setSelectedId] = useState(MODELS[0].id);

  return (
    <div className="flex flex-col items-center gap-3" role="radiogroup" aria-label="Model">
      {MODELS.map((model) => {
        const selected = model.id === selectedId;
        const Mark = model.Mark;

        return (
          <Tooltip key={model.id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={model.label}
                onClick={() => setSelectedId(model.id)}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40",
                  selected
                    ? "border border-[#E2E2E2] bg-white text-black shadow-[0_1px_2px_rgba(22,42,60,0.05),0_4px_10px_rgba(22,42,60,0.08)]"
                    : "border border-transparent text-navy/40 hover:border-[#E2E2E2] hover:bg-white hover:text-black",
                )}
              >
                <Mark className="h-7 w-7" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {model.label}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
