import { Link } from "wouter";
import { createContext, useContext, useState } from "react";

// Create context for handling file upload
export const UploadContext = createContext<{
  triggerFileSelector: () => void;
  setTriggerFileSelector: (callback: () => void) => void;
}>({
  triggerFileSelector: () => {},
  setTriggerFileSelector: () => {},
});

// Hook to access the upload context
export const useUpload = () => useContext(UploadContext);

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  // Create a function to trigger file upload
  const [triggerFileSelector, setTriggerFileSelector] = useState<(e?: React.MouseEvent) => void>(() => {});

  return (
    <UploadContext.Provider value={{ triggerFileSelector, setTriggerFileSelector }}>
      <div className="flex flex-col min-h-screen">
        {/* Top Navigation Bar */}
        <header className="w-full bg-white border-b border-gray-200 py-3 px-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <i className="fas fa-chart-line text-white text-lg"></i>
            </div>
            <h1 className="text-xl font-semibold">VizChat</h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-700 hover:text-primary font-medium flex items-center">
              <i className="fas fa-home mr-2"></i>
              Home
            </Link>
            <Link href="/projects" className="text-gray-700 hover:text-primary font-medium flex items-center">
              <i className="fas fa-folder mr-2"></i>
              Projects
            </Link>
            <Link href="/shared" className="text-gray-700 hover:text-primary font-medium flex items-center">
              <i className="fas fa-share-alt mr-2"></i>
              Shared
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => triggerFileSelector()} 
              className="hidden md:flex items-center bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              <i className="fas fa-plus mr-2"></i>
              New
            </button>
            <button className="md:hidden text-gray-600">
              <i className="fas fa-bars text-xl"></i>
            </button>
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <i className="fas fa-user text-gray-500 text-sm"></i>
              </div>
              <span className="text-sm text-gray-700">User</span>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </UploadContext.Provider>
  );
}
