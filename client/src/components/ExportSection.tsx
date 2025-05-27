import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Visualization, Message } from '@shared/schema';
import { Download, FileText, Image, Code, Table } from 'lucide-react';

interface ExportSectionProps {
  visualization: Visualization | null;
  messages: Message[];
  summary: { summary: string; points: string[] } | null;
}

export default function ExportSection({ visualization, messages, summary }: ExportSectionProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState<string | null>(null);

  if (!visualization) return null;

  const exportToPDF = async () => {
    setIsExporting('pdf');
    try {
      // Create a new window with the static report
      const reportUrl = `${window.location.origin}/report/${visualization.shareId}`;
      const printWindow = window.open(reportUrl, '_blank');
      
      if (printWindow) {
        // Wait for the page to load, then trigger print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 1000);
        };
      }
      
      toast({
        title: "PDF Export",
        description: "Opening print dialog for PDF export",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Could not export to PDF",
      });
    } finally {
      setIsExporting(null);
    }
  };

  const exportToImage = async () => {
    setIsExporting('image');
    try {
      // Convert base64 to blob and download directly
      const base64Data = visualization.imageBase64.split(',')[1] || visualization.imageBase64;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length) as number[];
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${visualization.title || 'visualization'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Image exported",
        description: "Visualization image downloaded successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Could not export image",
      });
    } finally {
      setIsExporting(null);
    }
  };

  const exportToJSON = async () => {
    setIsExporting('json');
    try {
      const exportData = {
        visualization: {
          id: visualization.id,
          title: visualization.title,
          description: visualization.description,
          tags: visualization.tags,
          createdAt: visualization.createdAt,
          shareId: visualization.shareId
        },
        analysis: summary,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt
        })),
        exportedAt: new Date().toISOString(),
        exportedBy: 'VizChat'
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${visualization.title || 'visualization'}-data.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "JSON exported",
        description: "Analysis data exported successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Could not export JSON data",
      });
    } finally {
      setIsExporting(null);
    }
  };

  const exportToMarkdown = async () => {
    setIsExporting('markdown');
    try {
      let markdown = `# ${visualization.title || 'Untitled Visualization'}\n\n`;
      
      if (visualization.description) {
        markdown += `${visualization.description}\n\n`;
      }
      
      markdown += `**Generated:** ${new Date(visualization.createdAt).toLocaleDateString()}\n\n`;
      
      if (visualization.tags && visualization.tags.length > 0) {
        markdown += `**Tags:** ${visualization.tags.join(', ')}\n\n`;
      }
      
      if (summary) {
        markdown += `## AI Analysis\n\n${summary.summary}\n\n`;
        
        if (summary.points && summary.points.length > 0) {
          markdown += `### Key Insights\n\n`;
          summary.points.forEach(point => {
            markdown += `- ${point}\n`;
          });
          markdown += '\n';
        }
      }
      
      if (messages.length > 0) {
        markdown += `## Discussion\n\n`;
        messages.forEach(msg => {
          const role = msg.role === 'user' ? 'Question' : 'Viz Assistant';
          markdown += `**${role}:** ${msg.content}\n\n`;
        });
      }
      
      markdown += `---\n*Generated with VizChat*`;
      
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${visualization.title || 'visualization'}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Markdown exported",
        description: "Report exported as Markdown file",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Could not export Markdown file",
      });
    } finally {
      setIsExporting(null);
    }
  };

  const exportToCSV = async () => {
    setIsExporting('csv');
    try {
      let csvContent = 'Type,Content,Timestamp\n';
      
      // Add analysis data
      if (summary) {
        csvContent += `"Analysis Summary","${summary.summary.replace(/"/g, '""')}","${new Date(visualization!.createdAt).toISOString()}"\n`;
        
        if (summary.points) {
          summary.points.forEach(point => {
            csvContent += `"Key Insight","${point.replace(/"/g, '""')}","${new Date(visualization!.createdAt).toISOString()}"\n`;
          });
        }
      }
      
      // Add chat messages
      messages.forEach(msg => {
        const type = msg.role === 'user' ? 'Question' : 'AI Response';
        csvContent += `"${type}","${msg.content.replace(/"/g, '""')}","${new Date(msg.createdAt).toISOString()}"\n`;
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${visualization!.title || 'visualization'}-analysis.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "CSV exported",
        description: "Analysis data exported successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Could not export CSV data",
      });
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="text-base font-medium mb-3 flex items-center">
        <Download className="h-4 w-4 mr-2 text-primary" />
        Export Options
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={exportToPDF}
          disabled={isExporting === 'pdf'}
          className="flex flex-col items-center p-3 h-auto"
        >
          <FileText className="h-5 w-5 mb-1" />
          <span className="text-xs">PDF Report</span>
          {isExporting === 'pdf' && <span className="text-xs text-gray-500">Exporting...</span>}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={exportToImage}
          disabled={isExporting === 'image'}
          className="flex flex-col items-center p-3 h-auto"
        >
          <Image className="h-5 w-5 mb-1" />
          <span className="text-xs">PNG Image</span>
          {isExporting === 'image' && <span className="text-xs text-gray-500">Exporting...</span>}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={exportToJSON}
          disabled={isExporting === 'json'}
          className="flex flex-col items-center p-3 h-auto"
        >
          <Code className="h-5 w-5 mb-1" />
          <span className="text-xs">JSON Data</span>
          {isExporting === 'json' && <span className="text-xs text-gray-500">Exporting...</span>}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={exportToCSV}
          disabled={isExporting === 'csv'}
          className="flex flex-col items-center p-3 h-auto"
        >
          <Table className="h-5 w-5 mb-1" />
          <span className="text-xs">CSV Data</span>
          {isExporting === 'csv' && <span className="text-xs text-gray-500">Exporting...</span>}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={exportToMarkdown}
          disabled={isExporting === 'markdown'}
          className="flex flex-col items-center p-3 h-auto"
        >
          <FileText className="h-5 w-5 mb-1" />
          <span className="text-xs">Markdown</span>
          {isExporting === 'markdown' && <span className="text-xs text-gray-500">Exporting...</span>}
        </Button>
      </div>
      
      <p className="text-xs text-gray-500 mt-3">
        Export your analysis in different formats for sharing and documentation
      </p>
    </div>
  );
}