"use client";

import React, { useState } from "react";
import { Building2, Globe, MapPin, Hash, Save, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { upsertSponsorProfile } from "@/lib/actions/sponsor-profile";

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
  const [locationInput, setLocationInput] = useState("");
  const [industryInput, setIndustryInput] = useState("");
  const [saving, setSaving] = useState(false);

  const addTag = (list: string[], setter: (v: string[]) => void, input: string, setInput: (v: string) => void) => {
    const val = input.trim();
    if (!val || list.includes(val)) return;
    setter([...list, val]);
    setInput("");
  };

  const removeTag = (list: string[], setter: (v: string[]) => void, index: number) => {
    setter(list.filter((_, i) => i !== index));
  };

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
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface/10 border border-glass">
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
          <Building2 size={14} /> Company Name <span className="text-bh-red-500">*</span>
        </label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Your organization name"
          className="mt-1.5 w-full rounded-xl bg-surface/10 border border-glass px-4 py-2.5 text-sm text-primary placeholder:text-secondary/50 focus:border-bh-red-500/50 focus:outline-none transition-all"
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
          className="mt-1.5 w-full rounded-xl bg-surface/10 border border-glass px-4 py-2.5 text-sm text-primary placeholder:text-secondary/50 focus:border-bh-red-500/50 focus:outline-none transition-all"
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
          className="mt-1.5 w-full rounded-xl bg-surface/10 border border-glass px-4 py-2.5 text-sm text-primary placeholder:text-secondary/50 focus:border-bh-red-500/50 focus:outline-none transition-all"
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
          className="mt-1.5 w-full rounded-xl bg-surface/10 border border-glass px-4 py-2.5 text-sm text-primary placeholder:text-secondary/50 focus:border-bh-red-500/50 focus:outline-none transition-all resize-none"
          maxLength={2000}
        />
        <p className="mt-1 text-[10px] text-secondary/60 text-right">{description.length}/2000</p>
      </div>

      {/* Locations */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
          <MapPin size={14} /> Locations
        </label>
        <div className="flex gap-2 mt-1.5">
          <input
            type="text"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag(locations, setLocations, locationInput, setLocationInput);
              }
            }}
            placeholder="Butwal, Nepal"
            className="flex-1 rounded-xl bg-surface/10 border border-glass px-4 py-2.5 text-sm text-primary placeholder:text-secondary/50 focus:border-bh-red-500/50 focus:outline-none transition-all"
          />
          <button
            type="button"
            onClick={() => addTag(locations, setLocations, locationInput, setLocationInput)}
            className="p-2.5 rounded-xl bg-surface/10 border border-glass text-secondary hover:text-primary hover:bg-surface/10 transition-all"
          >
            <Plus size={18} />
          </button>
        </div>
        {locations.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {locations.map((loc, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface/10 border border-glass text-xs text-secondary">
                <MapPin size={10} />
                {loc}
                <button type="button" onClick={() => removeTag(locations, setLocations, i)} className="text-secondary/50 hover:text-bh-red-500 ml-0.5">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Industries */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
          <Hash size={14} /> Industries
        </label>
        <div className="flex gap-2 mt-1.5">
          <input
            type="text"
            value={industryInput}
            onChange={(e) => setIndustryInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag(industries, setIndustries, industryInput, setIndustryInput);
              }
            }}
            placeholder="EdTech, Fintech, AI..."
            className="flex-1 rounded-xl bg-surface/10 border border-glass px-4 py-2.5 text-sm text-primary placeholder:text-secondary/50 focus:border-bh-red-500/50 focus:outline-none transition-all"
          />
          <button
            type="button"
            onClick={() => addTag(industries, setIndustries, industryInput, setIndustryInput)}
            className="p-2.5 rounded-xl bg-surface/10 border border-glass text-secondary hover:text-primary hover:bg-surface/10 transition-all"
          >
            <Plus size={18} />
          </button>
        </div>
        {industries.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {industries.map((ind, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface/10 border border-glass text-xs text-secondary">
                {ind}
                <button type="button" onClick={() => removeTag(industries, setIndustries, i)} className="text-secondary/50 hover:text-bh-red-500 ml-0.5">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={saving || !companyName.trim()}
        className="inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-8 py-3 text-sm font-bold text-white hover:bg-bh-red-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_16px_-4px_var(--glow-bh-red)]"
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
