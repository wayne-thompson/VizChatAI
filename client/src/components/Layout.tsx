import { Link, useLocation } from "wouter";
import React, { useRef, useState, useEffect } from "react";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => setMobileMenuOpen(false), [location]);
  
  // Check if we're on a report page
  const isReportPage = location.startsWith('/report/');
  
  // For shared/report pages, show simple layout
  if (location.startsWith('/shared/') || location.startsWith('/report/')) {
    return <>{children}</>;
  }
  
  // For unauthenticated users, show simple layout
  if (!isAuthenticated) {
    return <>{children}</>;
  }
  
  const handleNewClick = () => {
    // Set flag to reset session
    sessionStorage.setItem('resetSession', 'true');
    
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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Hidden file input for New button */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/jpeg,image/png"
        onChange={handleFileSelected}
      />
      
      {/* Top Navigation Bar */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <i className="fas fa-chart-line text-white text-lg"></i>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">VizChat</h1>
            </div>
            
            <nav className="hidden md:flex items-center space-x-1">
              <Link 
                href="/" 
                onClick={() => sessionStorage.setItem('resetSession', 'true')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center ${
                  location === '/' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                <i className="fas fa-home mr-2"></i>
                Home
              </Link>
              <Link 
                href="/projects" 
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center ${
                  location === '/projects' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                <i className="fas fa-archive mr-2"></i>
                Archive
              </Link>
              <Link 
                href="/create" 
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center ${
                  location === '/create' 
                    ? 'bg-purple-50 text-purple-600' 
                    : 'text-slate-600 hover:text-purple-600 hover:bg-slate-50'
                }`}
              >
                <i className="fas fa-magic mr-2"></i>
                Create
              </Link>
              <Link 
                href="/account" 
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center ${
                  location === '/account' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                <i className="fas fa-user mr-2"></i>
                Account
              </Link>
            </nav>
            
            <div className="flex items-center space-x-3">
              {isReportPage ? (
                <button
                  onClick={handleDownloadPDF}
                  className="hidden md:flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 font-medium"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </button>
              ) : (
                <button
                  onClick={handleNewClick}
                  className="hidden md:flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 font-medium"
                >
                  <i className="fas fa-plus mr-2"></i>
                  New Visualization
                </button>
              )}
              <button
                type="button"
                className="md:hidden text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
                aria-controls="mobile-navigation"
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen(open => !open)}
              >
                <i className="fas fa-bars text-xl"></i>
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <nav id="mobile-navigation" aria-label="Mobile navigation" className="md:hidden flex flex-col gap-1 border-t border-slate-200 py-3">
              {[
                { href: "/", label: "Home" },
                { href: "/projects", label: "Archive" },
                { href: "/create", label: "Create" },
                { href: "/account", label: "Account" },
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={location === item.href ? "page" : undefined}
                  className={`rounded-lg px-4 py-3 font-medium ${location === item.href ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
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