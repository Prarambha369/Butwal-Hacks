"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, X } from "lucide-react";
import { toast } from "sonner";

import { RoseSpinner } from "@/components/ui/rose-loader";
import { useAuthUser } from "@/components/auth-user-provider";

interface Props {
  projectId: string;
  eventId?: string | null;
}

/**
 * "Report this project" — the in-app door into the reporting procedure.
 *
 * The wording is deliberately careful: filing a report is not an accusation
 * and it is not a verdict. See `policies/CHEATING_RESPONSE.md`.
 *
 * The form needs an account, so a signed-out visitor is sent to sign in
 * rather than being shown a dialog that would fail. The channel that needs
 * no account is email: conduct@butwalhacks.com.
 */
export default function ReportProjectButton({ projectId, eventId }: Props) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthUser();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<"cheating" | "code_of_conduct" | "other">("cheating");
  const [details, setDetails] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const openDialog = () => {
    if (authLoading) return;
    if (!user) {
      router.push("/sign-in?returnTo=" + encodeURIComponent(window.location.pathname));
      return;
    }
    setOpen(true);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          details,
          project_id: projectId,
          event_id: eventId ?? undefined,
          anonymous,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Could not file the report");
        return;
      }

      toast.success(data.message, { duration: 8000 });
      setOpen(false);
      setDetails("");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
      >
        <Flag className="w-3.5 h-3.5" />
        Report this project
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-dialog-title"
            className="bg-background border border-border rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="report-dialog-title" className="text-xl font-bold text-primary">
                  Report a concern
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Reports are handled discreetly and are not published. Filing one is not an
                  accusation — it asks us to take a look.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-surface-hover transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                What is this about?
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof category)}
                className="w-full bg-surface-hover border border-border rounded-lg px-4 py-3 text-primary focus:ring-2 focus:ring-primary-red focus:outline-none transition-all"
              >
                <option value="cheating">Suspected cheating</option>
                <option value="code_of_conduct">Code of conduct concern</option>
                <option value="other">Something else</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                What did you notice?
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={5}
                placeholder="What looks wrong, and what makes you think so?"
                className="w-full bg-surface-hover border border-border rounded-lg px-4 py-3 text-primary focus:ring-2 focus:ring-primary-red focus:outline-none transition-all"
              />
              <p className="text-[11px] text-muted-foreground">
                You do not need to be certain, and you do not need proof. What you noticed, and
                when, is enough.
              </p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border accent-primary-red"
              />
              <span className="text-sm text-secondary leading-relaxed">
                File this anonymously. We will store no reference to you — only the report.
              </span>
            </label>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 px-4 py-3 rounded-lg bg-surface-hover border border-border hover:border-primary-red/40 transition-all text-sm font-bold text-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={submitting || details.trim().length < 20}
                className="flex-1 px-4 py-3 rounded-lg bg-bh-red-action hover:bg-primary-red text-white transition-all text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? <RoseSpinner size="sm" /> : null}
                File the report
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
