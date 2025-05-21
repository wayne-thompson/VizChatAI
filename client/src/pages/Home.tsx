import { useState } from "react";
import UploadSection from "@/components/UploadSection";
import PreviewSection from "@/components/PreviewSection";
import ShareSection from "@/components/ShareSection";
import ChatHeader from "@/components/ChatHeader";
import ChatMessages from "@/components/ChatMessages";
import ChatInput from "@/components/ChatInput";
import ShareModal from "@/components/ShareModal";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useChat } from "@/hooks/useChat";
import { useSharing } from "@/hooks/useSharing";

export default function Home() {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  const { 
    visualization, 
    summary,
    isUploading, 
    isGeneratingInsights,
    uploadImage,
    generateInsights
  } = useImageUpload();
  
  const {
    messages,
    isTyping,
    sendMessage
  } = useChat(visualization?.id || 0);

  const {
    updateVisualizationTags
  } = useSharing(visualization?.id || 0);

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Left Panel: Upload and Preview */}
      <div className="w-full md:w-1/2 p-4 md:p-6 md:border-r border-gray-200 md:overflow-y-auto mobile-full">
        <UploadSection onUpload={uploadImage} isUploading={isUploading} />
        
        <PreviewSection 
          visualization={visualization} 
          summary={summary}
          onGenerateInsights={generateInsights}
          isGenerating={isGeneratingInsights}
        />
        
        {visualization && (
          <ShareSection 
            visualization={visualization} 
            onUpdateTags={updateVisualizationTags}
          />
        )}
      </div>

      {/* Right Panel: Chat Interface */}
      <div className="w-full md:w-1/2 flex flex-col h-screen md:h-auto mobile-full">
        <ChatHeader />
        
        <ChatMessages messages={messages} isTyping={isTyping} />
        
        <ChatInput 
          onSendMessage={sendMessage} 
          isSending={isTyping} 
        />
      </div>

      <ShareModal 
        visualization={visualization} 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
      />
    </div>
  );
}
