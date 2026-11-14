import type { ReactNode } from "react";

const SAMPLES = [
  {
    title: "SaaS Revenue Performance",
    copy: "Monthly recurring revenue, retention, and the months that moved the total.",
    preview: <RevenueBars />,
  },
  {
    title: "Product Engagement",
    copy: "Weekly active use across the core product surfaces.",
    preview: <EngagementBars />,
  },
  {
    title: "Sales Pipeline",
    copy: "Open opportunities by stage, from first meeting to close.",
    preview: <PipelineBars />,
  },
];

function Frame({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-sky bg-cream/60 p-3">{children}</div>;
}

function RevenueBars() {
  const heights = [42, 48, 45, 58, 66, 78];
  return (
    <Frame>
      <svg viewBox="0 0 160 72" className="h-16 w-full" aria-hidden>
        {heights.map((height, index) => (
          <rect
            key={index}
            x={8 + index * 25}
            y={68 - height * 0.7}
            width="14"
            height={height * 0.7}
            rx="2"
            fill={index === heights.length - 1 ? "#162A3C" : "#5E6C5B"}
          />
        ))}
      </svg>
    </Frame>
  );
}

function EngagementBars() {
  const rows = [78, 64, 52, 40];
  return (
    <Frame>
      <svg viewBox="0 0 160 72" className="h-16 w-full" aria-hidden>
        {rows.map((width, index) => (
          <rect key={index} x="4" y={6 + index * 16} width={width * 1.5} height="10" rx="2" fill={index === 0 ? "#496A80" : "#5E6C5B"} />
        ))}
      </svg>
    </Frame>
  );
}

function PipelineBars() {
  const stages = [92, 70, 48, 30];
  return (
    <Frame>
      <svg viewBox="0 0 160 72" className="h-16 w-full" aria-hidden>
        {stages.map((width, index) => (
          <rect key={index} x="4" y={6 + index * 16} width={width * 1.4} height="10" rx="2" fill="#496A80" opacity={1 - index * 0.18} />
        ))}
      </svg>
    </Frame>
  );
}

export function SampleAnalyses() {
  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        {SAMPLES.map((sample) => (
          <article key={sample.title} className="rounded-xl border border-sky bg-white p-5 shadow-card">
            {sample.preview}
            <h3 className="mt-4 text-heading font-semibold text-navy">{sample.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-storm">{sample.copy}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
