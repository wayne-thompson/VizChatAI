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
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Upload Your Data</h2>
        <p className="text-sm text-slate-500">Upload one or multiple charts to get AI-powered insights</p>
      </div>
      
      <div 
        {...getRootProps()} 
        className={`relative rounded-2xl p-10 bg-white border-2 border-dashed text-center cursor-pointer transition-all duration-300
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50/50 shadow-xl shadow-blue-500/10' 
            : isDragReject
              ? 'border-red-500 bg-red-50/50'
              : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
          }
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
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 shadow-lg shadow-blue-500/30">
          <i className="fas fa-cloud-upload-alt text-white text-2xl"></i>
        </div>
        <p className="text-base font-semibold text-slate-700 mb-2">
          {isDragActive 
            ? "Drop your files here..."
            : isDragReject
              ? "Unsupported file type"
              : "Drag and drop your files here"
          }
        </p>
        <p className="text-sm text-slate-400 mb-4">or</p>
        <Button 
          type="button" 
          disabled={isUploading}
          className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
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
        <p className="text-xs text-slate-400 mt-3">Supports JPG, PNG (max 5MB each) • <span className="font-medium text-slate-600">Multiple files supported</span></p>
      </div>
      
      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="mt-5 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs mr-2">
              {selectedFiles.length}
            </span>
            Selected Files
          </h3>
          <div className="space-y-2 mb-4">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 transition-all hover:bg-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
                    <i className="fas fa-image text-blue-600"></i>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-700">{file.name}</span>
                    <span className="text-xs text-slate-400">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <i className="fas fa-times"></i>
                </Button>
              </div>
            ))}
          </div>
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 font-medium"
          >
            {isUploading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Analyzing {selectedFiles.length} visualization{selectedFiles.length > 1 ? 's' : ''}...
              </>
            ) : (
              <>
                <i className="fas fa-sparkles mr-2"></i>
                Upload & Analyze {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
