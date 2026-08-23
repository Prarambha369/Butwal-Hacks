"use client";

import { useState, useEffect } from "react";
import { GitBranch, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

interface SkillTreeSummary {
  totalSkills: number;
  totalUnlocked: number;
  overallProgress: number;
  treeCount: number;
}

export default function SkillTreeWidget() {
  const [summary, setSummary] = useState<SkillTreeSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    import("@/lib/actions/skill-trees")
      .then((m) => m.getSkillTreeSummary())
      .then((data) => {
        if (!cancelled) {
          setSummary(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          logger.error("[skill-tree-widget]", err);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="bh-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-surface-hover animate-pulse" />
          <div className="h-3 w-20 bg-surface-hover rounded animate-pulse" />
        </div>
        <div className="h-2 w-full bg-surface-hover rounded animate-pulse" />
        <div className="h-3 w-32 bg-surface-hover rounded animate-pulse" />
      </div>
    );
  }

  if (!summary || summary.treeCount === 0) {
    return null;
  }

  const isComplete = summary.totalUnlocked >= summary.totalSkills;

  return (
    <Link
      href="/dashboard/hacker/skills"
      className="bh-card p-5 space-y-3 block group hover:border-primary-red/30 transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary-red/10">
            <GitBranch className="w-4 h-4 text-primary-red" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Skill Trees
          </span>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary-red/60 transition-colors" />
      </div>

      {/* Count row */}
      <div className="flex items-baseline gap-1.5">
        <span className={cn(
          "text-2xl font-black tabular-nums",
          isComplete ? "text-status-green" : "text-primary",
        )}>
          {summary.totalUnlocked}
        </span>
        <span className="text-xs font-mono text-muted-foreground">
          / {summary.totalSkills} unlocked
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full bg-surface-hover rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            isComplete
              ? "bg-status-green"
              : "bg-gradient-to-r from-primary-red to-red-400",
          )}
          style={{ width: `${Math.round(summary.overallProgress)}%` }}
        />
      </div>

      {/* Summary text */}
      <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
        <span>{summary.treeCount} tree{summary.treeCount !== 1 ? "s" : ""}</span>
        <span className="font-semibold">{Math.round(summary.overallProgress)}% complete</span>
      </div>
    </Link>
  );
}
