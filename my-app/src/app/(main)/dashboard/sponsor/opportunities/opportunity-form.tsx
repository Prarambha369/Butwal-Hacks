"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createOpportunity, updateOpportunity } from "@/lib/actions/sponsor-opportunities";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [currency, setCurrency] = useState(initialData?.currency || "USD");
  const [location, setLocation] = useState(initialData?.location || "");
  const [isRemote, setIsRemote] = useState(initialData?.is_remote || false);
  const [skills, setSkills] = useState<string[]>(initialData?.skills_required || []);
  const [skillInput, setSkillInput] = useState("");
  const [applicationUrl, setApplicationUrl] = useState(initialData?.application_url || "");
  const [deadline, setDeadline] = useState(initialData?.application_deadline?.split("T")[0] || "");
  const [isBounty, setIsBounty] = useState(initialData?.is_bounty || false);
  const [bountyAmount, setBountyAmount] = useState(initialData?.bounty_amount?.toString() || "");
  const [saving, setSaving] = useState(false);

  // ponytail: sync is_bounty when type changes
  useEffect(() => {
    setIsBounty(type === "bounty");
  }, [type]);

  const addSkill = () => {
    const val = skillInput.trim();
    if (!val || skills.includes(val)) return;
    setSkills([...skills, val]);
    setSkillInput("");
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

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
        router.push("/dashboard/sponsor/opportunities");
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
    <form onSubmit={handleSubmit} className="lg-surface rounded-2xl border border-glass p-6 space-y-6">
      {/* Title */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-secondary">Title <span className="text-bh-red-500">*</span></label>
        <input
          type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Full-Stack Developer Intern"
          className="mt-1.5 w-full rounded-xl bg-bg-base/50 border border-glass px-4 py-2.5 text-sm text-primary placeholder:text-secondary/40 focus:border-bh-red-500/50 focus:outline-none transition-all"
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
                    ? "border-bh-red-500/50 bg-bh-red-500/10 text-bh-red-500"
                    : "border-glass bg-surface/10 text-secondary hover:text-primary"
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
                className="mt-1.5 w-full rounded-xl bg-bg-base/50 border border-glass px-4 py-2.5 text-sm text-primary placeholder:text-secondary/40 focus:border-bh-red-500/50 focus:outline-none transition-all"
                min={0} step={0.01}
              />
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox" id="isRemote" checked={isRemote}
              onChange={(e) => setIsRemote(e.target.checked)}
              className="rounded border-glass bg-surface/10 accent-bh-red-500"
            />
            <label htmlFor="isRemote" className="text-xs text-secondary">Remote / Work from anywhere</label>
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-secondary">Description <span className="text-bh-red-500">*</span></label>
        <textarea
          value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the role, responsibilities, what you're looking for..."
          rows={5}
          className="mt-1.5 w-full rounded-xl bg-bg-base/50 border border-glass px-4 py-3 text-sm text-primary placeholder:text-secondary/40 focus:border-bh-red-500/50 focus:outline-none transition-all resize-none"
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
            className="mt-1.5 w-full rounded-xl bg-bg-base/50 border border-glass px-4 py-2.5 text-sm text-primary placeholder:text-secondary/40 focus:border-bh-red-500/50 focus:outline-none transition-all"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-secondary">Location</label>
          <input
            type="text" value={location} onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Butwal, Nepal"
            className="mt-1.5 w-full rounded-xl bg-bg-base/50 border border-glass px-4 py-2.5 text-sm text-primary placeholder:text-secondary/40 focus:border-bh-red-500/50 focus:outline-none transition-all"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-secondary">Deadline</label>
          <input
            type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
            className="mt-1.5 w-full rounded-xl bg-bg-base/50 border border-glass px-4 py-2.5 text-sm text-primary focus:border-bh-red-500/50 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Skills */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-secondary">Skills Required</label>
        <div className="flex gap-2 mt-1.5">
          <input
            type="text" value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
            placeholder="React, Python, SQL..."
            className="flex-1 rounded-xl bg-bg-base/50 border border-glass px-4 py-2.5 text-sm text-primary placeholder:text-secondary/40 focus:border-bh-red-500/50 focus:outline-none transition-all"
          />
          <button type="button" onClick={addSkill} className="p-2.5 rounded-xl bg-surface/10 border border-glass text-secondary hover:text-primary transition-all">
            <Plus size={18} />
          </button>
        </div>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {skills.map((skill, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface/10 border border-glass text-[11px] text-secondary">
                {skill}
                <button type="button" onClick={() => removeSkill(i)} className="text-secondary/50 hover:text-bh-red-500">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Application URL */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-secondary">Application URL</label>
        <input
          type="url" value={applicationUrl} onChange={(e) => setApplicationUrl(e.target.value)}
          placeholder="https://your-company.com/apply"
          className="mt-1.5 w-full rounded-xl bg-bg-base/50 border border-glass px-4 py-2.5 text-sm text-primary placeholder:text-secondary/40 focus:border-bh-red-500/50 focus:outline-none transition-all"
        />
        <p className="mt-1 text-[10px] text-secondary/60">Leave blank to accept applications directly on Butwal Hacks</p>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-8 py-3 text-sm font-bold text-white hover:bg-bh-red-600 transition-all disabled:opacity-40 shadow-[0_4px_16px_-4px_var(--glow-bh-red)]"
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
