"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  ArrowRight,
  ChevronDown,
  MapPin,
  Hash,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SponsorRow {
  id: string;
  company_name: string | null;
  company_website: string | null;
  company_logo_url: string | null;
  description: string | null;
  locations: string[] | null;
  industries: string[] | null;
  created_at: string | null;
}

type SortKey = "name-asc" | "name-desc" | "date-desc";

interface Props {
  sponsors: SponsorRow[];
  industries: string[];
  locations: string[];
}

const CHIP_BASE =
  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium transition-all";

export default function SponsorsIndexClient({
  sponsors,
  industries,
  locations,
}: Props) {
  const [activeIndustries, setActiveIndustries] = useState<Set<string>>(
    new Set(),
  );
  const [activeLocations, setActiveLocations] = useState<Set<string>>(
    new Set(),
  );
  const [sortKey, setSortKey] = useState<SortKey>("name-asc");

  const toggleIndustry = (value: string) => {
    const next = new Set(activeIndustries);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    setActiveIndustries(next);
  };

  const toggleLocation = (value: string) => {
    const next = new Set(activeLocations);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    setActiveLocations(next);
  };

  const clearFilters = () => {
    setActiveIndustries(new Set());
    setActiveLocations(new Set());
  };

  const filtersActive = activeIndustries.size > 0 || activeLocations.size > 0;

  const hasFilters = activeIndustries.size > 0 || activeLocations.size > 0;

  const filtered = useMemo(() => {
    let rows = sponsors;

    if (activeIndustries.size > 0) {
      rows = rows.filter((s) =>
        (s.industries ?? []).some((i) => activeIndustries.has(i)),
      );
    }
    if (activeLocations.size > 0) {
      rows = rows.filter((s) =>
        (s.locations ?? []).some((l) => activeLocations.has(l)),
      );
    }

    rows = [...rows];
    switch (sortKey) {
      case "name-asc":
        rows.sort((a, b) =>
          (a.company_name ?? "").localeCompare(b.company_name ?? ""),
        );
        break;
      case "name-desc":
        rows.sort((a, b) =>
          (b.company_name ?? "").localeCompare(a.company_name ?? ""),
        );
        break;
      case "date-desc":
        rows.sort(
          (a, b) =>
            new Date(b.created_at ?? 0).getTime() -
            new Date(a.created_at ?? 0).getTime(),
        );
        break;
    }

    return rows;
  }, [sponsors, activeIndustries, activeLocations, sortKey]);

  return (
    <div className="space-y-6">
      {/* Filter + sort bar */}
      <div className="flex flex-wrap items-start gap-4">
        {/* Industry filters */}
        <fieldset className="flex-1 min-w-[200px]">
          <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            By industry
          </legend>
          <div className="flex flex-wrap gap-2">
            {industries.map((ind) => {
              const active = activeIndustries.has(ind);
              return (
                <button
                  key={ind}
                  type="button"
                  onClick={() => toggleIndustry(ind)}
                  className={cn(
                    CHIP_BASE,
                    active
                      ? "bg-primary-red/10 border-primary-red/30 text-primary-red"
                      : "bg-surface-hover border-border text-muted-foreground hover:text-primary hover:border-primary-red/20",
                  )}
                >
                  <Hash className="h-3 w-3" />
                  {ind}
                  {active && (
                    <X className="h-3 w-3 ml-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Location filters */}
        <fieldset className="flex-1 min-w-[200px]">
          <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            By location
          </legend>
          <div className="flex flex-wrap gap-2">
            {locations.map((loc) => {
              const active = activeLocations.has(loc);
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => toggleLocation(loc)}
                  className={cn(
                    CHIP_BASE,
                    active
                      ? "bg-status-blue/10 border-status-blue/30 text-status-blue"
                      : "bg-surface-hover border-border text-muted-foreground hover:text-primary hover:border-primary-red/20",
                  )}
                >
                  <MapPin className="h-3 w-3" />
                  {loc}
                  {active && (
                    <X className="h-3 w-3 ml-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="sponsor-sort"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Sort
          </label>
          <div className="relative">
            <select
              id="sponsor-sort"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="appearance-none rounded-lg bg-surface-hover border border-border pl-3 pr-8 py-2 text-sm text-primary outline-none focus:border-bh-red-500/50 transition-all cursor-pointer"
            >
              <option value="name-asc">A → Z</option>
              <option value="name-desc">Z → A</option>
              <option value="date-desc">Joined first</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Clear */}
        {filtersActive && (
          <button
            type="button"
            onClick={clearFilters}
            className="self-start rounded-lg bg-surface/5 border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary-red/20 transition-all flex items-center gap-1"
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </button>
        )}
      </div>

      {/* Result count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} sponsor{filtered.length !== 1 ? "s" : ""} shown
        {filtersActive ? " (filtered)" : ""}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface/40 p-8 text-center">
          <div className="mx-auto w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center mb-3">
            <Building2 className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            No sponsors match those filters.
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 rounded-lg bg-surface-hover border border-border px-4 py-2 text-xs font-medium text-primary hover:bg-surface transition-all"
            >
              Show all sponsors
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((sponsor) => (
            <SponsorCard key={sponsor.id} sponsor={sponsor} />
          ))}
        </div>
      )}
    </div>
  );
}

function SponsorCard({ sponsor }: { sponsor: SponsorRow }) {
  const website = sponsor.company_website?.trim();
  const name = sponsor.company_name?.trim() || "Sponsor";

  return (
    <Link
      href={`/sponsor/${sponsor.id}`}
      className="group relative flex flex-col gap-3 rounded-xl border border-border bg-surface/40 p-5 transition-all hover:border-primary-red/30 hover:bg-surface hover:shadow-sm"
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        {sponsor.company_logo_url ? (
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-surface flex-shrink-0 ring-1 ring-border">
            <Image
              src={sponsor.company_logo_url}
              alt={`${name} logo`}
              fill
              className="object-contain"
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-xl bg-surface/60 flex items-center justify-center flex-shrink-0 ring-1 ring-border">
            <Building2 className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold text-primary leading-tight group-hover:text-primary-red transition-colors">
            {name}
          </p>
          {website && (
            <p className="text-xs text-muted-foreground truncate underline underline-offset-2 decoration-transparent group-hover:decoration-primary-red/40 transition-colors">
              {website}
            </p>
          )}
        </div>
      </div>

      {/* Description (line-clamped) */}
      {sponsor.description && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {sponsor.description}
        </p>
      )}

      {/* Tags */}
      {(sponsor.locations?.length ?? 0) > 0 &&
        sponsor.locations!.slice(0, 2).map((loc) => (
          <span
            key={loc}
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"
          >
            <MapPin className="h-3 w-3" />
            {loc}
          </span>
        ))}

      {(sponsor.industries?.length ?? 0) > 0 &&
        sponsor.industries!.slice(0, 3).map((ind) => (
          <span
            key={ind}
            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"
          >
            <Hash className="h-3 w-3" />
            {ind}
          </span>
        ))}

      {/* Arrow on hover */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Link>
  );
}
