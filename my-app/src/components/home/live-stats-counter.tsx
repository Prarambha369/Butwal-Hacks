"use client";

import { useEffect, useState } from "react";
import { Users, Calendar, FolderGit2, ShieldCheck } from "lucide-react";

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
  { key: "total_hackers", label: "Hackers", icon: Users },
  { key: "total_events", label: "Events", icon: Calendar },
  { key: "total_projects", label: "Projects", icon: FolderGit2 },
  { key: "total_trust_markers", label: "Credentials", icon: ShieldCheck },
] as const;

export default function LiveStatsCounter() {
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
          Stats temporarily unavailable
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
              loading platform stats
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
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-red/8 text-[10px] font-mono font-semibold text-primary-red tracking-tight">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary-red" />
            live from the database
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {statItems.map(({ key, label, icon: Icon }) => {
            const value = stats?.[key as keyof Stats] ?? null;
            return (
              <div
                key={key}
                className="bh-card p-6 text-center space-y-2 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary-red/10 text-primary-red">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-2xl md:text-3xl font-black text-primary font-mono tabular-nums">
                  {value !== null ? <AnimatedNumber value={value} /> : <span className="text-muted-foreground">—</span>}
                </p>
                <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">
                  {label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
