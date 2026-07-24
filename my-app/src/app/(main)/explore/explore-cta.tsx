"use client";

import { useEffect, useState } from "react";
import AuthAwareCta from "@/components/auth-aware-cta";
import Link from "next/link";
import { ArrowUpRight, Sparkles, Users } from "lucide-react";

interface ExploreCtaProps {
  totalMembers: number;
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
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

  return <span>{display.toLocaleString()}</span>;
}

export function ExploreCta({ totalMembers }: ExploreCtaProps) {
  return (
    <section className="relative overflow-hidden py-24 md:py-28" aria-label="Join the Community">
      {/* Animated radial glow background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary-red/[0.02] via-primary-red/[0.04] to-primary-red/[0.02]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary-red/[0.04] blur-[140px] animate-pulse pointer-events-none" style={{ animationDuration: "4s" }} />
      <div className="absolute -bottom-20 -right-20 w-[300px] h-[300px] rounded-full bg-status-blue/[0.04] blur-[100px] pointer-events-none" />

      <div className="relative mx-auto max-w-3xl px-4 text-center">
        {/* Eyebrow badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-red/8 text-[10px] font-bold text-primary-red tracking-wider">
            <Sparkles className="w-3 h-3" />
            Join the Movement
          </span>
        </div>

        {/* Headline */}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-primary leading-[1.1]">
          Don&apos;t See Your Profile?
        </h2>

        {/* Subtitle with animated count */}
        <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          You&apos;re not just a spectator — create your BH-ID and join{" "}
          <span className="font-bold text-primary inline-flex items-baseline gap-1">
            <Users className="w-4 h-4 text-primary-red inline-block -mb-0.5" />
            <AnimatedNumber value={totalMembers} />
          </span>{" "}
          members building the future of tech in Lumbini Province.
        </p>

        {/* Buttons */}
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <AuthAwareCta
            actionHref="/dashboard/hacker"
            actionLabel="Create Your Profile"
            returnTo="/explore"
            className="py-3.5 px-8 text-sm font-bold rounded-full shadow-[--bh-glow-red-soft] hover:shadow-[--bh-glow-red] transition-all duration-300"
          />
          <Link
            href="/community"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-8 py-3.5 text-sm font-bold text-primary hover:bg-surface-hover hover:border-muted-foreground/30 transition-all active:scale-[0.97]"
          >
            Explore Community <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
