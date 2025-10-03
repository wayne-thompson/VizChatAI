import { useState, useEffect } from "react";
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

  // Check for file from "New Visualization" button
  useEffect(() => {
    const checkForSelectedFile = async () => {
      const storedFile = sessionStorage.getItem('selectedFile');
      if (storedFile) {
        try {
          const fileData = JSON.parse(storedFile);
          
          // Convert dataUrl back to File object
          const response = await fetch(fileData.dataUrl);
          const blob = await response.blob();
          const file = new File([blob], fileData.name, { type: fileData.type });
          
          // Upload the file
          await uploadImage(file);
          
          // Clear sessionStorage
          sessionStorage.removeItem('selectedFile');
        } catch (error) {
          console.error('Error processing selected file:', error);
          sessionStorage.removeItem('selectedFile');
        }
      }
    };
    
    checkForSelectedFile();
  }, [uploadImage]);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)]">
      {/* Left Panel: Upload and Preview */}
      <div className="w-full md:w-1/2 p-6 md:p-8 md:border-r border-slate-200/60 overflow-y-auto h-[50vh] md:h-full bg-white">
        <div className="max-w-2xl mx-auto">
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
                <div className="mt-5 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500 shadow-lg shadow-blue-500/30">
                      <i className="fas fa-layer-group text-white"></i>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-blue-700 block">
                        Project Analysis: {visualizations.length} visualizations
                      </span>
                      <p className="text-xs text-blue-600 mt-0.5">
                        Comprehensive insights across all your charts
                      </p>
                    </div>
                  </div>
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
      <div className="w-full md:w-1/2 flex flex-col h-[50vh] md:h-full bg-white">
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
