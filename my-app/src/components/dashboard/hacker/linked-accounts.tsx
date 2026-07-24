"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Link2,
  Link2Off,
  Github,
  Linkedin,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getProviderDisplayName } from "@/lib/auth0-management";
import type { LinkedAccount } from "@/lib/auth0-management";

interface LinkedAccountsProps {
  className?: string;
}

type LinkStatus =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "linking"; provider: string }
  | { type: "error"; message: string }
  | { type: "success"; message: string };

const PROVIDER_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgClass: string }> = {
  github: {
    icon: <Github className="w-5 h-5" />,
    color: "#24292F",
    bgClass: "bg-[#24292F]/10 dark:bg-[#24292F]/30",
  },
  linkedin: {
    icon: <Linkedin className="w-5 h-5" />,
    color: "#0A66C2",
    bgClass: "bg-[#0A66C2]/10 dark:bg-[#0A66C2]/30",
  },
  "google-oauth2": {
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
    color: "#4285F4",
    bgClass: "bg-[#4285F4]/10 dark:bg-[#4285F4]/30",
  },
};

function getProviderUi(provider: string) {
  const config = PROVIDER_CONFIG[provider];
  if (config) return config;

  // Fallback for unknown providers
  return {
    icon: <ExternalLink className="w-5 h-5" />,
    color: "#666",
    bgClass: "bg-surface-hover",
  };
}

export default function LinkedAccounts({ className }: LinkedAccountsProps) {
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<LinkStatus>({ type: "idle" });
  const [error, setError] = useState<string | null>(null);

  const fetchLinkedAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/link/status");
      if (!res.ok) {
        if (res.status === 401) {
          setError("Please sign in to manage linked accounts.");
          return;
        }
        throw new Error("Failed to load linked accounts");
      }
      const data = await res.json();
      setLinkedAccounts(data.linkedAccounts ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load linked accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinkedAccounts();
  }, [fetchLinkedAccounts]);

  /**
   * Initiate the account linking flow for a provider.
   * Redirects the user to Auth0 for authentication with the secondary provider.
   */
  const handleLink = async (provider: string) => {
    setStatus({ type: "linking", provider });
    try {
      const res = await fetch("/api/auth/link/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to initiate account linking");
      }

      const { url } = await res.json();

      // Redirect the user to Auth0 for secondary authentication
      window.location.href = url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to link account";
      setStatus({ type: "error", message });
      toast.error(message);
    }
  };

  /**
   * Unlink a connected account.
   */
  const handleUnlink = async (account: LinkedAccount) => {
    const displayName = getProviderDisplayName(account.provider);
    if (!window.confirm(`Disconnect ${displayName} from your account? You can reconnect anytime.`)) {
      return;
    }

    setStatus({ type: "loading" });
    try {
      const res = await fetch("/api/auth/link/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: account.provider,
          user_id: account.user_id,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to unlink account");
      }

      const data = await res.json();
      setLinkedAccounts((prev) =>
        prev.filter(
          (l) => !(l.provider === account.provider && l.user_id === account.user_id)
        )
      );
      setStatus({ type: "success", message: data.message });
      toast.success(data.message);
      setTimeout(() => setStatus({ type: "idle" }), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to unlink account";
      setStatus({ type: "error", message });
      toast.error(message);
    }
  };

  // Check for URL params from the linking callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linkedParam = params.get("linked");
    if (linkedParam) {
      if (linkedParam.startsWith("success:")) {
        const provider = linkedParam.replace("success:", "");
        setStatus({ type: "success", message: `${provider} connected successfully!` });
        toast.success(`${provider} connected successfully!`);
        // Refresh the list
        fetchLinkedAccounts();
      } else if (linkedParam.startsWith("error:")) {
        const message = linkedParam.replace("error:", "");
        setStatus({ type: "error", message: decodeURIComponent(message) });
        toast.error(decodeURIComponent(message));
      }

      // Clean up the URL without reloading
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);

      // Clear status after 5 seconds
      setTimeout(() => setStatus({ type: "idle" }), 5000);
    }
  }, [fetchLinkedAccounts]);

  const isLinking = status.type === "linking";

  const availableProviders = [
    { id: "github", name: "GitHub", description: "Connect your GitHub account for automatic repo syncing and contribution tracking." },
    { id: "linkedin", name: "LinkedIn", description: "Display your LinkedIn profile and professional experience." },
    { id: "google-oauth2", name: "Google", description: "Use your Google account for quick sign-in." },
  ];

  if (loading) {
    return (
      <div className={cn("bh-card p-6 space-y-4", className)}>
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-primary-red" />
          <h3 className="font-bold text-sm">Linked Accounts</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-surface-hover/50 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-surface-hover" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 bg-surface-hover rounded" />
                <div className="h-2 w-32 bg-surface-hover rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bh-card p-6 space-y-5", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-primary-red/10">
          <Link2 className="w-4 h-4 text-primary-red" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-primary">Linked Accounts</h3>
          <p className="text-[10px] text-muted-foreground font-mono">
            Connect accounts via Auth0 for single sign-on
          </p>
        </div>
      </div>

      {/* Status banner */}
      {status.type === "success" && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-status-green/10 border border-status-green/20 animate-in fade-in slide-in-from-top-1 duration-200">
          <CheckCircle2 className="w-4 h-4 text-status-green shrink-0" />
          <span className="text-xs font-medium text-status-green">{status.message}</span>
        </div>
      )}
      {status.type === "error" && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-status-red/10 border border-status-red/20 animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="w-4 h-4 text-status-red shrink-0" />
          <span className="text-xs font-medium text-status-red">{status.message}</span>
        </div>
      )}

      {/* Linked accounts list */}
      {linkedAccounts.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
            Connected ({linkedAccounts.length})
          </p>
          {linkedAccounts.map((account) => {
            const ui = getProviderUi(account.provider);
            const displayName = getProviderDisplayName(account.provider);
            return (
              <div
                key={`${account.provider}-${account.user_id}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-border/60 transition-all group"
              >
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", ui.bgClass)}>
                  {ui.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-primary truncate">
                    {account.name || displayName}
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground truncate">
                    {account.email || `${displayName} · ${account.provider}`}
                  </p>
                </div>
                <button
                  onClick={() => handleUnlink(account)}
                  disabled={status.type === "loading"}
                  className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-status-red/10 text-muted-foreground hover:text-status-red transition-all disabled:opacity-40"
                  title={`Disconnect ${displayName}`}
                  aria-label={`Disconnect ${displayName}`}
                >
                  <Link2Off className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Available providers to link */}
      <div className="space-y-2">
        {linkedAccounts.length > 0 && (
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
            Add More
          </p>
        )}
        {availableProviders
          .filter(
            (p) => !linkedAccounts.some((l) => l.provider === p.id)
          )
          .map((provider) => {
            const ui = getProviderUi(provider.id);
            return (
              <button
                key={provider.id}
                onClick={() => handleLink(provider.id)}
                disabled={isLinking}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:border-primary-red/30 hover:bg-primary-red/[0.03] transition-all text-left group",
                  isLinking && status.type === "linking" && (status as { provider: string }).provider === provider.id && "opacity-60"
                )}
              >
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", ui.bgClass)}>
                  {isLinking && (status as { provider: string }).provider === provider.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: ui.color }} />
                  ) : (
                    ui.icon
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-bold text-primary group-hover:text-primary-red transition-colors">
                    {provider.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {provider.description}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary-red/60 group-hover:translate-x-0.5 transition-all" />
              </button>
            );
          })}
      </div>

      {/* Empty state - no linked accounts and nothing available to link */}
      {linkedAccounts.length === 0 && availableProviders.every((p) =>
        linkedAccounts.some((l) => l.provider === p.id)
      ) && (
        <div className="text-center py-6 space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center">
            <Link2 className="w-6 h-6 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-bold text-primary">No accounts linked</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Connect your GitHub, LinkedIn, or Google account for single sign-on and automatic profile syncing.
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center py-4 space-y-2">
          <div className="mx-auto w-10 h-10 rounded-full bg-status-red/10 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-status-red" />
          </div>
          <p className="text-xs text-muted-foreground">{error}</p>
          <button
            onClick={fetchLinkedAccounts}
            className="text-xs font-medium text-primary-red hover:text-primary-red/70 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* Footer info */}
      <div className="pt-2 border-t border-border/40">
        <p className="text-[9px] text-muted-foreground/60 leading-relaxed">
          Accounts are linked through Auth0. You can sign in with any connected account.
          Disconnecting an account only removes it from your sign-in options - it won&apos;t
          affect your profile data.
        </p>
      </div>
    </div>
  );
}
