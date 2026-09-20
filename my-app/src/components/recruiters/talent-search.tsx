"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Users, ExternalLink, Award } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { RoseSpinner } from "@/components/ui/rose-loader";
import type { TalentSearchResult } from "@/lib/actions/search-profiles";

interface TalentSearchProps {
  initialResults: TalentSearchResult[];
  markerTypes: string[];
}

export default function TalentSearch({ initialResults, markerTypes }: TalentSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedMarkerType, setSelectedMarkerType] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [results, setResults] = useState<TalentSearchResult[]>(initialResults);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const doSearch = useCallback(async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const { searchTalent } = await import("@/lib/actions/search-profiles");
      const data = await searchTalent({
        query: query.trim() || undefined,
        markerType: selectedMarkerType || undefined,
        skill: skillFilter.trim() || undefined,
      });
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, selectedMarkerType, skillFilter]);

  // Auto-search on mount with no filters
  useEffect(() => {
    doSearch();
     
  }, []);

  return (
    <div className="space-y-8">
      {/* ── Search Bar ──────────────────────────────────────────── */}
      <div className="bh-card p-6 space-y-5">
        {/* Text input row */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            placeholder="Search by BH-ID or bio..."
            className="w-full bg-surface-hover border border-border rounded-lg pl-11 pr-4 py-3 text-sm text-primary placeholder:text-secondary/50 outline-none focus:border-bh-red-500/50 transition-all"
          />
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-4 items-end">
          {/* Trust marker type filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-secondary">Marker Type</label>
            <select
              value={selectedMarkerType}
              onChange={(e) => setSelectedMarkerType(e.target.value)}
              className="bg-surface-hover border border-border rounded-lg px-3 py-1.5 text-xs text-primary outline-none focus:border-bh-red-500/30 transition-all"
            >
              <option value="">All markers</option>
              {markerTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Skill filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-secondary">Skill</label>
            <input
              type="text"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
              placeholder="e.g. React, Python, IoT"
              className="bg-surface-hover border border-border rounded-lg px-3 py-1.5 text-xs text-primary placeholder:text-secondary/40 outline-none focus:border-bh-red-500/30 transition-all w-40"
            />
          </div>

          {/* Search button */}
          <button
            onClick={doSearch}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-bh-red-500 text-white text-xs font-bold hover:bg-deep-red transition-all disabled:opacity-50 shadow-[0_4px_12px_-4px_var(--glow-bh-red)]"
          >
            {loading ? (
              <RoseSpinner size="sm" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            Search
          </button>
        </div>
      </div>

      {/* ── Results ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <RoseSpinner size="lg" />
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {results.map((hacker) => (
            <div
              key={hacker.id}
              className="bh-card p-5 space-y-4 hover:border-primary-red/20 transition-all group"
            >
              {/* Header: avatar + name + XP */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-surface-hover border border-border shrink-0 overflow-hidden flex items-center justify-center relative">
                  {hacker.avatar_url ? (
                    <Image
                      src={hacker.avatar_url}
                      alt={hacker.display_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Users className="w-5 h-5 text-secondary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-primary truncate">
                      {hacker.display_name}
                    </h3>
                    {hacker.trust_marker_count > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-primary-red shrink-0">
                        <Award className="w-3 h-3" />
                        {hacker.trust_marker_count}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-mono text-secondary truncate">
                    {hacker.slug_id}
                  </p>
                </div>
              </div>

              {/* Bio */}
              {hacker.bio && (
                <p className="text-xs text-secondary/70 line-clamp-2 leading-relaxed">
                  {hacker.bio}
                </p>
              )}

              {/* Trust markers */}
              {hacker.top_markers.length > 0 && (
                <div className="flex items-center gap-2">
                  <Award className="w-3 h-3 text-status-yellow shrink-0" />
                  <span className="text-[10px] text-secondary">
                    {hacker.trust_marker_count} marker{hacker.trust_marker_count !== 1 ? "s" : ""}
                    {hacker.top_markers[0] && ` · ${hacker.top_markers[0].title}`}
                  </span>
                </div>
              )}

              {/* View Profile */}
              <Link
                href={`/p/${hacker.slug_id}`}
                className="flex items-center justify-between w-full px-4 py-2 rounded-lg bg-surface-hover border border-border text-xs font-medium text-secondary hover:text-primary hover:bg-surface-hover hover:border-primary-red/30 transition-all group/link"
              >
                View Profile
                <ExternalLink className="w-3 h-3 transition-transform group-hover/link:translate-x-0.5" />
              </Link>
            </div>
          ))}
        </div>
      ) : hasSearched ? (
        <div className="flex flex-col items-center py-16 space-y-4">
          <div className="p-4 rounded-lg bg-surface-hover border border-border">
            <Users className="w-8 h-8 text-secondary/40" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-base font-bold text-primary">No hackers found</p>
            <p className="text-sm text-secondary max-w-sm">
              Try adjusting your search text or clearing the marker filter.
            </p>
          </div>
          <button
            onClick={() => {
              setQuery("");
              setSelectedMarkerType("");
              setSkillFilter("");
            }}
            className="px-4 py-2 rounded-full bg-surface-hover border border-border text-xs font-bold text-secondary hover:text-primary transition-all"
          >
            Clear filters
          </button>
        </div>
      ) : null}
    </div>
  );
}
