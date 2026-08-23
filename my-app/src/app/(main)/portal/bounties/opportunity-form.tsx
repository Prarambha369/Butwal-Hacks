"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createOpportunity, updateOpportunity } from "@/lib/actions/sponsor-opportunities";
import { cn } from "@/lib/utils";
import { TagInput } from "@/components/ui/tag-input";

interface OpportunityFormProps {
  initialData?: {
    id: string;
    title: string;
    description: string;
    type: string;
    compensation: string;
    currency: string;
    location: string;
    is_remote: boolean;
    skills_required: string[];
    application_url: string;
    application_deadline: string | null;
    is_bounty: boolean;
    bounty_amount: number | null;
  };
}

const OPPORTUNITY_TYPES = [
  { value: "job", label: "Job" },
  { value: "internship", label: "Internship" },
  { value: "grant", label: "Grant/Scholarship" },
  { value: "bounty", label: "Bounty" },
  { value: "other", label: "Other" },
];

export default function OpportunityForm({ initialData }: OpportunityFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [type, setType] = useState(initialData?.type || "job");
  const [compensation, setCompensation] = useState(initialData?.compensation || "");
  const [currency] = useState(initialData?.currency || "USD");
  const [location, setLocation] = useState(initialData?.location || "");
  const [isRemote, setIsRemote] = useState(initialData?.is_remote || false);
  const [skills, setSkills] = useState<string[]>(initialData?.skills_required || []);
  const [applicationUrl, setApplicationUrl] = useState(initialData?.application_url || "");
  const [deadline, setDeadline] = useState(initialData?.application_deadline?.split("T")[0] || "");
  const [isBounty, setIsBounty] = useState(initialData?.is_bounty || false);
  const [bountyAmount, setBountyAmount] = useState(initialData?.bounty_amount?.toString() || "");
  const [saving, setSaving] = useState(false);

  // ponytail: sync is_bounty when type changes
  useEffect(() => {
    setIsBounty(type === "bounty");
  }, [type]);

  // ponytail: addSkill/removeSkill now lives in shared TagInput component

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (description.trim().length < 10) { toast.error("Description must be at least 10 characters"); return; }

    setSaving(true);
    const payload = {
      title: title.trim(),
      description: description.trim(),
      type: type as "job" | "internship" | "grant" | "bounty" | "other",
      compensation: compensation.trim() || undefined,
      currency,
      location: location.trim() || undefined,
      is_remote: isRemote,
      skills_required: skills,
      application_url: applicationUrl.trim() || undefined,
      application_deadline: deadline || undefined,
      is_bounty: isBounty,
      bounty_amount: isBounty && bountyAmount ? parseFloat(bountyAmount) : undefined,
    };

    try {
      const result = isEditing && initialData
        ? await updateOpportunity(initialData.id, payload)
        : await createOpportunity(payload);

      if (result.success) {
        toast.success(isEditing ? "Opportunity updated!" : "Opportunity created!");
        router.push("/portal/bounties");
      } else {
        toast.error(result.error || "Failed to save");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bh-card p-6 space-y-6">
      {/* Title */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-secondary">Title <span className="text-primary-red">*</span></label>
        <input
          type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Full-Stack Developer Intern"
          className="mt-1.5 w-full rounded-xl bg-background/50 border border-border px-4 py-2.5 text-sm text-primary placeholder:text-secondary/40 focus:border-bh-red-500/50 focus:outline-none transition-all"
          maxLength={200} required
        />
      </div>

      {/* Type + Bounty toggle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-secondary">Type</label>
          <div className="mt-1.5 flex gap-1.5 flex-wrap">
            {OPPORTUNITY_TYPES.map((t) => (
              <button
                key={t.value} type="button" onClick={() => setType(t.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                  type === t.value
                    ? "border-bh-red-500/50 bg-primary-red/10 text-primary-red"
                    : "border-border bg-surface/10 text-secondary hover:text-primary"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {type === "bounty" && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1">
                Bounty Amount ($)
              </label>
              <input
                type="number" value={bountyAmount} onChange={(e) => setBountyAmount(e.target.value)}
                placeholder="500"
                className="mt-1.5 w-full rounded-xl bg-background/50 border border-border px-4 py-2.5 text-sm text-primary placeholder:text-secondary/40 focus:border-bh-red-500/50 focus:outline-none transition-all"
                min={0} step={0.01}
              />
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox" id="isRemote" checked={isRemote}
              onChange={(e) => setIsRemote(e.target.checked)}
              className="rounded border-border bg-surface/10 accent-bh-red-500"
            />
            <label htmlFor="isRemote" className="text-xs text-secondary">Remote / Work from anywhere</label>
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-secondary">Description <span className="text-primary-red">*</span></label>
        <textarea
          value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the role, responsibilities, what you're looking for..."
          rows={5}
          className="mt-1.5 w-full rounded-xl bg-background/50 border border-border px-4 py-3 text-sm text-primary placeholder:text-secondary/40 focus:border-bh-red-500/50 focus:outline-none transition-all resize-none"
          maxLength={5000} required
        />
        <p className="mt-1 text-[10px] text-secondary/60 text-right">{description.length}/5000</p>
      </div>

      {/* Compensation + Location */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-secondary">Compensation</label>
          <input
            type="text" value={compensation} onChange={(e) => setCompensation(e.target.value)}
            placeholder="e.g., $2000/month"
            className="mt-1.5 w-full rounded-xl bg-background/50 border border-border px-4 py-2.5 text-sm text-primary placeholder:text-secondary/40 focus:border-bh-red-500/50 focus:outline-none transition-all"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-secondary">Location</label>
          <input
            type="text" value={location} onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Butwal, Nepal"
            className="mt-1.5 w-full rounded-xl bg-background/50 border border-border px-4 py-2.5 text-sm text-primary placeholder:text-secondary/40 focus:border-bh-red-500/50 focus:outline-none transition-all"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-secondary">Deadline</label>
          <input
            type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
            className="mt-1.5 w-full rounded-xl bg-background/50 border border-border px-4 py-2.5 text-sm text-primary focus:border-bh-red-500/50 focus:outline-none transition-all"
          />
        </div>
      </div>

      <TagInput
        tags={skills}
        setTags={setSkills}
        label="Skills Required"
        placeholder="React, Python, SQL..."
      />

      {/* Application URL */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-secondary">Application URL</label>
        <input
          type="url" value={applicationUrl} onChange={(e) => setApplicationUrl(e.target.value)}
          placeholder="https://your-company.com/apply"
          className="mt-1.5 w-full rounded-xl bg-background/50 border border-border px-4 py-2.5 text-sm text-primary placeholder:text-secondary/40 focus:border-bh-red-500/50 focus:outline-none transition-all"
        />
        <p className="mt-1 text-[10px] text-secondary/60">Leave blank to accept applications directly on Butwal Hacks</p>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className={`inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-8 py-3 text-sm font-bold text-white hover:bg-deep-red transition-all ${saving ? 'bh-btn-disabled' : ''}`}
        >
          {saving ? (
            <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Saving...</>
          ) : (
            isEditing ? "Update Opportunity" : "Create Opportunity"
          )}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 rounded-full text-sm text-secondary hover:text-primary transition-all"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
