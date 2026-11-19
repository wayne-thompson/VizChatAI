import { Link, useLocation } from "wouter";
import { useRef, type ChangeEvent, type ReactNode } from "react";
import { Archive, House, PenLine, Plus, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { RailMark, Wordmark } from "@/components/brand/Wordmark";
import { ModelRail } from "@/components/ModelRail";
import { AuthPromptProvider, useOpenAuth } from "@/components/auth/AuthPrompt";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

type NavIcon = typeof House;

type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
  action?: "new";
};

const PRIMARY_NAV: NavItem[] = [
  { href: "/analyze", label: "New Analysis", icon: Plus, action: "new" },
  { href: "/", label: "Home", icon: House },
  { href: "/projects", label: "Archive", icon: Archive },
  { href: "/create", label: "Create", icon: PenLine },
];

const ACCOUNT_NAV: NavItem = { href: "/account", label: "Account", icon: User };

function isCurrent(href: string, location: string) {
  return href === "/" ? location === "/" : location === href;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const bare =
    location.startsWith("/shared/") ||
    location.startsWith("/report/") ||
    location.startsWith("/create-viz/") ||
    isLoading ||
    (!isAuthenticated && location !== "/");

  if (bare) {
    return <>{children}</>;
  }

  return (
    <AuthPromptProvider>
      {isAuthenticated ? <AppShell>{children}</AppShell> : <PublicShell>{children}</PublicShell>}
    </AuthPromptProvider>
  );
}

function PublicShell({ children }: LayoutProps) {
  const openAuth = useOpenAuth();

  return (
    <div className="flex min-h-screen flex-col bg-cloud text-navy">
      <header className="sticky top-0 z-50 h-16 border-b border-sky bg-white">
        <div className="page-container flex h-full items-center justify-between gap-4">
          <Link href="/" aria-label="VizChat home" className="shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30">
            <Wordmark className="h-[3.25rem]" />
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="px-2 text-storm hover:bg-cream hover:text-navy sm:px-4" onClick={() => openAuth("login", "/")}>
              Log in
            </Button>
            <Button variant="brand" className="px-3 sm:px-4" onClick={() => openAuth("register", "/")}>
              Get started
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

function AppShell({ children }: LayoutProps) {
  const [location, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNewClick = () => {
    sessionStorage.setItem("resetSession", "true");
    fileInputRef.current?.click();
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
    <div className="flex h-dvh overflow-hidden bg-white text-navy">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png"
        onChange={handleFileSelected}
      />
      <AppRail location={location} onNewAnalysis={handleNewClick} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        <MobileNav location={location} onNewAnalysis={handleNewClick} />
      </div>
    </div>
  );
}

function AppRail({ location, onNewAnalysis }: { location: string; onNewAnalysis: () => void }) {
  return (
    <aside className="hidden h-dvh w-[4.25rem] shrink-0 flex-col items-center bg-graphite py-3 md:flex">
      <Link
        href="/"
        aria-label="VizChat home"
        className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
      >
        <RailMark />
      </Link>
      <nav className="mt-5 flex w-full flex-1 flex-col items-center gap-3" aria-label="Primary">
        {PRIMARY_NAV.map((item) => (
          <RailButton key={item.href} item={item} location={location} onNewAnalysis={onNewAnalysis} />
        ))}
        <div className="mt-auto flex flex-col items-center gap-3">
          <RailButton item={ACCOUNT_NAV} location={location} onNewAnalysis={onNewAnalysis} />
          <div className="h-px w-7 bg-navy/20" aria-hidden />
          <ModelRail />
        </div>
      </nav>
    </aside>
  );
}

function RailButton({
  item,
  location,
  onNewAnalysis,
}: {
  item: NavItem;
  location: string;
  onNewAnalysis: () => void;
}) {
  const current = isCurrent(item.href, location);
  const prominent = item.action === "new";
  const className = railItemClass(current, prominent);
  const Icon = item.icon;

  const icon = <Icon className="h-5 w-5" strokeWidth={prominent ? 2.5 : 2} aria-hidden />;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {item.action === "new" ? (
          <button type="button" className={className} aria-label={item.label} aria-current={current ? "page" : undefined} onClick={onNewAnalysis}>
            {icon}
          </button>
        ) : (
          <Link href={item.href} className={className} aria-label={item.label} aria-current={current ? "page" : undefined}>
            {icon}
          </Link>
        )}
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>{item.label}</TooltipContent>
    </Tooltip>
  );
}

function railItemClass(active: boolean, prominent = false) {
  if (prominent) {
    return cn(
      "mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-navy text-white transition-colors",
      "hover:bg-[#1e364c]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-graphite",
      active && "ring-2 ring-forest ring-offset-2 ring-offset-graphite",
    );
  }

  return cn(
    "flex h-10 w-10 items-center justify-center rounded-md text-navy/70 transition-colors",
    "hover:bg-navy/10 hover:text-navy",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40",
    active && "bg-white text-navy shadow-[inset_0_-2px_0_#5E6C5B]",
  );
}

function MobileNav({ location, onNewAnalysis }: { location: string; onNewAnalysis: () => void }) {
  const items = [...PRIMARY_NAV, ACCOUNT_NAV];

  return (
    <nav
      className="flex shrink-0 border-t border-navy/10 bg-graphite pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Primary"
    >
      {items.map((item) => {
        const current = isCurrent(item.href, location);
        const Icon = item.icon;
        const prominent = item.action === "new";
        const className = cn(
          "flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy/40",
          prominent && "mr-1 text-navy",
          !prominent && (current ? "text-navy" : "text-navy/70"),
        );
        const content = prominent ? (
          <>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-white">
              <Icon className="h-5 w-5" strokeWidth={2.5} aria-hidden />
            </span>
            <span className="truncate">New</span>
          </>
        ) : (
          <>
            <Icon className="h-5 w-5" aria-hidden />
            <span className="truncate">{item.label}</span>
          </>
        );

        if (item.action === "new") {
          return (
            <button key={item.href} type="button" className={className} aria-label={item.label} aria-current={current ? "page" : undefined} onClick={onNewAnalysis}>
              {content}
            </button>
          );
        }

        return (
          <Link key={item.href} href={item.href} className={className} aria-current={current ? "page" : undefined}>
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
