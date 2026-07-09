"use client";

import React, { useState } from "react";
import { Building2, Globe, MapPin, Hash, Save } from "lucide-react";
import { toast } from "sonner";
import { upsertSponsorProfile } from "@/lib/actions/sponsor-profile";
import { TagInput } from "@/components/ui/tag-input";

interface InitialData {
  companyName: string;
  companyWebsite: string;
  companyLogoUrl: string;
  description: string;
  locations: string[];
  industries: string[];
}

export default function SponsorCompanyForm({
  initialData,
  hasExistingProfile,
}: {
  initialData: InitialData;
  hasExistingProfile: boolean;
}) {
  const [companyName, setCompanyName] = useState(initialData.companyName);
  const [companyWebsite, setCompanyWebsite] = useState(initialData.companyWebsite);
  const [companyLogoUrl, setCompanyLogoUrl] = useState(initialData.companyLogoUrl);
  const [description, setDescription] = useState(initialData.description);
  const [locations, setLocations] = useState<string[]>(initialData.locations);
  const [industries, setIndustries] = useState<string[]>(initialData.industries);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.error("Company name is required");
      return;
    }

    setSaving(true);
    try {
      const result = await upsertSponsorProfile({
        companyName: companyName.trim(),
        companyWebsite: companyWebsite.trim() || undefined,
        companyLogoUrl: companyLogoUrl.trim() || undefined,
        description: description.trim() || undefined,
        locations,
        industries,
      });
      if (result.success) {
        toast.success("Company profile saved!");
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Logo preview */}
      {companyLogoUrl && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-surface/10 border border-border">
          <div className="w-16 h-16 rounded-xl bg-surface/20 flex items-center justify-center overflow-hidden">
            {companyLogoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={companyLogoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Building2 size={24} className="text-secondary" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-primary">Current Logo</p>
            <p className="text-xs text-secondary">{companyLogoUrl ? "Custom logo set" : "No logo"}</p>
          </div>
        </div>
      )}

      {/* Company name */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
          <Building2 size={14} /> Company Name <span className="text-primary-red">*</span>
        </label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Your organization name"
          className="mt-1.5 w-full rounded-xl bg-surface/10 border border-border px-4 py-2.5 text-sm text-primary placeholder:text-secondary/50 focus:border-bh-red-500/50 focus:outline-none transition-all"
          maxLength={200}
          required
        />
      </div>

      {/* Company website */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
          <Globe size={14} /> Website
        </label>
        <input
          type="url"
          value={companyWebsite}
          onChange={(e) => setCompanyWebsite(e.target.value)}
          placeholder="https://your-company.com"
          className="mt-1.5 w-full rounded-xl bg-surface/10 border border-border px-4 py-2.5 text-sm text-primary placeholder:text-secondary/50 focus:border-bh-red-500/50 focus:outline-none transition-all"
          maxLength={2048}
        />
      </div>

      {/* Logo URL */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
          <Building2 size={14} /> Logo URL
        </label>
        <input
          type="url"
          value={companyLogoUrl}
          onChange={(e) => setCompanyLogoUrl(e.target.value)}
          placeholder="https://res.cloudinary.com/.../logo.png"
          className="mt-1.5 w-full rounded-xl bg-surface/10 border border-border px-4 py-2.5 text-sm text-primary placeholder:text-secondary/50 focus:border-bh-red-500/50 focus:outline-none transition-all"
          maxLength={2048}
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-secondary">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell hackers about your company, mission, and what kind of talent you're looking for..."
          rows={4}
          className="mt-1.5 w-full rounded-xl bg-surface/10 border border-border px-4 py-2.5 text-sm text-primary placeholder:text-secondary/50 focus:border-bh-red-500/50 focus:outline-none transition-all resize-none"
          maxLength={2000}
        />
        <p className="mt-1 text-[10px] text-secondary/60 text-right">{description.length}/2000</p>
      </div>

      <TagInput
        tags={locations}
        setTags={setLocations}
        label="Locations"
        placeholder="Butwal, Nepal"
        icon={<MapPin size={14} />}
      />

      <TagInput
        tags={industries}
        setTags={setIndustries}
        label="Industries"
        placeholder="EdTech, Fintech, AI..."
        icon={<Hash size={14} />}
      />

      {/* Submit */}
      <button
        type="submit"
        disabled={saving || !companyName.trim()}
        className="inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-8 py-3 text-sm font-bold text-white hover:bg-deep-red transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_16px_-4px_var(--glow-bh-red)]"
      >
        {saving ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Saving...
          </>
        ) : (
          <>
            <Save size={16} />
            {hasExistingProfile ? "Update Profile" : "Create Profile"}
          </>
        )}
      </button>
    </form>
  );
}
