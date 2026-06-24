"use client";

import { useState, useEffect } from "react";
import { Users, Search, Zap, RefreshCw, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton, FeedSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { TeamMatchResult } from "@/lib/actions/team-matching";

export default function TeamMatching() {
  const [data, setData] = useState<TeamMatchResult | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const { findTeammates } = await import("@/lib/actions/team-matching");
      const result = await findTeammates();
      setData(result);
    } catch {
      toast.error("Failed to find teammates. Please sign in.");
      setData({ candidates: [], yourSkills: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary-red/10">
            <Users className="h-5 w-5 text-primary-red" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-primary">AI Team Matching</h2>
            <p className="text-xs text-muted-foreground">Find teammates based on skills &amp; interests</p>
          </div>
        </div>
        <button
          onClick={fetchMatches}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:text-primary hover:border-primary-red/30 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-6">
            <div className="bh-card p-4">
              <Skeleton className="h-3 w-24 mb-3" />
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-16 rounded-full" />
                ))}
              </div>
            </div>
            <FeedSkeleton count={3} />
          </div>
      ) : data && data.candidates.length > 0 ? (
        <>
          {/* Skill summary */}
          {data.yourSkills.length > 0 && (
            <div className="bh-card p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Your Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {data.yourSkills.map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 rounded-full bg-primary-red/10 border border-primary-red/20 text-[10px] font-semibold text-primary-red"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Candidates */}
          <div className="grid gap-3">
            {data.candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="bh-card p-4 transition-all hover:border-primary-red/30 hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-surface/20 ring-2 ring-border/30 shrink-0">
                    {candidate.avatar_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={candidate.avatar_url}
                        alt={candidate.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                        {candidate.full_name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-primary truncate">{candidate.full_name}</p>
                      <span className="text-[10px] font-mono text-muted-foreground">{candidate.bh_id}</span>
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                        candidate.matchScore >= 70
                          ? "bg-status-green/10 text-status-green"
                          : candidate.matchScore >= 40
                            ? "bg-status-yellow/10 text-status-yellow"
                            : "bg-secondary/10 text-muted-foreground"
                      )}>
                        {candidate.matchScore}% match
                      </span>
                    </div>

                    {/* Match bar */}
                    <div className="mt-1.5 h-1.5 rounded-full bg-surface-hover overflow-hidden w-full max-w-[200px]">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          candidate.matchScore >= 70 ? "bg-status-green" : "bg-bh-red-500"
                        )}
                        style={{ width: `${candidate.matchScore}%` }}
                      />
                    </div>

                    {/* Skills */}
                    {candidate.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {candidate.skills.slice(0, 4).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 rounded-md bg-surface-hover border border-border text-[9px] font-medium text-muted-foreground"
                          >
                            {skill}
                          </span>
                        ))}
                        {candidate.skills.length > 4 && (
                          <span className="text-[9px] text-muted-foreground">+{candidate.skills.length - 4} more</span>
                        )}
                      </div>
                    )}

                    {/* Match reasons */}
                    {candidate.matchReasons.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {candidate.matchReasons.map((reason, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground/60"
                          >
                            <Zap className="w-2.5 h-2.5 text-status-yellow" />
                            {reason}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`/p/${candidate.bh_id}`}
                      className="p-2 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-primary transition-colors"
                      title="View profile"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    {candidate.social_links?.github && (
                      <a
                        href={candidate.social_links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-primary transition-colors"
                        title="GitHub"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : data ? (
        /* Empty state */
        <div className="bh-card p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center mb-3">
            <Search className="w-6 h-6 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-bold text-primary mb-1">No matches found</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Add skills to your profile and participate in events to get better matching results.
          </p>
        </div>
      ) : null}
    </div>
  );
}
