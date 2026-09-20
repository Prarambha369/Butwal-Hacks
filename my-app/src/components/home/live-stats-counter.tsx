"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { t } from "@/lib/i18n";
import SectionEyebrow from "@/components/section-eyebrow";

interface Stats {
  total_hackers: number;
  total_events: number;
  total_projects: number;
  total_trust_markers: number;
}

function SkeletonStat() {
  return (
    <div className="animate-pulse">
      <div className="h-12 md:h-14 w-24 bg-surface-hover rounded mx-auto lg:mx-0" />
      <div className="mx-auto lg:mx-0 mt-3 h-0.5 w-10 bg-surface-hover" />
      <div className="h-3 w-20 bg-surface-hover rounded mx-auto lg:mx-0 mt-3" />
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
  { key: "total_hackers", labelKey: "home.stats.members", oneKey: "home.stats.member_one", rule: "bg-primary-red" },
  { key: "total_events", labelKey: "home.stats.events", oneKey: "home.stats.event_one", rule: "bg-status-blue" },
  { key: "total_projects", labelKey: "home.stats.projects", oneKey: "home.stats.project_one", rule: "bg-status-green" },
  { key: "total_trust_markers", labelKey: "home.stats.credentials", oneKey: "home.stats.credential_one", rule: "bg-status-yellow" },
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
      <section className="relative overflow-hidden py-16 md:py-20 bg-surface border-b border-border">
        <div aria-hidden="true" className="bh-bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_80%_at_50%_50%,black,transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <SectionEyebrow text={t('home.stats.loading', locale)} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden py-16 md:py-20 bg-surface border-b border-border">
      <div aria-hidden="true" className="bh-bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_80%_at_50%_50%,black,transparent)]" />
      <div className="relative mx-auto max-w-6xl px-4">
        <div className="mb-10 text-center">
          <SectionEyebrow text={t('home.stats.live', locale)} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {statItems.map(({ key, labelKey, oneKey, rule }) => {
            const value = stats?.[key as keyof Stats] ?? null;
            return (
              <div key={key} className="text-center lg:text-left">
                <p className="font-mono text-5xl md:text-6xl font-black tabular-nums text-primary">
                  {value !== null ? <AnimatedNumber value={value} /> : <span className="text-muted-foreground">—</span>}
                </p>
                <div aria-hidden="true" className={`mx-auto lg:mx-0 mt-3 h-[3px] w-10 ${rule}`} />
                <p className="mt-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
                  {value === 1 ? t(oneKey, locale) : t(labelKey, locale)}
                </p>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center font-mono text-[11px] text-muted-foreground">
          {t('home.stats.footnote', locale)}
        </p>
      </div>
    </section>
  );
}
