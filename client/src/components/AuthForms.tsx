import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

type AuthMode = "login" | "register";

const fieldClass =
  "h-11 border-sky bg-white text-navy shadow-sm placeholder:text-storm/70 focus-visible:border-navy focus-visible:ring-navy/30 focus-visible:ring-offset-0";

export function AuthForms({
  mode,
  onModeChange,
  onSuccess,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "register") {
        await apiRequest("/api/register", {
          method: "POST",
          data: { email, password, firstName, lastName },
        });
      } else {
        await apiRequest("/api/login", {
          method: "POST",
          data: { email, password },
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-4 text-left">
      {mode === "register" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-navy">First name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              className={fieldClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-navy">Last name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              className={fieldClass}
            />
          </div>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-navy">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          className={fieldClass}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-navy">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          minLength={8}
          required
          className={fieldClass}
        />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <Button type="submit" variant="brand" className="h-11 w-full text-button" disabled={submitting}>
        {submitting ? "Please wait…" : mode === "register" ? "Create account" : "Log in"}
      </Button>
      <p className="text-center text-sm text-storm">
        {mode === "register" ? (
          <>
            Already have an account?{" "}
            <button
              type="button"
              className="font-medium text-forest underline decoration-forest/40 underline-offset-4 hover:text-navy"
              onClick={() => onModeChange("login")}
            >
              Log in
            </button>
          </>
        ) : (
          <>
            New to VizChat?{" "}
            <button
              type="button"
              className="font-medium text-forest underline decoration-forest/40 underline-offset-4 hover:text-navy"
              onClick={() => onModeChange("register")}
            >
              Create an account
            </button>
          </>
        )}
      </p>
    </form>
  );
}
