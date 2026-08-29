"use client";

import { useEffect, useState } from "react";
import { Medal, Code2, Trophy, TrendingUp, Users } from "lucide-react";

// ─── Animated Counter ──────────────────────────────────────────────

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const duration = 1200;
    const steps = 24;
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

  return <span>{display.toLocaleString()}{suffix}</span>;
}

// ─── Props ─────────────────────────────────────────────────────────

interface DashboardHubStatsProps {
  trustMarkerCount: number;
  projectCount: number;
  hackathonCount: number;
}

// ─── Recent Activity Data ──────────────────────────────────────────

interface ActivityItem {
  text: string;
  time: string;
  icon: React.ReactNode;
  color: string;
}

function buildActivities(projectCount: number, hackathonCount: number, trustMarkerCount: number): ActivityItem[] {
  const items: ActivityItem[] = [];

  if (projectCount > 0) {
    items.push({
      text: `Submitted ${projectCount} project${projectCount !== 1 ? "s" : ""}`,
      time: "Recent",
      icon: <Code2 className="w-3.5 h-3.5" />,
      color: "text-status-blue",
    });
  }

  if (hackathonCount > 0) {
    items.push({
      text: `Registered for ${hackathonCount} hackathon${hackathonCount !== 1 ? "s" : ""}`,
      time: "Ongoing",
      icon: <Trophy className="w-3.5 h-3.5" />,
      color: "text-status-green",
    });
  }

  if (trustMarkerCount > 0) {
    items.push({
      text: `Earned ${trustMarkerCount} trust marker${trustMarkerCount !== 1 ? "s" : ""}`,
      time: "Ongoing",
      icon: <Medal className="w-3.5 h-3.5" />,
      color: "text-status-yellow",
    });
  }

  if (items.length === 0) {
    items.push({
      text: "Complete your profile to get started",
      time: "",
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      color: "text-muted-foreground",
    });
  }

  return items.slice(0, 4);
}

// ─── Main Component ────────────────────────────────────────────────

export default function DashboardHubStats({
  trustMarkerCount,
  projectCount,
  hackathonCount,
}: DashboardHubStatsProps) {
  const activities = buildActivities(projectCount, hackathonCount, trustMarkerCount);

  return (
    <>
      {/* Section: Quick Stats */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary-red" />
          <h2 className="text-sm font-bold text-primary">Your Stats</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard
            icon={<Medal className="w-4 h-4" />}
            iconColor="text-primary-red"
            iconBg="bg-primary-red/10"
            value={trustMarkerCount}
            label="Trust Markers"
          />
          <StatCard
            icon={<Code2 className="w-4 h-4" />}
            iconColor="text-status-blue"
            iconBg="bg-status-blue/10"
            value={projectCount}
            label="Projects"
          />
          <StatCard
            icon={<Trophy className="w-4 h-4" />}
            iconColor="text-status-green"
            iconBg="bg-status-green/10"
            value={hackathonCount}
            label="Hackathons"
          />
        </div>
      </div>

      {/* Section: Recent Activity */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-primary-red" />
          <h2 className="text-sm font-bold text-primary">Recent Activity</h2>
        </div>
        <div className="bh-card p-5 divide-y divide-border">
          {activities.map((activity, i) => (
            <div key={i} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <div className={`p-1.5 rounded-lg bg-surface-hover ${activity.color}`}>
                {activity.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-primary leading-relaxed">{activity.text}</p>
                {activity.time && (
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{activity.time}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Stat Card Sub-component ───────────────────────────────────────

function StatCard({
  icon,
  iconColor,
  iconBg,
  value,
  label,
  suffix = "",
}: {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  value: number;
  label: string;
  suffix?: string;
}) {
  return (
    <div className="bh-card p-4 space-y-2.5 hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className={`p-1.5 rounded-lg ${iconBg} ${iconColor}`}>{icon}</div>
        <span className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-primary font-mono tabular-nums">
        <AnimatedCounter value={value} suffix={suffix} />
      </p>
    </div>
  );
}
