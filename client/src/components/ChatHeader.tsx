import { Button } from "@/components/ui/button";
import dataVizardImage from "@/assets/datawizard.png";

export default function ChatHeader() {
  return (
    <div className="px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
      <div className="flex items-center space-x-4">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden shadow-lg shadow-indigo-500/30 ring-2 ring-white">
          <img 
            src={dataVizardImage} 
            alt="Data Vizard" 
            className="h-9 w-9 object-contain"
          />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-slate-800">Data Vizard</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <p className="text-xs text-slate-500">Online • Ready to help</p>
          </div>
        </div>
        <Button variant="ghost" className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
          <i className="fas fa-ellipsis-v"></i>
        </Button>
      </div>
    </div>
  );
}
