"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

import { RoseSpinner } from "@/components/ui/rose-loader";

export interface ConductReport {
  id: string;
  category: "code_of_conduct" | "cheating" | "other";
  details: string;
  status: "open" | "under_review" | "resolved" | "dismissed";
  resolution: string | null;
  created_at: string;
  project_id: string | null;
  event_id: string | null;
  reporter_anonymous: boolean;
}

const STATUS_STYLES: Record<ConductReport["status"], string> = {
  open: "bg-status-orange/15 text-status-orange border-status-orange/30",
  under_review: "bg-status-blue/15 text-status-blue border-status-blue/30",
  resolved: "bg-status-green/15 text-status-green border-status-green/30",
  dismissed: "bg-surface-hover text-muted-foreground border-border",
};

const STATUS_LABELS: Record<ConductReport["status"], string> = {
  open: "Open",
  under_review: "Under review",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

const CATEGORY_LABELS: Record<ConductReport["category"], string> = {
  code_of_conduct: "Code of conduct",
  cheating: "Suspected cheating",
  other: "Other",
};

/**
 * The maintainer queue for conduct and cheating reports.
 *
 * A report is a request for a look, not a verdict. Closing one requires a
 * written resolution, because "we looked and did nothing" and "we looked
 * and did something" are very different things to read three months later.
 */
export default function ReportsPanel({ reports }: { reports: ConductReport[] }) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);
  const [resolutions, setResolutions] = useState<Record<string, string>>({});

  const update = async (id: string, status: ConductReport["status"]) => {
    const resolution = resolutions[id]?.trim();
    if ((status === "resolved" || status === "dismissed") && !resolution) {
      toast.error("Write down what was decided before closing the report");
      return;
    }

    setUpdating(id);
    try {
      const res = await fetch("/api/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, resolution: resolution || undefined }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Could not update the report");
        return;
      }

      toast.success("Report updated");
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setUpdating(null);
    }
  };

  if (reports.length === 0) {
    return (
      <div className="bh-card p-12 text-center">
        <ShieldAlert className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          No reports have been filed. That is a good sign.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <div key={report.id} className="bh-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-widest text-primary-red">
                {CATEGORY_LABELS[report.category]}
              </span>
              <span
                className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${STATUS_STYLES[report.status]}`}
              >
                {STATUS_LABELS[report.status]}
              </span>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">
              {new Date(report.created_at).toLocaleString()}
            </span>
          </div>

          <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">
            {report.details}
          </p>

          <div className="flex flex-wrap gap-4 text-[11px] font-mono text-muted-foreground">
            <span>ref: {report.id.slice(0, 8)}</span>
            {report.project_id && <span>project: {report.project_id.slice(0, 8)}</span>}
            {report.event_id && <span>event: {report.event_id.slice(0, 8)}</span>}
            <span>{report.reporter_anonymous ? "reporter: anonymous" : "reporter: known"}</span>
          </div>

          {report.resolution && (
            <div className="rounded-lg border border-border bg-surface-hover p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                Resolution
              </p>
              <p className="text-sm text-secondary whitespace-pre-wrap">{report.resolution}</p>
            </div>
          )}

          {report.status !== "resolved" && report.status !== "dismissed" && (
            <div className="space-y-3 border-t border-border pt-4">
              <textarea
                value={resolutions[report.id] ?? ""}
                onChange={(e) =>
                  setResolutions((prev) => ({ ...prev, [report.id]: e.target.value }))
                }
                rows={2}
                placeholder="What was decided, and why. Required to close the report."
                className="w-full bg-surface-hover border border-border rounded-lg px-4 py-3 text-sm text-primary focus:ring-2 focus:ring-primary-red focus:outline-none transition-all"
              />
              <div className="flex flex-wrap gap-2">
                {report.status === "open" && (
                  <button
                    type="button"
                    onClick={() => update(report.id, "under_review")}
                    disabled={updating === report.id}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-hover border border-border text-xs font-bold text-secondary hover:border-primary-red/40 transition-all disabled:opacity-50"
                  >
                    <Clock className="w-3.5 h-3.5" /> Mark under review
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => update(report.id, "resolved")}
                  disabled={updating === report.id}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-status-green/15 border border-status-green/30 text-xs font-bold text-status-green transition-all disabled:opacity-50"
                >
                  {updating === report.id ? <RoseSpinner size="sm" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Resolve
                </button>
                <button
                  type="button"
                  onClick={() => update(report.id, "dismissed")}
                  disabled={updating === report.id}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-hover border border-border text-xs font-bold text-muted-foreground hover:border-primary-red/40 transition-all disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" /> Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
