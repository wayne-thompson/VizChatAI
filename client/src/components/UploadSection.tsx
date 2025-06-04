import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Visualization } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import type { MouseEvent } from 'react';

interface UploadSectionProps {
  onUpload: (files: File[]) => Promise<Visualization[]>;
  isUploading: boolean;
}

export default function UploadSection({ onUpload, isUploading }: UploadSectionProps) {
  const { toast } = useToast();
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    // Validate file sizes
    const invalidFiles = acceptedFiles.filter(file => file.size / 1024 / 1024 > 5);
    if (invalidFiles.length > 0) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Maximum file size is 5MB per file",
      });
      return;
    }
    
    // Add files to selection (allow multiple)
    setSelectedFiles(prev => [...prev, ...acceptedFiles]);
  }, [toast]);
  
  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return;
    
    try {
      await onUpload(selectedFiles);
      setSelectedFiles([]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload images",
      });
    }
  }, [onUpload, selectedFiles, toast]);
  
  // Create a function to handle file selection
  const handleFileSelection = useCallback((e?: MouseEvent) => {
    if (e) e.preventDefault();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);
  
  const { getRootProps, getInputProps, isDragReject } = useDropzone({
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
        <input {...getInputProps()} />
        <input 
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/jpeg,image/png"
          multiple
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
              onDrop(Array.from(files));
              e.target.value = '';
            }
          }}
        />
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-50 mb-4">
          <i className="fas fa-cloud-upload-alt text-primary text-xl"></i>
        </div>
        <p className="text-sm font-medium text-gray-700 mb-1">
          {isDragActive 
            ? "Drop your files here..."
            : isDragReject
              ? "Unsupported file type"
              : "Drag and drop your files here"
          }
        </p>
        <p className="text-xs text-gray-500 mb-3">or</p>
        <Button 
          type="button" 
          disabled={isUploading}
          className="inline-flex items-center px-4 py-2"
          onClick={handleFileSelection}
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
        <p className="text-xs text-gray-500 mt-2">Supports JPG, PNG (max 5MB each) • Upload multiple files for comprehensive analysis</p>
      </div>
      
      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Selected Files ({selectedFiles.length})
          </h3>
          <div className="space-y-2 mb-4">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-image text-gray-400"></i>
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <i className="fas fa-times"></i>
                </Button>
              </div>
            ))}
          </div>
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Analyzing {selectedFiles.length} visualization{selectedFiles.length > 1 ? 's' : ''}...
              </>
            ) : (
              <>
                Upload & Analyze {selectedFiles.length} visualization{selectedFiles.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
