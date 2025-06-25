import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import logoPath from '@assets/ChatGPT Image Jun 25, 2025, 01_01_38 AM_1750827710418.png';

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const [location] = useLocation();

  const navItems = [
    { name: "Home", path: "/", icon: "fa-home" },
    { name: "Projects", path: "/projects", icon: "fa-folder" },
    { name: "Shared", path: "/shared", icon: "fa-share-alt" },
    { name: "Settings", path: "/settings", icon: "fa-cog" },
  ];

  return (
    <aside className={cn(
      "w-16 lg:w-64 bg-white border-r border-gray-200 hidden md:block fixed h-full z-20",
      isOpen && "block"
    )}>
      <div className="p-4">
        <div className="flex items-center justify-center lg:justify-start space-x-2">
          <img 
            src={logoPath} 
            alt="VizChat Logo" 
            className="w-10 h-10 object-contain"
            style={{ imageRendering: 'crisp-edges' }}
          />
          <h1 className="text-xl font-semibold hidden lg:block">VizChat</h1>
        </div>
      </div>
      
      <nav className="mt-8">
        <div className="px-3 lg:px-6">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className={cn(
                  "flex items-center p-2 text-base font-medium rounded-md",
                  location === item.path 
                    ? "text-white bg-primary" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <i className={`fas ${item.icon} w-6 h-6 text-center`}></i>
                <span className="ml-3 hidden lg:block">{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
      
      <div className="absolute bottom-0 w-full p-4">
        <div className="flex items-center justify-center lg:justify-start px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <i className="fas fa-user text-gray-500 text-sm"></i>
          </div>
          <div className="ml-3 hidden lg:block">
            <p className="text-sm font-medium text-gray-700">User</p>
            <p className="text-xs text-gray-500">user@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
