"use client";

import { Users, CalendarDays, Building2, Sparkles } from "lucide-react";
import type { ImpactMetric } from "@/types/impact";
import { type ComponentType } from "react";

const metrics: ImpactMetric[] = [
  {
    id: "builders",
    label: "Active Builders",
    value: 500,
    suffix: "+",
    description: "Youth from Butwal, Pokhara, Kathmandu, and Chitwan",
  },
  {
    id: "events",
    label: "Events Hosted",
    value: 20,
    suffix: "+",
    description: "Hackathons, workshops, and game jams across Rupandehi",
  },
  {
    id: "chapters",
    label: "Active Chapters",
    value: 5,
    suffix: "",
    description: "Butwal, Pokhara, Kathmandu, Chitwan + expanding",
  },
  {
    id: "free",
    label: "Free for Students",
    value: 100,
    suffix: "%",
    description: "No hidden costs — funded transparently via Open Collective",
  },
];

const icons = [Users, CalendarDays, Building2, Sparkles];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  return (
    <>
      <span className="font-mono">
        {value.toLocaleString()}
      </span>
      {suffix && <span className="text-primary-red font-mono">{suffix}</span>}
    </>
  );
}

function MetricCard({ metric, icon: Icon, index }: { metric: ImpactMetric; icon: ComponentType<{ className?: string }>; index: number }) {
  return (
    <div
      className="bh-card p-6 text-center space-y-3 hover:-translate-y-0.5 transition-all duration-300"
      style={{
        transitionDelay: `${index * 100}ms`,
      }}
    >
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary-red/10 text-primary-red">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-4xl font-extrabold text-primary">
          <AnimatedCounter value={metric.value} suffix={metric.suffix ?? ""} />
        </p>
        <p className="text-sm font-medium text-text-secondary mt-1">
          {metric.label}
        </p>
      </div>
      <p className="text-xs text-text-secondary leading-relaxed">
        {metric.description}
      </p>
      <p className="sr-only" aria-live="polite">
        {metric.label}: {metric.value}{metric.suffix}
      </p>
    </div>
  );
}

export default function ImpactMetrics() {
  return (
    <section className="py-16 md:py-20 bg-surface border-b border-border">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-center gap-3 mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-red/8 text-[10px] font-mono font-semibold text-primary-red tracking-tight">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary-red" />
            live stats
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {metrics.map((metric, i) => (
            <MetricCard key={metric.id} metric={metric} icon={icons[i] ?? Users} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
