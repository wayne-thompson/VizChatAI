import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Visualization } from "@shared/schema";

interface ShareModalProps {
  visualization: Visualization | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ visualization, isOpen, onClose }: ShareModalProps) {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState("view-only");
  const [description, setDescription] = useState(visualization?.description || "");
  
  if (!visualization) return null;
  
  const shareUrl = `${window.location.origin}/share/${visualization.shareId}`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    
    toast({
      title: "Link copied",
      description: "Shareable link has been copied to clipboard",
    });
  };
  
  const handleShare = () => {
    // In a real application, we would save the permissions and description
    toast({
      title: "Link shared",
      description: "Your visualization link is ready to share",
    });
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10">
            <i className="fas fa-share-alt text-primary"></i>
          </div>
          <DialogTitle>Share Your Visualization</DialogTitle>
          <DialogDescription>
            Anyone with the link will be able to view this visualization and the chat conversation.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-2">
          <label htmlFor="share-link" className="block text-sm font-medium leading-6 text-gray-900">
            Shareable Link
          </label>
          <div className="mt-2 flex rounded-md shadow-sm">
            <Input
              id="share-link"
              type="text"
              value={shareUrl}
              readOnly
              className="block w-full rounded-l-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary"
            />
            <Button
              type="button"
              className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              onClick={handleCopyLink}
            >
              <i className="fas fa-copy text-gray-400"></i>
              Copy
            </Button>
          </div>
        </div>
        
        <div className="mt-2">
          <label htmlFor="share-permissions" className="block text-sm font-medium leading-6 text-gray-900">
            Permissions
          </label>
          <Select value={permissions} onValueChange={setPermissions}>
            <SelectTrigger className="mt-2 w-full">
              <SelectValue placeholder="Select permissions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="view-only">View only</SelectItem>
              <SelectItem value="view-comment">View and comment</SelectItem>
              <SelectItem value="full-access">Full access</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="mt-2">
          <label htmlFor="share-description" className="block text-sm font-medium leading-6 text-gray-900">
            Add a description (optional)
          </label>
          <Textarea
            id="share-description"
            rows={3}
            placeholder="Add context about this visualization..."
            className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        
        <DialogFooter className="mt-4 flex sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="mt-3 inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold sm:mt-0 sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleShare}
            className="inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm sm:ml-3 sm:w-auto"
          >
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
