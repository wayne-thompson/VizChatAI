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
    visualizations,
    summary,
    isUploading, 
    isGeneratingInsights,
    uploadImage,
    uploadMultipleImages
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
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)]">
      {/* Left Panel: Upload and Preview */}
      <div className="w-full md:w-1/2 p-4 md:p-6 md:border-r border-gray-200 overflow-y-auto h-[50vh] md:h-full">
        <div className="max-w-xl mx-auto">
          {!visualization ? (
            <UploadSection 
              onUpload={async (files: File[]) => {
                if (files.length === 1) {
                  return [await uploadImage(files[0])];
                } else {
                  return await uploadMultipleImages(files);
                }
              }} 
              isUploading={isUploading} 
            />
          ) : (
            <>
              <PreviewSection 
                visualization={visualization} 
                visualizations={visualizations}
                summary={summary}
                isGenerating={isGeneratingInsights}
              />
              
              {/* Show multiple visualizations indicator */}
              {visualizations.length > 1 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-layer-group text-blue-600"></i>
                    <span className="text-sm font-medium text-blue-700">
                      Project Analysis: {visualizations.length} visualizations
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Data Vizard will analyze all charts together for comprehensive business insights
                  </p>
                </div>
              )}
              
              <ShareSection 
                visualization={visualization} 
                onUpdateTags={updateVisualizationTags}
              />
            </>
          )}
        </div>
      </div>

      {/* Right Panel: Chat Interface */}
      <div className="w-full md:w-1/2 flex flex-col h-[50vh] md:h-full">
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
