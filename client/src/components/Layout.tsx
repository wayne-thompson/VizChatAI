import { useState } from "react";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} />

      {/* Main content area */}
      <main className="flex-1 overflow-hidden">
        {/* Mobile Header */}
        <MobileHeader onMenuClick={toggleSidebar} />

        {/* Main content */}
        {children}
      </main>
    </div>
  );
}
