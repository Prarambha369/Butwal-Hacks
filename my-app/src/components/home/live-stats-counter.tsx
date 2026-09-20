"use client";

import { useEffect, useState } from "react";
import { UsersRound, CalendarDays, FolderGit2, BadgeCheck } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { t } from "@/lib/i18n";

interface Stats {
  total_hackers: number;
  total_events: number;
  total_projects: number;
  total_trust_markers: number;
}

function SkeletonCard() {
  return (
    <div className="bh-card p-6 text-center space-y-2 animate-pulse">
      <div className="mx-auto h-10 w-10 rounded-lg bg-surface-hover" />
      <div className="h-8 w-20 bg-surface-hover rounded mx-auto" />
      <div className="h-3 w-16 bg-surface-hover rounded mx-auto" />
    </div>
  );
}

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) return;
    const duration = 1500;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

const statItems = [
  { key: "total_hackers", labelKey: "home.stats.members", oneKey: "home.stats.member_one", icon: UsersRound, color: "text-primary-red", bg: "bg-primary-red/10" },
  { key: "total_events", labelKey: "home.stats.events", oneKey: "home.stats.event_one", icon: CalendarDays, color: "text-status-blue", bg: "bg-status-blue/10" },
  { key: "total_projects", labelKey: "home.stats.projects", oneKey: "home.stats.project_one", icon: FolderGit2, color: "text-status-green", bg: "bg-status-green/10" },
  { key: "total_trust_markers", labelKey: "home.stats.credentials", oneKey: "home.stats.credential_one", icon: BadgeCheck, color: "text-status-yellow", bg: "bg-status-yellow/10" },
] as const;

export default function LiveStatsCounter() {
  const { locale } = useLanguage();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch("/api/metrics")
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data: Stats) => {
        if (mounted) setStats(data);
      })
      .catch(() => {
        if (mounted) setError(true);
      });
    return () => { mounted = false; };
  }, []);

  if (error) {
    return (
      <div className="py-16 md:py-20 bg-surface border-b border-border">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          Numbers are napping. Back soon.
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <section className="py-16 md:py-20 bg-surface border-b border-border">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-center gap-3 mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-red/8 text-[10px] font-mono font-semibold text-primary-red tracking-tight">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary-red" />
              {t('home.stats.loading', locale)}
            </span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-20 bg-surface border-b border-border">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-center gap-3 mb-12">            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-red/8 text-[10px] font-mono font-semibold text-primary-red tracking-tight">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary-red" />
              {t('home.stats.live', locale)}
            </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {statItems.map(({ key, labelKey, oneKey, icon: Icon, color, bg }) => {
            const value = stats?.[key as keyof Stats] ?? null;
            return (
              <div
                key={key}
                className="bh-card bh-play-hover p-6 text-center space-y-2 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className={`bh-play-target mx-auto flex h-10 w-10 items-center justify-center rounded-lg ${bg} ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-4xl md:text-5xl font-black text-primary font-mono tabular-nums">
                  {value !== null ? <AnimatedNumber value={value} /> : <span className="text-muted-foreground">—</span>}
                </p>
                <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">
                  {value === 1 ? t(oneKey, locale) : t(labelKey, locale)}
                </p>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center font-mono text-[11px] text-muted-foreground">
          {t('home.stats.footnote', locale)}
        </p>
      </div>
    </section>
  );
}
