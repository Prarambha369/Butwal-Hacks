"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ScrollText,
  Search,
  ChevronLeft,
  ChevronRight,
  Star,
  Code2,
  ShieldCheck,
  Users,
  Gift,
  UserPlus,
  UserMinus,
  RotateCcw,
  XCircle,
  ExternalLink,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AuditEntry {
  id: string;
  created_at: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  actor_name: string | null;
  actor_avatar: string | null;
  actor_bh_id: string | null;
}

interface AuditLogPanelProps {
  entries: AuditEntry[];
  total: number;
  page: number;
  pageSize: number;
}

/** Human-readable label + icon for each action type. */
const ACTION_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  XP_AWARDED: {
    label: "XP Awarded",
    icon: <Star className="w-3.5 h-3.5" />,
    color: "text-status-yellow",
  },
  PROJECT_SUBMITTED: {
    label: "Project Submitted",
    icon: <Code2 className="w-3.5 h-3.5" />,
    color: "text-accent-teal",
  },
  BADGE_EARNED: {
    label: "Trust Marker Issued",
    icon: <ShieldCheck className="w-3.5 h-3.5" />,
    color: "text-primary-red",
  },
  TEAM_JOINED: {
    label: "Team Joined",
    icon: <Users className="w-3.5 h-3.5" />,
    color: "text-accent-teal",
  },
  REWARD_REDEEMED: {
    label: "Reward Redeemed",
    icon: <Gift className="w-3.5 h-3.5" />,
    color: "text-accent-pink",
  },
  MARKER_REVOKED: {
    label: "Marker Revoked",
    icon: <XCircle className="w-3.5 h-3.5" />,
    color: "text-primary-red",
  },
  MARKER_REINSTATED: {
    label: "Marker Reinstated",
    icon: <RotateCcw className="w-3.5 h-3.5" />,
    color: "text-status-green",
  },
  USER_CREATED: {
    label: "User Created",
    icon: <UserPlus className="w-3.5 h-3.5" />,
    color: "text-accent-teal",
  },
  USER_SUSPENDED: {
    label: "User Suspended",
    icon: <UserMinus className="w-3.5 h-3.5" />,
    color: "text-primary-red",
  },
};

function getActionMeta(action: string) {
  return ACTION_META[action] ?? {
    label: action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    icon: <FileText className="w-3.5 h-3.5" />,
    color: "text-muted-foreground",
  };
}

/** Format metadata as readable detail lines, filtering out null/empty values. */
function formatMetadata(meta: Record<string, unknown> | null): string[] {
  if (!meta) return [];
  return Object.entries(meta)
    .filter(([, v]) => v != null && v !== "" && v !== "undefined")
    .map(([k, v]) => {
      const label = k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const value = typeof v === "object" ? JSON.stringify(v) : String(v);
      return `${label}: ${value}`;
    });
}

export default function AuditLogPanel({ entries, total, page, pageSize }: AuditLogPanelProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / pageSize);

  // Collect unique action types for the filter dropdown
  const actionTypes = Array.from(new Set(entries.map((e) => e.action))).sort();

  // Filter entries by search term
  let filtered = entries;
  if (search.trim()) {
    const term = search.toLowerCase();
    filtered = entries.filter(
      (e) =>
        e.actor_name?.toLowerCase().includes(term) ||
        e.actor_bh_id?.toLowerCase().includes(term) ||
        e.action.toLowerCase().includes(term) ||
        e.target_type?.toLowerCase().includes(term) ||
        e.target_id?.toLowerCase().includes(term),
    );
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by actor name, BH-ID, or action..."
            className="bh-input pl-9"
            aria-label="Search audit log entries"
          />
        </div>
        <div className="relative">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              if (e.target.value !== "all") {
                const params = new URLSearchParams();
                params.set("action", e.target.value);
                params.set("p", "1");
                router.push(`/dashboard/maintainer/audit-log?${params.toString()}`);
              } else {
                router.push(`/dashboard/maintainer/audit-log`);
              }
            }}
            className="bh-select min-w-[160px]"
            aria-label="Filter by action type"
          >
            <option value="all">All Actions</option>
            {actionTypes.map((type) => {
              const meta = getActionMeta(type);
              return (
                <option key={type} value={type}>
                  {meta.label}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Entry count */}
      <p className="text-xs text-muted-foreground">
        Showing {filtered.length > 0 ? `${(page - 1) * pageSize + 1}–${Math.min((page - 1) * pageSize + filtered.length, page * pageSize)}` : "0"}{" "}
        of {total} entries
      </p>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bh-card p-12 text-center">
          <div className="inline-flex p-3 rounded-lg bg-surface-hover mb-4">
            <ScrollText className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-bold text-primary">No audit entries found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {search ? "Try a different search term" : "No activity has been logged yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => {
            const meta = getActionMeta(entry.action);
            const details = formatMetadata(entry.metadata);
            const isExpanded = expandedId === entry.id;

            return (
              <div
                key={entry.id}
                className={cn(
                  "bh-card transition-all",
                  isExpanded ? "border-bh-red-500/30" : "border-border hover:border-border/80"
                )}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  className="w-full text-left p-4 flex items-center gap-4"
                >
                  {/* Action icon */}
                  <div className={cn("p-2 rounded-lg bg-surface-hover shrink-0", meta.color)}>
                    {meta.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-primary">
                        {entry.actor_name || "System"}
                      </span>
                      {entry.actor_bh_id && (
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {entry.actor_bh_id}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className={cn("text-xs font-bold", meta.color)}>{meta.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(entry.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {/* Chevron */}
                  <ChevronRight
                    className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform shrink-0",
                      isExpanded && "rotate-90"
                    )}
                  />
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-border/50 space-y-3">
                    {/* Metadata key-values */}
                    {details.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {details.map((line, i) => (
                          <p key={i} className="text-[11px] font-mono text-muted-foreground leading-relaxed">
                            {line}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Links to target */}
                    {entry.target_type === "profile" && entry.target_id && (
                      <Link
                        href={`/p/${entry.target_id}`}
                        className="inline-flex items-center gap-1 text-[11px] text-primary-red hover:text-primary-red transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View profile
                      </Link>
                    )}
                    {entry.target_type === "project" && entry.target_id && (
                      <Link
                        href={`/projects/${entry.target_id}`}
                        className="inline-flex items-center gap-1 text-[11px] text-primary-red hover:text-primary-red transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View project
                      </Link>
                    )}

                    {/* Raw metadata fallback */}
                    {entry.metadata && (
                      <details className="group">
                        <summary className="text-[10px] font-mono text-muted-foreground cursor-pointer hover:text-primary transition-colors">
                          Raw payload
                        </summary>
                        <pre className="mt-1 p-2 rounded-lg bg-surface-hover text-[9px] font-mono text-muted-foreground overflow-auto max-h-32">
                          {JSON.stringify(entry.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <Link
            href={
              page > 1
                ? `/dashboard/maintainer/audit-log?p=${page - 1}${actionFilter !== "all" ? `&action=${actionFilter}` : ""}`
                : "#"
            }
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all border",
              page > 1
                ? "bg-surface-hover border-border text-primary hover:bg-border"
                : "bg-surface-hover border-border text-muted-foreground/40 cursor-not-allowed"
            )}
            aria-disabled={page <= 1}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </Link>

          <div className="flex items-center gap-1.5">
            {generatePageNumbers(page, totalPages).map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="text-xs text-muted-foreground/40 px-1">
                  ...
                </span>
              ) : (
                <Link
                  key={p}
                  href={`/dashboard/maintainer/audit-log?p=${p}${actionFilter !== "all" ? `&action=${actionFilter}` : ""}`}
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all border",
                    p === page
                      ? "bg-bh-red-500 border-primary-red text-white"
                      : "bg-surface-hover border-border text-muted-foreground hover:bg-border"
                  )}
                >
                  {p}
                </Link>
              ),
            )}
          </div>

          <Link
            href={
              page < totalPages
                ? `/dashboard/maintainer/audit-log?p=${page + 1}${actionFilter !== "all" ? `&action=${actionFilter}` : ""}`
                : "#"
            }
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all border",
              page < totalPages
                ? "bg-surface-hover border-border text-primary hover:bg-border"
                : "bg-surface-hover border-border text-muted-foreground/40 cursor-not-allowed"
            )}
            aria-disabled={page >= totalPages}
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

/** Generate pagination number array with ellipsis gaps. */
function generatePageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [];

  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, "...", total);
  } else if (current >= total - 3) {
    pages.push(1, "...", total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, "...", current - 1, current, current + 1, "...", total);
  }

  return pages;
}
