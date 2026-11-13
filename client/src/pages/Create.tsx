import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { GeneratedVisualization } from '@shared/schema';
import { Upload, Sparkles, Share2, Image, Palette, X, Loader2 } from 'lucide-react';
import ChartRenderer from '@/components/ChartRenderer';

export default function Create() {
  const { toast } = useToast();
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [styleFile, setStyleFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [generatedViz, setGeneratedViz] = useState<GeneratedVisualization | null>(null);
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const styleInputRef = useRef<HTMLInputElement>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!sourceFile) throw new Error('Source image is required');

      const formData = new FormData();
      formData.append('sourceImage', sourceFile);
      if (styleFile) {
        formData.append('styleReference', styleFile);
      }
      formData.append('prompt', prompt);

      const response = await fetch('/api/create-viz', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Failed to create visualization');
      }

      return response.json() as Promise<GeneratedVisualization>;
    },
    onSuccess: (data) => {
      setGeneratedViz(data);
      toast({
        title: 'Uploaded successfully',
        description: 'Now generating your visualizations...',
      });
      generateMutation.mutate(data.id);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload',
      });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest<GeneratedVisualization>(`/api/create-viz/${id}/generate`, {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      setGeneratedViz(data);
      const chartCount = data.chartSpecs?.length || 0;
      toast({
        title: 'Visualizations generated!',
        description: `Created ${chartCount} chart${chartCount !== 1 ? 's' : ''}`,
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Failed to generate',
      });
    },
  });

  const onSourceDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Maximum file size is 5MB',
        });
        return;
      }
      setSourceFile(file);
    }
  }, [toast]);

  const onStyleDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Maximum file size is 5MB',
        });
        return;
      }
      setStyleFile(file);
    }
  }, [toast]);

  const sourceDropzone = useDropzone({
    onDrop: onSourceDrop,
    accept: { 'image/jpeg': [], 'image/png': [] },
    maxSize: 5 * 1024 * 1024,
    maxFiles: 1,
    noClick: true,
  });

  const styleDropzone = useDropzone({
    onDrop: onStyleDrop,
    accept: { 'image/jpeg': [], 'image/png': [] },
    maxSize: 5 * 1024 * 1024,
    maxFiles: 1,
    noClick: true,
  });

  const handleShare = async () => {
    if (!generatedViz) return;

    const shareUrl = `${window.location.origin}/create-viz/share/${generatedViz.shareId}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: 'Link copied!',
        description: 'Share link copied to clipboard',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Copy failed',
        description: 'Could not copy share link',
      });
    }
  };

  const isLoading = createMutation.isPending || generateMutation.isPending;

  const handleSubmit = () => {
    if (!sourceFile) {
      toast({
        variant: 'destructive',
        title: 'Missing source image',
        description: 'Please upload a data screenshot first',
      });
      return;
    }
    createMutation.mutate();
  };

  const resetForm = () => {
    setSourceFile(null);
    setStyleFile(null);
    setPrompt('');
    setGeneratedViz(null);
  };

  const hasCharts = generatedViz?.chartSpecs && generatedViz.chartSpecs.length > 0;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2" data-testid="text-page-title">Create Visualizations</h1>
          <p className="text-slate-500">
            Upload a screenshot of your data and let AI generate beautiful visualizations for you
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column: Upload Section */}
          <div className="space-y-6">
            {/* Source Image Upload */}
            <Card data-testid="card-source-upload">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Image className="h-5 w-5 text-blue-600" />
                  Data Screenshot
                  <span className="text-red-500">*</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  {...sourceDropzone.getRootProps()}
                  className={`relative rounded-xl p-6 border-2 border-dashed text-center cursor-pointer transition-all duration-200
                    ${sourceDropzone.isDragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
                    }
                  `}
                  data-testid="dropzone-source"
                >
                  <input {...sourceDropzone.getInputProps()} />
                  <input
                    type="file"
                    ref={sourceInputRef}
                    style={{ display: 'none' }}
                    accept="image/jpeg,image/png"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        onSourceDrop([e.target.files[0]]);
                        e.target.value = '';
                      }
                    }}
                  />

                  {sourceFile ? (
                    <div className="relative">
                      <img
                        src={URL.createObjectURL(sourceFile)}
                        alt="Source preview"
                        className="max-h-48 mx-auto rounded-lg"
                        data-testid="img-source-preview"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSourceFile(null);
                        }}
                        data-testid="button-remove-source"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <p className="mt-2 text-sm text-slate-600">{sourceFile.name}</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 mx-auto text-slate-400 mb-3" />
                      <p className="text-sm font-medium text-slate-600 mb-1">
                        Drop your data screenshot here
                      </p>
                      <p className="text-xs text-slate-400 mb-3">or</p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => sourceInputRef.current?.click()}
                        data-testid="button-browse-source"
                      >
                        Browse Files
                      </Button>
                      <p className="text-xs text-slate-400 mt-3">JPG, PNG (max 5MB)</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Style Reference Upload */}
            <Card data-testid="card-style-upload">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Palette className="h-5 w-5 text-purple-600" />
                  Style Reference
                  <span className="text-slate-400 text-sm font-normal">(Optional)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  {...styleDropzone.getRootProps()}
                  className={`relative rounded-xl p-6 border-2 border-dashed text-center cursor-pointer transition-all duration-200
                    ${styleDropzone.isDragActive
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-slate-200 hover:border-purple-400 hover:bg-slate-50'
                    }
                  `}
                  data-testid="dropzone-style"
                >
                  <input {...styleDropzone.getInputProps()} />
                  <input
                    type="file"
                    ref={styleInputRef}
                    style={{ display: 'none' }}
                    accept="image/jpeg,image/png"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        onStyleDrop([e.target.files[0]]);
                        e.target.value = '';
                      }
                    }}
                  />

                  {styleFile ? (
                    <div className="relative">
                      <img
                        src={URL.createObjectURL(styleFile)}
                        alt="Style preview"
                        className="max-h-32 mx-auto rounded-lg"
                        data-testid="img-style-preview"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStyleFile(null);
                        }}
                        data-testid="button-remove-style"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <p className="mt-2 text-sm text-slate-600">{styleFile.name}</p>
                    </div>
                  ) : (
                    <>
                      <Palette className="h-8 w-8 mx-auto text-slate-400 mb-3" />
                      <p className="text-sm font-medium text-slate-600 mb-1">
                        Upload a chart style you like
                      </p>
                      <p className="text-xs text-slate-400 mb-3">
                        The AI will match this color scheme
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => styleInputRef.current?.click()}
                        data-testid="button-browse-style"
                      >
                        Browse Files
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Custom Prompt */}
            <Card data-testid="card-prompt">
              <CardHeader>
                <CardTitle className="text-lg">Additional Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="E.g., Focus on monthly trends, compare categories by percentage, use a dark color scheme..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px]"
                  data-testid="input-prompt"
                />
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button
              onClick={handleSubmit}
              disabled={!sourceFile || isLoading}
              className="w-full py-6 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
              data-testid="button-generate"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {createMutation.isPending ? 'Uploading...' : 'Generating visualizations...'}
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Visualizations
                </>
              )}
            </Button>
          </div>

          {/* Right Column: Results */}
          <div>
            <Card className="h-full" data-testid="card-results">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Generated Visualizations</CardTitle>
                  {hasCharts && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShare}
                        data-testid="button-share"
                      >
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetForm}
                        data-testid="button-new"
                      >
                        New
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16" data-testid="loading-state">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                    <p className="text-slate-600 font-medium">
                      {createMutation.isPending ? 'Uploading your data...' : 'Analyzing and creating charts...'}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      This may take a moment
                    </p>
                  </div>
                ) : hasCharts ? (
                  <div className="space-y-6" data-testid="charts-container">
                    {generatedViz.chartSpecs!.map((spec, index) => (
                      <ChartRenderer key={index} spec={spec} index={index} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="empty-state">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                      <Sparkles className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-medium mb-1">No visualizations yet</p>
                    <p className="text-sm text-slate-400">
                      Upload a data screenshot and click generate
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
