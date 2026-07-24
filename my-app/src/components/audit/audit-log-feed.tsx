"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Activity, Clock, ScrollText, ArrowUp } from "lucide-react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface AuditLogEntry {
  id: string;
  actor_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface AuditLogFeedProps {
  initialLogs: AuditLogEntry[];
}

export default function AuditLogFeed({ initialLogs }: AuditLogFeedProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>(initialLogs);
  const [newCount, setNewCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(initialLogs.length);

  // Subscribe to new audit_log INSERT events via Supabase Realtime
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("audit-log-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "audit_logs",
        },
        (payload: RealtimePostgresChangesPayload<AuditLogEntry>) => {
          const newEntry = payload.new as unknown as AuditLogEntry;
          if (!newEntry?.id) return;

          setLogs((prev) => {
            // Avoid duplicates
            if (prev.some((l) => l.id === newEntry.id)) return prev;
            return [newEntry, ...prev].slice(0, 50); // Keep latest 50
          });
          setNewCount((c) => c + 1);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Track log length changes to reset newCount when logs change from props
  useEffect(() => {
    const currLength = logs.length;
    // If logs were replaced by server props (not real-time), reset
    if (currLength < prevLengthRef.current) {
      setNewCount(0);
    }
    prevLengthRef.current = currLength;
  }, [logs.length]);

  const scrollToTop = useCallback(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setNewCount(0);
  }, []);

  return (
    <div className="bh-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-primary-red" />
          <h3 className="text-sm font-bold text-primary">Audit Log</h3>
        </div>
        <Link
          href="/dashboard/maintainer/audit-log"
          className="text-[10px] font-medium text-primary-red hover:underline"
        >
          View all
        </Link>
      </div>

      <div
        ref={containerRef}
        className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar relative"
      >
        {/* New entries banner */}
        {newCount > 0 && (
          <button
            onClick={scrollToTop}
            className="sticky top-0 z-10 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-red/10 text-primary-red text-[10px] font-bold font-mono hover:bg-primary-red/15 transition-colors mb-1"
          >
            <ArrowUp className="w-3 h-3" />
            {newCount} new {newCount === 1 ? "entry" : "entries"}
          </button>
        )}

        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-start gap-3 py-2.5 border-b border-border last:border-0"
          >
            <div className="p-1 rounded-md bg-surface-hover shrink-0">
              <Activity className="w-3 h-3 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-primary leading-relaxed truncate">
                <span className="font-bold">{log.action}</span>
                {log.target_type && (
                  <span className="text-muted-foreground">
                    {" "}
                    on {log.target_type}
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <Clock className="w-2.5 h-2.5 text-muted-foreground/50 shrink-0" />
                <span className="text-[9px] font-mono text-muted-foreground/60">
                  {formatDate(log.created_at)}
                </span>
              </div>
            </div>
          </div>
        ))}

        {logs.length === 0 && (
          <div className="py-6 text-center">
            <p className="text-xs text-muted-foreground">
              No recent audit log entries
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
