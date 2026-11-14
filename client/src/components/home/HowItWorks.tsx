import { LineChart, MessageSquare, Upload } from "lucide-react";

const STEPS = [
  {
    title: "Upload",
    copy: "Bring your charts and dashboards into VizChat.",
    icon: Upload,
  },
  {
    title: "Understand",
    copy: "Get AI-powered explanations of trends, changes, and patterns.",
    icon: LineChart,
  },
  {
    title: "Discuss",
    copy: "Ask questions and explore what the numbers mean.",
    icon: MessageSquare,
  },
];

export function HowItWorks() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {STEPS.map((step) => {
        const Icon = step.icon;
        return (
          <article
            key={step.title}
            className="rounded-xl border border-sky bg-white p-6 shadow-card transition-shadow duration-200 hover:shadow-lift"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-sky bg-cream text-forest">
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="mt-5 text-heading font-semibold text-navy">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-storm">{step.copy}</p>
          </article>
        );
      })}
    </div>
  );
}
