"use client";

import { Heart, GraduationCap, Users } from "lucide-react";
import { type ComponentType } from "react";

type ValueCard = {
  id: string;
  label: string;
  description: string;
};

const values: ValueCard[] = [
  {
    id: "free",
    label: "Free for Students",
    description: "No registration fees, no hidden costs — every event is free to attend.",
  },
  {
    id: "mentorship",
    label: "Mentorship Built In",
    description: "Experienced developers guide first-time hackers through workshops and build sessions.",
  },
  {
    id: "community",
    label: "Community Driven",
    description: "Built by students, for students — projects, events, and everything in between.",
  },
];

const visibleIcons = [Heart, GraduationCap, Users];

function ValueCard({ item, icon: Icon, index }: { item: ValueCard; icon: ComponentType<{ className?: string }>; index: number }) {
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
        <p className="text-lg font-extrabold text-primary">
          {item.label}
        </p>
      </div>
      <p className="text-xs text-text-secondary leading-relaxed">
        {item.description}
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
            what we stand for
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {values.map((item, i) => (
            <ValueCard key={item.id} item={item} icon={visibleIcons[i] ?? Users} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
