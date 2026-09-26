"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Calendar,
  RefreshCw,
  Loader2,
  AlertCircle,
  Unlink,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Google Calendar connection settings.
 *
 * Consumes the one-way sync: Butwal Hacks events are pushed into the user's
 * own Google calendar. Nothing is ever read back or deleted there, which the
 * copy states plainly because "we will never delete anything from your
 * calendar" is a promise the user should be able to see rather than infer.
 */

interface Status {
  connected: boolean;
  syncEnabled?: boolean;
  hasRefreshToken?: boolean;
  scopes?: string | null;
  googleEmail?: string | null;
  calendarId?: string;
  lastSyncedAt?: string | null;
  lastSyncError?: string | null;
  syncedEventCount?: number;
}

type State =
  | { type: "loading" }
  | { type: "ready"; status: Status }
  | { type: "unavailable" }
  | { type: "error"; message: string };

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Never";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function GoogleCalendarSettings({ className }: { className?: string }) {
  const [state, setState] = useState<State>({ type: "loading" });
  const [busy, setBusy] = useState<"connect" | "sync" | "disconnect" | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar/google/status");
      if (res.status === 401) {
        setState({ type: "error", message: "Please sign in to manage your calendar." });
        return;
      }
      if (res.status === 503) {
        // Google credentials are not provisioned in this environment.
        setState({ type: "unavailable" });
        return;
      }
      if (!res.ok) throw new Error("Failed to read your calendar connection.");

      setState({ type: "ready", status: (await res.json()) as Status });
    } catch (err) {
      setState({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to read your calendar connection.",
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // The OAuth callback returns here with ?gcal=connected. Surface it once,
  // then scrub the query so a refresh does not replay the toast.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("gcal") !== "connected") return;

    toast.success("Google Calendar connected");
    window.history.replaceState({}, "", window.location.pathname);
    void load();
  }, [load]);

  const handleConnect = useCallback(async () => {
    setBusy("connect");
    try {
      const res = await fetch("/api/calendar/google/connect");
      if (res.status === 503) {
        toast.error("Google Calendar sync is not available right now.");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to start the connection.");

      // Full-page navigation: Google redirects back to /api/calendar/google/callback.
      window.location.assign(data.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start the connection.");
      setBusy(null);
    }
  }, []);

  const handleSync = useCallback(async () => {
    setBusy("sync");
    try {
      const res = await fetch("/api/calendar/google/sync", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Sync failed.");

      if (data.fatal === "revoked") {
        toast.error("Google revoked access. Reconnect to keep syncing.");
      } else if (data.fatal) {
        toast.error("Could not sync. Try reconnecting your calendar.");
      } else {
        const c = data.counts ?? {};
        toast.success(
          `Synced: ${c.create ?? 0} added, ${c.update ?? 0} updated, ${c.skip ?? 0} unchanged.`
        );
      }
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed.");
    } finally {
      setBusy(null);
    }
  }, [load]);

  const handleDisconnect = useCallback(async () => {
    if (
      !window.confirm(
        "Disconnect Google Calendar? Events already added to your calendar will stay there — delete them from Google if you no longer want them."
      )
    ) {
      return;
    }

    setBusy("disconnect");
    try {
      const res = await fetch("/api/calendar/google/disconnect", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to disconnect.");

      toast.success(data.message ?? "Google Calendar disconnected.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to disconnect.");
    } finally {
      setBusy(null);
    }
  }, [load]);

  if (state.type === "loading") {
    return (
      <div className={cn("bh-card p-6", className)}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs font-mono">Checking calendar connection…</span>
        </div>
      </div>
    );
  }

  if (state.type === "unavailable") {
    return (
      <div className={cn("bh-card p-6 space-y-3", className)}>
        <Header />
        <p className="text-xs text-muted-foreground">
          Google Calendar sync isn&apos;t available yet. It will be enabled once
          calendar.butwalhacks.com is provisioned.
        </p>
      </div>
    );
  }

  if (state.type === "error") {
    return (
      <div className={cn("bh-card p-6 space-y-3", className)}>
        <Header />
        <div className="flex items-center gap-2 text-status-red text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{state.message}</span>
        </div>
        <button
          onClick={load}
          className="text-xs font-medium text-primary-red hover:text-primary-red/70 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  const { status } = state;
  const revoked = status.lastSyncError === "revoked";

  if (!status.connected) {
    return (
      <div className={cn("bh-card p-6 space-y-4", className)}>
        <Header />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Add Butwal Hacks events straight to your Google Calendar. We only add and
          update our own events — we never read, move, or delete anything else.
        </p>
        <button
          onClick={handleConnect}
          disabled={busy === "connect"}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-primary-red/10 border border-primary-red/20 hover:bg-primary-red/15 transition-all text-xs font-bold text-primary-red disabled:opacity-50"
        >
          {busy === "connect" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Calendar className="w-4 h-4" />
          )}
          Connect Google Calendar
        </button>
      </div>
    );
  }

  return (
    <div className={cn("bh-card p-6 space-y-4", className)}>
      <Header />

      {revoked && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-status-red/10 border border-status-red/20">
          <AlertCircle className="w-4 h-4 text-status-red shrink-0 mt-0.5" />
          <span className="text-xs text-status-red">
            Google revoked access. Reconnect to resume syncing.
          </span>
        </div>
      )}

      <dl className="space-y-2 text-xs">
        <Row label="Account" value={status.googleEmail ?? "Connected"} />
        <Row label="Last synced" value={formatWhen(status.lastSyncedAt)} />
        <Row
          label="Events synced"
          value={String(status.syncedEventCount ?? 0)}
        />
        {status.lastSyncError && status.lastSyncError !== "revoked" && (
          <Row label="Last error" value={status.lastSyncError} tone="error" />
        )}
      </dl>

      <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
        One-way sync. We add and update Butwal Hacks events only, and we never
        delete anything from your calendar. Date or detail changes you make in
        Butwal Hacks are applied to Google automatically.
      </p>

      <div className="flex gap-2">
        <button
          onClick={handleSync}
          disabled={busy !== null || revoked}
          className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg bg-surface/10 hover:bg-surface/20 transition-all text-xs font-semibold disabled:opacity-50"
        >
          {busy === "sync" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Sync now
        </button>
        <button
          onClick={handleDisconnect}
          disabled={busy !== null}
          className="flex items-center justify-center gap-2 p-2.5 rounded-lg hover:bg-status-red/10 text-status-red transition-all text-xs font-semibold disabled:opacity-50"
          title="Disconnect Google Calendar"
        >
          {busy === "disconnect" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Unlink className="w-3.5 h-3.5" />
          )}
          Disconnect
        </button>
      </div>

      {revoked && (
        <button
          onClick={handleConnect}
          disabled={busy === "connect"}
          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-primary-red/10 border border-primary-red/20 text-xs font-bold text-primary-red disabled:opacity-50"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Reconnect
        </button>
      )}
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center gap-2">
      <div className="p-1.5 rounded-lg bg-primary-red/10">
        <Calendar className="w-4 h-4 text-primary-red" />
      </div>
      <div>
        <h3 className="font-bold text-sm text-primary">Google Calendar</h3>
        <p className="text-[10px] text-muted-foreground font-mono">
          Add BH events to your calendar
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "error";
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd
        className={cn(
          "font-mono truncate text-right",
          tone === "error" ? "text-status-red" : "text-primary"
        )}
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}
