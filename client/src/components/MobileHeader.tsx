import { Button } from "@/components/ui/button";
import logoPath from '@assets/ChatGPT Image Jun 25, 2025, 01_15_34 AM_1750828545033.png';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <div className="flex justify-between items-center p-4 border-b border-gray-200 md:hidden">
      <div className="flex items-center space-x-2">
        <img 
          src={logoPath} 
          alt="VizChat Logo" 
          className="h-8 w-8 object-contain"
          style={{ imageRendering: 'crisp-edges' }}
        />
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
