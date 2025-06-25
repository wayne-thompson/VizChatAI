import { Link, useLocation } from "wouter";
import React, { useRef } from "react";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Check if we're on a report page
  const isReportPage = location.startsWith('/report/');
  
  const handleNewClick = () => {
    // Open file browser dialog directly
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Verify file type and size
      const isValidType = ['image/jpeg', 'image/png'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB max
      
      if (!isValidType) {
        alert('Please select a JPEG or PNG image file.');
        event.target.value = '';
        return;
      }
      
      if (!isValidSize) {
        alert('File size should not exceed 5MB.');
        event.target.value = '';
        return;
      }
      
      // Store file reference for upload
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => {
        // Create a fake drop event - we'll handle this in our Home component's upload section
        sessionStorage.setItem('selectedFile', JSON.stringify({
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: fileReader.result
        }));
        
        // Navigate to home page
        navigate("/");
      };
      
      // Reset file input
      event.target.value = '';
    }
  };

  const handleDownloadPDF = () => {
    toast({
      title: "Downloading PDF",
      description: "Opening print dialog to save as PDF",
    });
    
    // Trigger the browser's print dialog which allows saving as PDF
    window.print();
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hidden file input for New button */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/jpeg,image/png"
        onChange={handleFileSelected}
      />
      
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
            <i className="fas fa-archive mr-2"></i>
            Archive
          </Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          {isReportPage ? (
            <button
              onClick={handleDownloadPDF}
              className="hidden md:flex items-center bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </button>
          ) : (
            <button
              onClick={handleNewClick}
              className="hidden md:flex items-center bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              <i className="fas fa-plus mr-2"></i>
              New
            </button>
          )}
          <button className="md:hidden text-gray-600">
            <i className="fas fa-bars text-xl"></i>
          </button>
          {isAuthenticated ? (
            <div className="hidden md:flex items-center space-x-2">
              {user?.profileImageUrl && (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <span className="text-sm text-gray-600">
                {user?.firstName} {user?.lastName}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/api/logout'}
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <i className="fas fa-user text-gray-500 text-sm"></i>
              </div>
              <span className="text-sm text-gray-700">User</span>
            </div>
          )}
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}