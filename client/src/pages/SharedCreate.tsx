import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GeneratedVisualization } from '@shared/schema';
import { Download, Sparkles, Loader2 } from 'lucide-react';

export default function SharedCreate() {
  const [, params] = useRoute('/create-viz/share/:shareId');
  const shareId = params?.shareId;

  const { data: viz, isLoading, error } = useQuery<GeneratedVisualization>({
    queryKey: ['/api/create-viz/share', shareId],
    enabled: !!shareId,
  });

  const handleDownload = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `visualization-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading visualizations...</p>
        </div>
      </div>
    );
  }

  if (error || !viz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600 mb-4">This visualization could not be found or may have been removed.</p>
            <Button variant="outline" onClick={() => window.location.href = '/'} data-testid="button-go-home">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2" data-testid="text-title">AI Generated Visualizations</h1>
          <p className="text-slate-500">Created with VizChat</p>
        </div>

        {viz.generatedImages && viz.generatedImages.length > 0 ? (
          <div className="grid gap-6">
            {viz.generatedImages.map((img, index) => (
              <Card key={index} className="overflow-hidden" data-testid={`card-visualization-${index}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg" data-testid={`text-viz-title-${index}`}>Visualization {index + 1}</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(img, index)}
                      data-testid={`button-download-${index}`}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <img
                    src={img}
                    alt={`Generated visualization ${index + 1}`}
                    className="w-full rounded-lg"
                    data-testid={`img-visualization-${index}`}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-600" data-testid="text-no-images">No visualizations available</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
