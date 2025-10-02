import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Visualization } from '@shared/schema';
import { X } from 'lucide-react';

interface ShareSectionProps {
  visualization: Visualization | null;
  onUpdateTags: (tags: string[]) => Promise<void>;
}

export default function ShareSection({ visualization, onUpdateTags }: ShareSectionProps) {
  const { toast } = useToast();
  const [tags, setTags] = useState<string[]>(visualization?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!visualization) return null;

  const reportUrl = `${window.location.origin}/report/${visualization.shareId}`;

  const handleCopyLink = (url: string, type: string) => {
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    
    toast({
      title: "Link copied",
      description: `${type} link has been copied to clipboard`,
    });
    
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  const handleCopyReportLink = () => handleCopyLink(reportUrl, "Static report");

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    
    const updatedTags = [...tags, newTag.trim()];
    setTags(updatedTags);
    setNewTag('');
    
    try {
      await onUpdateTags(updatedTags);
      toast({
        title: "Tag added",
        description: `Added tag: ${newTag.trim()}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to add tag",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    
    try {
      await onUpdateTags(updatedTags);
    } catch (error) {
      setTags(tags); // Restore original tags if update fails
      toast({
        variant: "destructive",
        title: "Failed to remove tag",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div id="share-section" className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-medium">Share This Analysis</h2>
      </div>
      
      {/* Static Report Link */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-gray-600">Static Report</label>
          <Button 
            id="copy-report-link-btn" 
            variant="ghost"
            className="text-primary hover:text-primary/80 text-sm font-medium h-7 px-2"
            onClick={handleCopyReportLink}
          >
            <i className="fas fa-copy mr-1"></i>
            Copy
          </Button>
        </div>
        <div className="flex items-center">
          <Input 
            type="text" 
            value={reportUrl} 
            readOnly 
            className="block w-full rounded-l-md bg-gray-50 text-sm px-3 py-2 border outline-none" 
          />
          <Button 
            className="bg-gray-100 border border-gray-300 border-l-0 rounded-r-md px-3 py-2 hover:bg-gray-200"
            onClick={() => window.open(reportUrl, '_blank')}
            type="button"
          >
            <i className="fas fa-external-link-alt text-gray-500"></i>
          </Button>
        </div>
      </div>
      
      <div className="mt-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Add Tags (Optional)</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag, index) => (
            <span 
              key={index}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
            >
              {tag}
              <button 
                type="button" 
                className="ml-1 text-primary-500 hover:text-primary-600"
                onClick={() => handleRemoveTag(tag)}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <div className="flex items-center">
            <Input
              type="text" 
              placeholder="Add tag..." 
              className="bg-transparent text-sm border-none outline-none focus:ring-0 p-0 w-24"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleKeyDown}
              ref={inputRef}
            />
            {newTag && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 w-6 p-0 ml-1" 
                onClick={handleAddTag}
              >
                <i className="fas fa-plus text-gray-400"></i>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
