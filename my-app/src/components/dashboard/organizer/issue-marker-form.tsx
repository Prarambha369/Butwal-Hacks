"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, AlertCircle, CheckCircle, Loader2, Mail, ShieldCheck } from "lucide-react";

import { toast } from "sonner";
import { issueTrustMarker } from "@/lib/actions/issue-marker";

export function IssueMarkerForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const type = formData.get("type") as string;

    const res = await issueTrustMarker({ email, title, description, type });

    if (res.success) {
      setResult({ success: true, message: res.message || "Marker issued successfully!" });
      toast.success(res.message || "Marker issued successfully!");
      router.refresh();
    } else {
      setResult({ success: false, message: res.error || "Failed to issue marker." });
    }

    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email Field */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Mail size={14} /> Recipient Email
        </label>
        <input
          name="email"
          type="email"
          required
          placeholder="hacker@example.com"
          className="bh-input"
          disabled={isSubmitting}
        />
        <p className="text-[10px] text-muted-foreground">
          If this email doesn&apos;t have an account yet, a claim link will be sent.
        </p>
      </div>

      {/* Marker Type */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <ShieldCheck size={14} /> Marker Type
        </label>
        <select
          name="type"
          required
          className="bh-select"
          disabled={isSubmitting}
        >
          <option value="achievement">Achievement</option>
          <option value="verification">Verification</option>
          <option value="special_recognition">Special Recognition</option>
          <option value="role_based">Role-Based Marker</option>
          <option value="participation">Participation</option>
        </select>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Marker Title</label>
        <input
          name="title"
          type="text"
          required
          minLength={2}
          placeholder="e.g. Community Pillar, Hackathon Winner, Top Mentor"
          className="bh-input"
          disabled={isSubmitting}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Description &amp; Justification
        </label>
        <textarea
          name="description"
          required
          minLength={5}
          rows={4}
          className="bh-textarea"
          placeholder="Describe why this marker is being issued and what the recipient did..."
          disabled={isSubmitting}
        />
      </div>

      {/* Result Banner */}
      {result && (
        <div
          className={`flex items-start gap-3 p-4 rounded-lg text-sm ${
            result.success
              ? "bg-status-green/10 border border-status-green/30 text-status-green"
              : "bg-primary-red/10 border border-primary-red/30 text-primary-red"
          }`}
        >
          {result.success ? <CheckCircle size={18} className="mt-0.5 shrink-0" /> : <AlertCircle size={18} className="mt-0.5 shrink-0" />}
          <span>{result.message}</span>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end pt-4">          <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-bh-red-500 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-deep-red disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Issuing...
            </>
          ) : (
            <>
              <Save size={18} />
              Issue Marker
            </>
          )}
        </button>
      </div>
    </form>
  );
}
