"use client";

import { useState } from "react";
import {
  Lock,
  CheckCircle2,
  ArrowRight,
  Zap,
  Loader2,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SKILL_ICONS, type SkillWithStatus } from "@/lib/skill-trees";

interface SkillNodeProps {
  skill: SkillWithStatus;
  treeColor: string;
}

export default function SkillNode({ skill, treeColor }: SkillNodeProps) {
  const [unlocking, setUnlocking] = useState(false);

  const statusConfig = {
    locked: {
      icon: Lock,
      bg: "bg-surface-hover/30",
      border: "border-border/30",
      text: "text-muted-foreground/40",
      badge: "bg-muted-foreground/10 text-muted-foreground/50",
      badgeText: "Locked",
    },
    available: {
      icon: ArrowRight,
      bg: "bg-surface-hover",
      border: "border-border",
      text: "text-primary",
      badge: `bg-${treeColor.split(" ")[0].replace("from-", "")}/10 text-${treeColor.split(" ")[0].replace("from-", "")}`,
      badgeText: "Unlock",
    },
    in_progress: {
      icon: ArrowRight,
      bg: "bg-surface-hover",
      border: "border-status-yellow/30",
      text: "text-primary",
      badge: "bg-status-yellow/10 text-status-yellow",
      badgeText: `${skill.progress}/${skill.progressMax}`,
    },
    unlocked: {
      icon: CheckCircle2,
      bg: "bg-status-green/5",
      border: "border-status-green/30",
      text: "text-status-green",
      badge: "bg-status-green/10 text-status-green",
      badgeText: "Unlocked",
    },
  };

  const config = statusConfig[skill.status];
  const StatusIcon = config.icon;
  const isUnlockable = skill.status === "available" || skill.status === "in_progress";
  const isUnlocked = skill.status === "unlocked";
  const progressPercent = skill.progressMax > 0
    ? Math.min((skill.progress / skill.progressMax) * 100, 100)
    : 0;

  async function handleUnlock() {
    if (!isUnlockable || unlocking) return;
    setUnlocking(true);
    try {
      const { unlockSkill } = await import("@/lib/actions/skill-trees");
      const result = await unlockSkill(skill.id);
      if (result.success) {
        toast.success(`Unlocked: ${skill.name}${result.xpAwarded ? ` (+${result.xpAwarded} XP)` : ""}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to unlock skill";
      toast.error(message);
    } finally {
      setUnlocking(false);
    }
  }

  return (
    <div
      className={cn(
        "relative group rounded-xl border p-4 transition-all duration-300",
        config.bg,
        config.border,
        isUnlockable && "hover:border-primary-red/40 hover:cursor-pointer hover:shadow-[0_0_20px_rgba(254,0,0,0.08)]",
        isUnlocked && "border-status-green/40",
      )}
      onClick={isUnlockable ? handleUnlock : undefined}
      role={isUnlockable ? "button" : undefined}
      tabIndex={isUnlockable ? 0 : undefined}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleUnlock(); } }}
    >
      {/* Top row: icon + badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className={cn("w-8 h-8 rounded-lg bg-surface-hover border border-border flex items-center justify-center", isUnlocked && "animate-pulse")}>
            {SKILL_ICONS[skill.icon] ?? <Code2 className="w-5 h-5" />}
          </span>
          <div>
            <p className={cn("text-sm font-bold", config.text)}>
              {skill.name}
            </p>
            <p className="text-[10px] text-muted-foreground/60 font-mono">
              {skill.xpReward} XP
            </p>
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all",
          config.badge,
          unlocking && "opacity-50",
        )}>
          {unlocking ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : isUnlockable ? (
            <Zap className="w-3 h-3" />
          ) : (
            <StatusIcon className="w-3 h-3" />
          )}
          {config.badgeText}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground/70 mb-3 leading-relaxed">
        {skill.description}
      </p>

      {/* Progress bar for in_progress skills */}
      {skill.status === "in_progress" && (
        <div className="space-y-1.5">
          <div className="h-1.5 w-full bg-surface-hover/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-status-yellow rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground/50 font-mono">
            {skill.progress} / {skill.progressMax} completed
          </p>
        </div>
      )}

      {/* Prerequisites hint */}
      {skill.status === "locked" && skill.prerequisiteIds.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2">
          <Lock className="w-3 h-3 text-muted-foreground/30" />
          <p className="text-[10px] text-muted-foreground/40 font-mono">
            Complete prerequisites first
          </p>
        </div>
      )}
    </div>
  );
}
