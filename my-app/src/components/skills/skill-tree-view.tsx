"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Layout,
  Server,
  Brain,
  GitBranch,
  Users,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CardSkeleton } from "@/components/ui/skeleton";
import SkillNode from "@/components/skills/skill-node";
import { logger } from "@/lib/logger";
import type {
  SkillTreeWithStatus,
} from "@/lib/gamification/skill-trees";

const TREE_ICONS: Record<string, React.ReactNode> = {
  frontend: <Layout className="w-5 h-5" />,
  backend: <Server className="w-5 h-5" />,
  "ai-ml": <Brain className="w-5 h-5" />,
  devops: <GitBranch className="w-5 h-5" />,
  community: <Users className="w-5 h-5" />,
};

interface SkillTreeViewProps {
  className?: string;
}

export default function SkillTreeView({ className }: SkillTreeViewProps) {
  const [trees, setTrees] = useState<SkillTreeWithStatus[]>([]);
  const [activeTreeId, setActiveTreeId] = useState<string | null>(null);
  const [expandedTiers, setExpandedTiers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { getSkillTreesWithStatus } = await import("@/lib/actions/skill-trees");
      const data = await getSkillTreesWithStatus();
      setTrees(data);
      if (data.length > 0 && !activeTreeId) {
        setActiveTreeId(data[0].id);
        // Expand first tier of first tree by default
        if (data[0].tiers.length > 0) {
          setExpandedTiers(new Set([data[0].tiers[0].id]));
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load skill trees";
      logger.error("[skill-tree-view]", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [activeTreeId]);

  useEffect(() => {
    fetchTrees();
  }, []);

  const activeTree = trees.find((t) => t.id === activeTreeId);

  function toggleTier(tierId: string) {
    setExpandedTiers((prev) => {
      const next = new Set(prev);
      if (next.has(tierId)) next.delete(tierId);
      else next.add(tierId);
      return next;
    });
  }

  // Re-fetch on focus to keep data fresh
  useEffect(() => {
    const handleFocus = () => fetchTrees();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchTrees]);

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 w-32 rounded-lg bg-surface-hover animate-pulse" />
          ))}
        </div>
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("bh-card p-6 border border-primary-red/30", className)}>
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-primary-red" />
          <div>
            <p className="text-sm font-bold text-primary">Failed to load skill trees</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (trees.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Tree Tab Bar */}
      <div className="flex gap-2 flex-wrap">
        {trees.map((tree) => {
          const isActive = tree.id === activeTreeId;
          const allUnlocked = tree.unlockedCount === tree.totalCount;
          return (
            <button
              key={tree.id}
              onClick={() => {
                setActiveTreeId(tree.id);
                // Expand first tier by default
                if (tree.tiers.length > 0) {
                  setExpandedTiers(new Set([tree.tiers[0].id]));
                }
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200",
                "border",
                isActive
                  ? "bg-surface-hover border-primary-red/30 text-primary shadow-sm"
                  : "border-border/50 text-muted-foreground hover:text-primary hover:bg-surface-hover",
                allUnlocked && "border-status-green/30",
              )}
            >
              <span className={cn(
                isActive ? "text-primary-red" : "text-muted-foreground",
              )}>
                {TREE_ICONS[tree.id] ?? null}
              </span>
              <span>{tree.name}</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[9px] font-mono",
                allUnlocked
                  ? "bg-status-green/10 text-status-green"
                  : "bg-muted-foreground/10 text-muted-foreground",
              )}>
                {tree.unlockedCount}/{tree.totalCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Tree Display */}
      {activeTree && (
        <div className="space-y-3">
          {/* Tree Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-primary">{activeTree.name}</h3>
              <p className="text-xs text-muted-foreground">{activeTree.description}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono text-muted-foreground">Progress</p>
              <p className="text-lg font-black text-primary-red">
                {Math.round(activeTree.overallProgress)}%
              </p>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="h-2 w-full bg-surface-hover rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-primary-red to-red-400"
              style={{ width: `${activeTree.overallProgress}%` }}
            />
          </div>

          {/* Tiers */}
          <div className="space-y-4 mt-4">
            {activeTree.tiers.map((tier, tierIndex) => {
              const isExpanded = expandedTiers.has(tier.id);
              const allUnlocked = tier.skills.every((s) => s.status === "unlocked");
              const anyAvailable = tier.skills.some((s) => s.status === "available" || s.status === "in_progress");

              return (
                <div key={tier.id} className="relative">
                  {/* Connection line to next tier */}
                  {tierIndex < activeTree.tiers.length - 1 && (
                    <div className="absolute left-6 top-full h-4 w-px bg-border/50" />
                  )}

                  {/* Tier Header */}
                  <button
                    onClick={() => toggleTier(tier.id)}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-left transition-all",
                      "hover:bg-surface-hover",
                      allUnlocked && "bg-status-green/5",
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                      allUnlocked
                        ? "bg-status-green/20 text-status-green"
                        : anyAvailable
                          ? "bg-primary-red/20 text-primary-red"
                          : "bg-muted-foreground/10 text-muted-foreground",
                    )}>
                      {tierIndex + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-primary">{tier.name}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {tier.skills.filter((s) => s.status === "unlocked").length} / {tier.skills.length} unlocked
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground/40" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground/40" />
                    )}
                  </button>

                  {/* Skills Grid */}
                  {isExpanded && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3 pl-4">
                      {tier.skills.map((skill, skillIndex) => (
                        <div key={skill.id} className="relative">
                          {/* Branch line */}
                          {tierIndex > 0 && skillIndex === 0 && (
                            <div className="absolute -top-3 left-1/2 w-px h-3 bg-border/30" />
                          )}
                          <SkillNode skill={skill} treeColor={activeTree.color} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
