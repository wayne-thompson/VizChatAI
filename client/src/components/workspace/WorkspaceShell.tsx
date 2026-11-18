import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { PanelRightClose, PanelRightOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PANEL_STORAGE_KEY = "vizchat.chartPanelOpen";
const CONTEXT_PANEL_WIDTH_CLASS = "w-[min(100%,460px)]";

type ContextPanelContextValue = {
  openContextPanel: () => void;
  closeContextPanel: () => void;
  isContextPanelOpen: boolean;
};

const ContextPanelContext = createContext<ContextPanelContextValue | null>(null);

export function useContextPanel() {
  return useContext(ContextPanelContext);
}

/** @deprecated Use useContextPanel — kept for Shared.tsx ChatHeader compatibility */
export function useChatPanel() {
  const panel = useContextPanel();
  return panel ? { closeChat: panel.closeContextPanel } : null;
}

type WorkspaceShellProps = {
  toolbar: ReactNode;
  chart: ReactNode;
  insights?: ReactNode;
  chat: ReactNode;
  chatReady: boolean;
};

function readStoredPanelOpen(): boolean {
  try {
    const stored = localStorage.getItem(PANEL_STORAGE_KEY);
    if (stored === "false") return false;
    if (stored === "true") return true;
  } catch {
    /* ignore */
  }
  return true;
}

export function WorkspaceShell({ toolbar, chart, insights, chat, chatReady }: WorkspaceShellProps) {
  const [desktopPanelOpen, setDesktopPanelOpen] = useState(readStoredPanelOpen);
  const [mobileOverlayOpen, setMobileOverlayOpen] = useState(false);
  const [isLgUp, setIsLgUp] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches,
  );

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsLgUp(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (isLgUp) {
      try {
        localStorage.setItem(PANEL_STORAGE_KEY, String(desktopPanelOpen));
      } catch {
        /* ignore */
      }
    }
  }, [desktopPanelOpen, isLgUp]);

  const openContextPanel = () => {
    if (isLgUp) setDesktopPanelOpen(true);
    else setMobileOverlayOpen(true);
  };

  const closeContextPanel = () => {
    if (isLgUp) setDesktopPanelOpen(false);
    else setMobileOverlayOpen(false);
  };

  const panelVisible = isLgUp ? desktopPanelOpen : mobileOverlayOpen;

  const contextValue: ContextPanelContextValue = {
    openContextPanel,
    closeContextPanel,
    isContextPanelOpen: panelVisible,
  };

  if (!chatReady) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
        <div className="h-14 shrink-0 border-b border-sky bg-white">{toolbar}</div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-2xl items-center px-5 py-10 sm:px-6">
            <div className="w-full">{chart}</div>
          </div>
        </div>
      </div>
    );
  }

  const unifiedDesktopHeader = isLgUp && desktopPanelOpen;

  const contextPanelHeader = (showOnDesktop: boolean) => (
    <ContextPanelHeader showOnDesktop={showOnDesktop} isLgUp={isLgUp} onClose={closeContextPanel} />
  );

  return (
    <ContextPanelContext.Provider value={contextValue}>
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-white">
        {unifiedDesktopHeader && (
          <div className="flex shrink-0 border-b border-sky bg-white">
            <div className="flex h-14 min-w-0 flex-1 items-stretch overflow-hidden">{toolbar}</div>
            {contextPanelHeader(true)}
          </div>
        )}
        <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <section
          id="workspace-conversation"
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white"
          aria-label="Data Vizard conversation"
        >
          {!unifiedDesktopHeader && (
            <div className="shrink-0 border-b border-sky bg-white">{toolbar}</div>
          )}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{chat}</div>
        </section>

        {!isLgUp && mobileOverlayOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-navy/20 lg:hidden"
            aria-label="Close Chart and Insights"
            onClick={closeContextPanel}
          />
        )}

        <aside
          id="workspace-context-panel"
          aria-label="Chart and Insights"
          aria-hidden={!panelVisible}
          className={cn(
            "z-40 flex min-h-0 flex-col overflow-hidden border-l border-sky bg-white",
            isLgUp
              ? cn(
                  "relative shrink-0 transition-[width] duration-200 ease-out",
                  desktopPanelOpen ? CONTEXT_PANEL_WIDTH_CLASS : "w-0 border-l-0",
                )
              : cn(
                  `fixed inset-y-0 right-0 ${CONTEXT_PANEL_WIDTH_CLASS} max-w-full shadow-lift transition-transform duration-200 ease-out lg:hidden`,
                  mobileOverlayOpen ? "translate-x-0" : "pointer-events-none translate-x-full",
                ),
          )}
        >
          <div
            className={cn(
              cn("flex h-full min-h-0 flex-col", CONTEXT_PANEL_WIDTH_CLASS),
              isLgUp && !desktopPanelOpen && "invisible",
            )}
          >
            {(!isLgUp || !desktopPanelOpen) && contextPanelHeader(false)}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="border-b border-sky bg-white">{chart}</div>
              <div className="bg-white px-4 py-4 sm:px-5">{insights}</div>
            </div>
          </div>
        </aside>

        {isLgUp && !desktopPanelOpen && (
          <button
            type="button"
            className="absolute right-0 top-16 z-20 flex items-center gap-2 rounded-l-md border border-r-0 border-sky bg-white px-2.5 py-3 text-navy shadow-card hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
            aria-label="Show Chart and Insights"
            onClick={openContextPanel}
          >
            <PanelRightOpen className="h-4 w-4" aria-hidden />
            <span className="max-w-[4.5rem] text-caption font-medium leading-tight [writing-mode:vertical-rl]">
              Chart &amp; Insights
            </span>
          </button>
        )}
        </div>
      </div>
    </ContextPanelContext.Provider>
  );
}

function ContextPanelHeader({
  showOnDesktop,
  isLgUp,
  onClose,
}: {
  showOnDesktop: boolean;
  isLgUp: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className={cn(
        "flex h-14 shrink-0 items-center justify-between gap-2 bg-white px-4 sm:px-5",
        showOnDesktop
          ? cn(CONTEXT_PANEL_WIDTH_CLASS, "border-l border-sky")
          : "border-b border-sky",
      )}
    >
      <h2 className="text-nav font-semibold text-navy">Chart &amp; Insights</h2>
      <button
        type="button"
        className="rounded-md p-1.5 text-storm hover:bg-cream hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
        aria-label="Hide Chart and Insights panel"
        onClick={onClose}
      >
        {isLgUp ? <PanelRightClose className="h-4 w-4" aria-hidden /> : <X className="h-4 w-4" aria-hidden />}
      </button>
    </div>
  );
}

/** @deprecated Context panel is closed from its header; kept for Shared.tsx */
export function ChatPanelClose() {
  const panel = useContextPanel();
  if (!panel) return null;

  return (
    <button
      type="button"
      className="rounded-md p-1.5 text-storm hover:bg-cream hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30 lg:hidden"
      aria-label="Close Chart and Insights"
      onClick={panel.closeContextPanel}
    >
      <X className="h-4 w-4" aria-hidden />
    </button>
  );
}