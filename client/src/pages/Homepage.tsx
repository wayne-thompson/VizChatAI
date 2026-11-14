import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useOpenAuth } from "@/components/auth/AuthPrompt";
import { PageContainer } from "@/components/design/PageContainer";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ProductPreview } from "@/components/home/ProductPreview";
import { SampleAnalyses } from "@/components/home/SampleAnalyses";

export default function Homepage() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const openAuth = useOpenAuth();

  const uploadChart = () => {
    if (isAuthenticated) {
      navigate("/analyze");
      return;
    }
    openAuth("register", "/analyze");
  };

  const trySample = () => {
    document.getElementById("samples")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="bg-cloud text-navy">
      <section className="pb-6 pt-16 sm:pb-8 sm:pt-24 lg:pb-10 lg:pt-28">
        <PageContainer className="rise text-center">
          <h1 className="mx-auto max-w-3xl text-balance text-[2.5rem] font-semibold leading-[1.1] tracking-[-0.03em] text-navy sm:text-5xl lg:text-display">
            See <span className="text-forest">beyond</span> the chart.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-body text-storm">
            Turn charts into clear insights and meaningful conversations with AI.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button variant="brand" size="lg" className="h-12 px-6 text-button" onClick={uploadChart}>
              Upload a Chart
            </Button>
            <Button variant="brandOutline" size="lg" className="h-12 px-6 text-button" onClick={trySample}>
              Try a Sample
            </Button>
          </div>
        </PageContainer>
      </section>

      <section className="pb-10 sm:pb-12" aria-label="Product preview">
        <PageContainer>
          <ProductPreview />
        </PageContainer>
      </section>

      <section className="bg-cream py-16 sm:py-20">
        <PageContainer>
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="text-title font-semibold text-navy">How VizChat works</h2>
            <p className="mt-3 text-body text-storm">
              Upload your charts, uncover meaningful insights, and explore your data through conversation.
            </p>
          </div>
          <HowItWorks />
        </PageContainer>
      </section>

      <section id="samples" className="scroll-mt-20 py-16 sm:py-20">
        <PageContainer>
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="text-title font-semibold text-navy">Sample analyses</h2>
            <p className="mt-3 text-body text-storm">
              Three kinds of charts VizChat is built to read.
            </p>
          </div>
          <SampleAnalyses />
        </PageContainer>
      </section>

      <section className="bg-cream py-14 sm:py-16">
        <PageContainer className="text-center">
          <h2 className="text-title font-semibold text-navy">Your charts have more to say.</h2>
          <p className="mx-auto mt-3 max-w-xl text-body text-storm">
            Upload a chart and start exploring the story behind your data.
          </p>
          <Button variant="brand" size="lg" className="mt-6 h-12 px-6 text-button" onClick={uploadChart}>
            Start Analyzing
          </Button>
        </PageContainer>
      </section>

      <footer className="border-t border-sky bg-white">
        <PageContainer className="flex flex-col gap-2 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-navy">VizChat</p>
          <p className="text-caption text-storm">Charts, explanations, and a conversation about what changed.</p>
        </PageContainer>
      </footer>
    </div>
  );
}
