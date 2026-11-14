import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AuthForms } from "@/components/AuthForms";

type AuthMode = "login" | "register";
type OpenAuth = (mode: AuthMode, redirectTo?: string) => void;

const AuthPromptContext = createContext<OpenAuth | null>(null);

export function AuthPromptProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const redirectTo = useRef("/");

  const openAuth: OpenAuth = (nextMode, nextRedirect = "/") => {
    setMode(nextMode);
    redirectTo.current = nextRedirect;
    setOpen(true);
  };

  return (
    <AuthPromptContext.Provider value={openAuth}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
            overlayClassName="bg-navy/45"
            className="border-sky bg-white text-navy shadow-lift sm:max-w-md sm:rounded-xl [&>button]:text-storm [&>button]:hover:text-navy [&>button]:focus:ring-navy"
          >
          <DialogHeader>
            <DialogTitle className="text-heading font-semibold tracking-[-0.015em] text-navy">
              {mode === "register" ? "Create your account" : "Welcome back"}
            </DialogTitle>
          </DialogHeader>
          <AuthForms
            mode={mode}
            onModeChange={setMode}
            onSuccess={() => {
              setOpen(false);
              window.location.assign(redirectTo.current);
            }}
          />
        </DialogContent>
      </Dialog>
    </AuthPromptContext.Provider>
  );
}

export function useOpenAuth() {
  const openAuth = useContext(AuthPromptContext);
  if (!openAuth) {
    throw new Error("useOpenAuth must be used within AuthPromptProvider");
  }
  return openAuth;
}
