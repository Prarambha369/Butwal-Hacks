import React from "react";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { Users } from "lucide-react";
import { searchTalent } from "@/lib/actions/search-profiles";
import TalentSearch from "@/components/recruiters/talent-search";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Recruiter Portal | Butwal Hacks",
  description: "Find and recruit top technical talent from Butwal Hacks.",
  path: "/portal/recruiters",
});

/** Distinct trust_marker types from the schema */
const MARKER_TYPES = ["achievement", "participation", "verification", "special_recognition"];

export default async function RecruitersPage() {
  const initialResults = await searchTalent({}, 50);

  return (
    <div className="min-h-dvh bg-background">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-red/10 border border-primary-red/20 text-xs font-bold text-primary-red uppercase tracking-wider">
            <Users className="w-3 h-3" />
            Sponsor Portal
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Talent Directory</h1>
            <p className="text-muted-foreground text-sm mt-2 max-w-2xl">
              Browse verified hackers by experience, trust markers, and achievements.
              Click any profile to view their full portfolio.
            </p>
          </div>
        </div>

        <TalentSearch
          initialResults={initialResults}
          markerTypes={MARKER_TYPES}
        />
      </div>
    </div>
  );
}
