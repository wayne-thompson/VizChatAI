import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Visualization } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useUpload } from '@/components/Layout';

interface UploadSectionProps {
  onUpload: (file: File) => Promise<Visualization>;
  isUploading: boolean;
}

export default function UploadSection({ onUpload, isUploading }: UploadSectionProps) {
  const { toast } = useToast();
  const { setTriggerFileSelector } = useUpload();
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    const fileSize = file.size / 1024 / 1024; // size in MB
    
    if (fileSize > 5) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Maximum file size is 5MB",
      });
      return;
    }
    
    try {
      await onUpload(file);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
      });
    }
  }, [onUpload, toast]);
  
  // Setup the file selector trigger
  useEffect(() => {
    setTriggerFileSelector(() => {
      return () => {
        fileInputRef.current?.click();
      };
    });
  }, [setTriggerFileSelector]);
  
  const { getRootProps, getInputProps, isDragReject, open } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': []
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false),
    noClick: true, // Disable native click handling as we'll handle it with our button
  });
  
  return (
    <div id="upload-section" className="mb-6">
      <h2 className="text-lg font-semibold mb-3">Upload Image</h2>
      <p className="text-sm text-gray-500 mb-4">Upload a chart or graph image to analyze</p>
      
      <div 
        {...getRootProps()} 
        className={`drop-zone rounded-lg p-8 bg-white text-center cursor-pointer
          ${isDragActive || isDragReject ? 'active' : ''}
          ${isDragReject ? 'border-red-500' : ''}
        `}
      >
        <input {...getInputProps()} ref={fileInputRef} />
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-50 mb-4">
          <i className="fas fa-cloud-upload-alt text-primary text-xl"></i>
        </div>
        <p className="text-sm font-medium text-gray-700 mb-1">
          {isDragActive 
            ? "Drop your file here..."
            : isDragReject
              ? "Unsupported file type"
              : "Drag and drop your file here"
          }
        </p>
        <p className="text-xs text-gray-500 mb-3">or</p>
        <Button 
          type="button" 
          disabled={isUploading}
          className="inline-flex items-center px-4 py-2"
          onClick={open}
        >
          {isUploading ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Uploading...
            </>
          ) : (
            "Browse Files"
          )}
        </Button>
        <p className="text-xs text-gray-500 mt-2">Supports JPG, PNG (max 5MB)</p>
      </div>
    </div>
  );
}
