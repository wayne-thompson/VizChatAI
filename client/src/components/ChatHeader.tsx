import { Button } from "@/components/ui/button";
import dataVizardImage from "@/assets/datawizard.png";

export default function ChatHeader() {
  return (
    <div className="px-4 py-3 border-b border-gray-200 bg-white">
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
          <img 
            src={dataVizardImage} 
            alt="Data Vizard" 
            className="h-8 w-8 object-contain"
          />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-900">Data Vizard</h3>
          <p className="text-xs text-gray-500">Ask questions about your visualization</p>
        </div>
        <div className="flex-grow"></div>
        <Button variant="ghost" className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100">
          <i className="fas fa-ellipsis-v"></i>
        </Button>
      </div>
    </div>
  );
}
