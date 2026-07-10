"use client";

import { useState } from "react";
import { Briefcase, EyeOff, Eye, Trash2, Edit3, ExternalLink, Clock, MapPin, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { toggleOpportunity, deleteOpportunity } from "@/lib/actions/sponsor-opportunities";
import { cn } from "@/lib/utils";

type Opportunity = {
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
  is_active: boolean;
  is_bounty: boolean;
  bounty_amount: number | null;
  created_at: string;
};

const TYPE_COLORS: Record<string, string> = {
  job: "bg-status-blue/20 text-status-blue border border-status-blue/30",
  internship: "bg-status-green/20 text-status-green border border-status-green/30",
  grant: "bg-status-teal/20 text-status-teal border border-status-teal/30",
  bounty: "bg-status-yellow/20 text-status-yellow border border-status-yellow/30",
  other: "bg-surface/20 text-secondary border border-glass",
};

type SortKey = "created_at" | "type" | "title";

export default function OpportunitiesManager({ opportunities }: { opportunities: Opportunity[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [filterType, setFilterType] = useState<string>("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = opportunities
    .filter((o) => filterType === "all" || o.type === filterType)
    .sort((a, b) => {
      if (sortKey === "created_at") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortKey === "title") return a.title.localeCompare(b.title);
      return a.type.localeCompare(b.type);
    });

  const handleToggle = async (id: string) => {
    setLoadingId(id);
    const result = await toggleOpportunity(id);
    if (result.success) {
      toast.success(result.is_active ? "Opportunity activated" : "Opportunity deactivated");
    } else {
      toast.error(result.error || "Failed to toggle");
    }
    setLoadingId(null);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setLoadingId(id);
    const result = await deleteOpportunity(id);
    if (result.success) {
      toast.success("Opportunity deleted");
    } else {
      toast.error(result.error || "Failed to delete");
    }
    setLoadingId(null);
  };

  if (opportunities.length === 0) {
    return (
      <div className="lg-surface rounded-2xl border border-glass p-12 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-surface/10 flex items-center justify-center mb-4">
          <Briefcase size={28} className="text-secondary" />
        </div>
        <h3 className="text-base font-bold text-primary mb-1">No opportunities yet</h3>
        <p className="text-sm text-secondary max-w-sm mx-auto">
          Create your first opportunity to attract hackers, interns, and bounty hunters.
        </p>
        <a
          href="/dashboard/sponsor/opportunities/new"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-bh-red-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-bh-red-600 transition-all"
        >
          Create Opportunity
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5 bg-surface/10 rounded-xl p-1 border border-glass">
          {["all", "job", "internship", "grant", "bounty", "other"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
                filterType === type ? "bg-bh-red-500/20 text-bh-red-500" : "text-secondary hover:text-primary"
              )}
            >
              {type}
            </button>
          ))}
        </div>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="bg-surface/10 border border-glass rounded-xl px-3 py-1.5 text-xs text-secondary focus:outline-none"
        >
          <option value="created_at">Newest</option>
          <option value="type">Type</option>
          <option value="title">Title</option>
        </select>
      </div>

      {/* List */}
      {filtered.map((opp) => (
        <div
          key={opp.id}
          className={cn(
            "lg-surface rounded-2xl border p-5 transition-all",
            opp.is_active ? "border-glass" : "border-glass/30 opacity-60"
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold uppercase", TYPE_COLORS[opp.type])}>
                  {opp.type}
                </span>
                {opp.is_bounty && opp.bounty_amount && (
                  <span className="px-2 py-0.5 rounded-md bg-status-yellow/20 text-status-yellow border border-status-yellow/30 text-[10px] font-bold">
                    ${opp.bounty_amount}
                  </span>
                )}
                {opp.is_remote && (
                  <span className="text-[10px] text-secondary/60">🌐 Remote</span>
                )}
              </div>

              <h3 className="text-base font-bold text-primary">{opp.title}</h3>
              <p className="text-xs text-secondary line-clamp-2">{opp.description}</p>

              {opp.skills_required.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {opp.skills_required.slice(0, 5).map((skill) => (
                    <span key={skill} className="px-2 py-0.5 rounded-md bg-surface/10 border border-glass text-[10px] text-secondary">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 text-[11px] text-secondary/60">
                <span className="flex items-center gap-1"><Clock size={11} /> {new Date(opp.created_at).toLocaleDateString()}</span>
                {opp.location && <span className="flex items-center gap-1"><MapPin size={11} /> {opp.location}</span>}
                {opp.compensation && <span className="flex items-center gap-1"><DollarSign size={11} /> {opp.compensation}</span>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => handleToggle(opp.id)}
                disabled={loadingId === opp.id}
                className="p-2 rounded-lg bg-surface/10 border border-glass text-secondary hover:text-primary transition-all disabled:opacity-40"
                title={opp.is_active ? "Deactivate" : "Activate"}
              >
                {opp.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <a
                href={`/dashboard/sponsor/opportunities/${opp.id}/edit`}
                className="p-2 rounded-lg bg-surface/10 border border-glass text-secondary hover:text-status-blue transition-all"
                title="Edit"
              >
                <Edit3 size={14} />
              </a>
              <button
                onClick={() => handleDelete(opp.id, opp.title)}
                disabled={loadingId === opp.id}
                className="p-2 rounded-lg bg-surface/10 border border-glass text-secondary hover:text-bh-red-500 transition-all disabled:opacity-40"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
