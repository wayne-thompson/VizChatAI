import { Link, useLocation } from "wouter";
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/brand/Wordmark";
import { AuthPromptProvider, useOpenAuth } from "@/components/auth/AuthPrompt";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Archive" },
  { href: "/create", label: "Create" },
  { href: "/account", label: "Account" },
];

function navClass(active: boolean) {
  return cn(
    "rounded-md px-3 py-2 text-nav font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30",
    active ? "bg-cream text-forest" : "text-storm hover:bg-cream/80 hover:text-navy",
  );
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const bare =
    location.startsWith("/shared/") ||
    location.startsWith("/report/") ||
    isLoading ||
    (!isAuthenticated && location !== "/");

  if (bare) {
    return <>{children}</>;
  }

  return (
    <AuthPromptProvider>
      <AppShell>{children}</AppShell>
    </AuthPromptProvider>
  );
}

function AppShell({ children }: LayoutProps) {
  const [location, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated } = useAuth();
  const openAuth = useOpenAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => setMobileMenuOpen(false), [location]);

  const locksViewport =
    location === "/analyze" || location.startsWith("/visualization/");

  const handleNewClick = () => {
    sessionStorage.setItem("resetSession", "true");
    fileInputRef.current?.click();
    setMobileMenuOpen(false);
  };

  const handleFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const isValidType = ["image/jpeg", "image/png"].includes(file.type);
    const isValidSize = file.size <= 5 * 1024 * 1024;

    if (!isValidType) {
      alert("Please select a JPEG or PNG image file.");
      event.target.value = "";
      return;
    }

    if (!isValidSize) {
      alert("File size should not exceed 5MB.");
      event.target.value = "";
      return;
    }

    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);
    fileReader.onload = () => {
      sessionStorage.setItem(
        "selectedFile",
        JSON.stringify({
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: fileReader.result,
        }),
      );
      navigate("/analyze");
    };

    event.target.value = "";
  };

  return (
    <div className="flex min-h-screen flex-col bg-cloud text-navy">
      {isAuthenticated && (
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/jpeg,image/png"
          onChange={handleFileSelected}
        />
      )}

      <header className="sticky top-0 z-50 h-16 border-b border-sky bg-white">
        <div className="page-container flex h-full items-center justify-between gap-4">
          <Link href="/" aria-label="VizChat home" className="shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30">
            <Wordmark className="h-[3.25rem]" />
          </Link>

          {isAuthenticated ? (
            <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={location === item.href ? "page" : undefined}
                  className={navClass(location === item.href)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : null}

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button variant="brand" className="hidden md:inline-flex" onClick={handleNewClick}>
                New Analysis
              </Button>
            ) : (
              <>
                <Button variant="ghost" className="px-2 text-storm hover:bg-cream hover:text-navy sm:px-4" onClick={() => openAuth("login", "/")}>
                  Log in
                </Button>
                <Button variant="brand" className="px-3 sm:px-4" onClick={() => openAuth("register", "/")}>
                  Get started
                </Button>
              </>
            )}
            {isAuthenticated && (
              <button
                type="button"
                className="rounded-md p-2 text-navy hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30 md:hidden"
                aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
                aria-controls="mobile-navigation"
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen((open) => !open)}
              >
                <i className={`fas ${mobileMenuOpen ? "fa-times" : "fa-bars"} text-lg`} />
              </button>
            )}
          </div>
        </div>
        {isAuthenticated && mobileMenuOpen && (
          <nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="absolute inset-x-0 top-16 border-b border-sky bg-white px-5 py-3 md:hidden"
          >
            <div className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={location === item.href ? "page" : undefined}
                  className={navClass(location === item.href)}
                >
                  {item.label}
                </Link>
              ))}
              <Button variant="brand" className="mt-2" onClick={handleNewClick}>
                New Analysis
              </Button>
            </div>
          </nav>
        )}
      </header>

      <main className={locksViewport ? "flex-1 overflow-hidden" : "flex-1"}>
        {children}
      </main>
    </div>
  );
}
