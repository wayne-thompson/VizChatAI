import { useState, useEffect } from "react";
import UploadSection from "@/components/UploadSection";
import PreviewSection from "@/components/PreviewSection";
import ChatMessages from "@/components/ChatMessages";
import ChatInput from "@/components/ChatInput";
import ShareModal from "@/components/ShareModal";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { WorkspaceTitle, WorkspaceToolbar } from "@/components/workspace/WorkspaceToolbar";
import { takeStagedUpload } from "@/lib/pendingUpload";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useChat } from "@/hooks/useChat";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { readRecommendedQuestions } from "@/components/workspace/readAnalysis";

export default function Home() {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const {
    visualization,
    visualizations,
    summary,
    isUploading,
    isGeneratingInsights,
    uploadImage,
    uploadMultipleImages,
    resetSession,
    analysisError,
    generateInsights,
  } = useImageUpload();

  const { messages, isTyping, sendMessage, isSending, suggestedFollowUp } = useChat(visualization?.id || 0);

  useEffect(() => {
    const resetFlag = sessionStorage.getItem("resetSession");
    const storedFile = sessionStorage.getItem("selectedFile");

    if (resetFlag === "true") {
      resetSession();
      sessionStorage.removeItem("resetSession");
    }

    const staged = takeStagedUpload();
    if (staged?.length) {
      void (staged.length === 1 ? uploadImage(staged[0]) : uploadMultipleImages(staged));
      return;
    }

    const checkForSelectedFile = async () => {
      if (!storedFile) return;
      sessionStorage.removeItem("selectedFile");
      try {
        const fileData = JSON.parse(storedFile);
        const response = await fetch(fileData.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], fileData.name, { type: fileData.type });
        await uploadImage(file);
      } catch (error) {
        console.error("Error processing selected file:", error);
      }
    };

    checkForSelectedFile();
  }, [uploadImage, resetSession]);

  const upload = (
    <UploadSection
      onUpload={async (files: File[]) => {
        if (files.length === 1) return [await uploadImage(files[0])];
        return await uploadMultipleImages(files);
      }}
      isUploading={isUploading || isGeneratingInsights}
    />
  );

  const insights = visualization ? (
    <>
      <PreviewSection
        part="insights"
        insightsDensity="panel"
        visualization={visualization}
        visualizations={visualizations}
        summary={summary}
        isGenerating={isGeneratingInsights}
        onGenerateInsights={generateInsights}
        showToolbar={false}
      />
      {analysisError && (
        <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-semibold">Analysis could not be completed</p>
          <p className="mt-1">{analysisError}</p>
          <p className="mt-1">Your uploaded chart is still saved.</p>
          <div className="mt-3 flex items-center gap-4">
            <Button variant="brandOutline" disabled={isGeneratingInsights} onClick={() => void generateInsights()}>
              Retry analysis
            </Button>
            <Link href="/account" className="text-navy underline">Account Settings</Link>
          </div>
        </div>
      )}
    </>
  ) : null;

  const chatPhase = isGeneratingInsights ? "working" : summary ? "ready" : "saved";
  const recommendedQuestions = readRecommendedQuestions(summary, visualization?.initialSummary);

  return (
    <>
      <WorkspaceShell
        chatReady={Boolean(visualization)}
        toolbar={
          visualization ? (
            <WorkspaceToolbar visualization={visualization} isGenerating={isGeneratingInsights} />
          ) : (
            <WorkspaceTitle>New analysis</WorkspaceTitle>
          )
        }
        chart={
          visualization ? (
            <PreviewSection
              part="chart"
              chartFit="panel"
              visualization={visualization}
              visualizations={visualizations}
              summary={summary}
              isGenerating={isGeneratingInsights}
              showToolbar={false}
            />
          ) : (
            upload
          )
        }
        insights={insights}
        chat={
          <>
            <ChatMessages
              messages={messages}
              isTyping={isTyping}
              phase={chatPhase}
              recommendedQuestions={recommendedQuestions}
              onSelectQuestion={(question) => void sendMessage(question)}
              isSending={isSending || isTyping}
            />
            <ChatInput
              onSendMessage={sendMessage}
              isSending={isSending || isTyping}
              suggestedFollowUp={messages.length > 0 ? suggestedFollowUp : null}
            />
          </>
        }
      />
      <ShareModal visualization={visualization} isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />
    </>
  );
}
