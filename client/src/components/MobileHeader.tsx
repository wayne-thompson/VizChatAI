import { Button } from "@/components/ui/button";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <div className="flex justify-between items-center p-4 border-b border-gray-200 md:hidden">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <i className="fas fa-chart-line text-white text-sm"></i>
        </div>
        <h1 className="text-lg font-semibold">VizChat</h1>
      </div>
      <Button 
        variant="ghost" 
        className="p-2 rounded-md hover:bg-gray-100"
        onClick={onMenuClick}
      >
        <i className="fas fa-bars text-gray-600"></i>
      </Button>
    </div>
  );
}
