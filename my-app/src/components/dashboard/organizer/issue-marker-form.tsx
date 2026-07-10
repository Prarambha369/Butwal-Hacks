"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, AlertCircle, CheckCircle, Loader2, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
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
        <label className="text-xs font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
          <Mail size={14} /> Recipient Email
        </label>
        <input
          name="email"
          type="email"
          required
          placeholder="hacker@example.com"
          className="w-full bg-surface/10 border border-glass rounded-xl px-4 py-3 outline-none focus:ring-2 ring-red-500/50 transition-all text-sm"
          disabled={isSubmitting}
        />
        <p className="text-[10px] opacity-30">
          If this email doesn&apos;t have an account yet, a claim link will be sent.
        </p>
      </div>

      {/* Marker Type */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
          <ShieldCheck size={14} /> Marker Type
        </label>
        <select
          name="type"
          required
          className="w-full bg-surface/10 border border-glass rounded-xl px-4 py-3 outline-none focus:ring-2 ring-red-500/50 transition-all text-sm"
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
        <label className="text-xs font-bold uppercase tracking-widest opacity-40">Marker Title</label>
        <input
          name="title"
          type="text"
          required
          minLength={2}
          placeholder="e.g. Community Pillar, Hackathon Winner, Top Mentor"
          className="w-full bg-surface/10 border border-glass rounded-xl px-4 py-3 outline-none focus:ring-2 ring-red-500/50 transition-all text-sm"
          disabled={isSubmitting}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest opacity-40">
          Description &amp; Justification
        </label>
        <textarea
          name="description"
          required
          minLength={5}
          rows={4}
          className="w-full bg-surface/10 border border-glass rounded-xl px-4 py-3 outline-none focus:ring-2 ring-red-500/50 transition-all text-sm resize-none"
          placeholder="Describe why this marker is being issued and what the recipient did..."
          disabled={isSubmitting}
        />
      </div>

      {/* Result Banner */}
      {result && (
        <div
          className={`flex items-start gap-3 p-4 rounded-xl text-sm ${
            result.success
              ? "bg-green-500/10 border border-green-500/30 text-green-400"
              : "bg-bh-red-500/10 border border-bh-red-500/30 text-bh-red-500"
          }`}
        >
          {result.success ? <CheckCircle size={18} className="mt-0.5 shrink-0" /> : <AlertCircle size={18} className="mt-0.5 shrink-0" />}
          <span>{result.message}</span>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          variant="default"
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
        </Button>
      </div>
    </form>
  );
}
