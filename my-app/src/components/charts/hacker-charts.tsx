"use client";

import { Zap, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// ─── Data ───────────────────────────────────────────────────────────

const LEVEL_MILESTONES = [
  { level: 1, xp: 0, xpCumulative: 0 },
  { level: 2, xp: 100, xpCumulative: 100 },
  { level: 3, xp: 400, xpCumulative: 500 },
  { level: 4, xp: 1000, xpCumulative: 1500 },
  { level: 5, xp: 3500, xpCumulative: 5000 },
];

const WEEKLY_ACTIVITY = [
  { week: "W1", projects: 2, markers: 1, events: 1 },
  { week: "W2", projects: 1, markers: 0, events: 2 },
  { week: "W3", projects: 3, markers: 2, events: 0 },
  { week: "W4", projects: 0, markers: 1, events: 1 },
  { week: "W5", projects: 2, markers: 0, events: 0 },
  { week: "W6", projects: 1, markers: 1, events: 2 },
];

// ─── Custom Tooltip ─────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bh-card px-3 py-2 text-xs shadow-lg">
      <p className="font-bold text-primary">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="font-mono text-muted-foreground">
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

// ─── XP Progress Chart ─────────────────────────────────────────────

interface XPProgressChartProps {
  currentXp?: number;
  currentLevel?: number;
}

export function XPProgressChart({
  currentXp = 250,
  currentLevel = 1,
}: XPProgressChartProps) {
  // Build a continuous XP curve up to the next milestone beyond the user's level
  const nextMilestone = LEVEL_MILESTONES.find((m) => m.level > currentLevel);
  const displayXp = Math.min(currentXp, nextMilestone?.xpCumulative ?? 5000);

  // Area curve data: show the climb to the next level
  const progressData = LEVEL_MILESTONES.filter(
    (m) => m.level <= (nextMilestone?.level ?? 5),
  ).map((m) => ({
    name: `Lv ${m.level}`,
    xp: m.xpCumulative,
  }));

  // Add the current position as a data point
  progressData.push({
    name: `You (${displayXp} XP)`,
    xp: displayXp,
  });

  const nextXp = nextMilestone?.xpCumulative ?? 5000;
  const xpRemaining = Math.max(0, nextXp - currentXp);

  return (
    <div className="bh-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-status-yellow" />
        <h3 className="text-sm font-bold text-primary">
          XP Growth Trajectory
        </h3>
      </div>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={progressData}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <defs>
              <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FE0000" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#FE0000" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 9, fill: "#888" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "#888" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v}`}
            />
            <Tooltip content={<ChartTooltip />} />
            <ReferenceLine
              y={nextXp}
              stroke="#FE0000"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Level ${nextMilestone?.level ?? "?"}`,
                position: "right",
                fill: "#FE0000",
                fontSize: 10,
              }}
            />
            <Area
              type="monotone"
              dataKey="xp"
              stroke="#FE0000"
              strokeWidth={2}
              fill="url(#xpGradient)"
              dot={{ r: 3, fill: "#FE0000", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#FE0000", strokeWidth: 2, stroke: "#fff" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
        <span>
          Level {currentLevel} · {currentXp.toLocaleString()} XP
        </span>
        <span className="text-primary-red">{xpRemaining.toLocaleString()} XP to next level</span>
      </div>
    </div>
  );
}

// ─── Activity Timeline Chart ───────────────────────────────────────

export function ActivityTimelineChart() {
  return (
    <div className="bh-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary-red" />
        <h3 className="text-sm font-bold text-primary">
          Weekly Activity Breakdown
        </h3>
      </div>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={WEEKLY_ACTIVITY}
            margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
            barCategoryGap={8}
            barGap={2}
          >
            <XAxis
              dataKey="week"
              tick={{ fontSize: 9, fill: "#888" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "#888" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
            <Bar
              dataKey="projects"
              name="Projects"
              fill="#FE0000"
              radius={[2, 2, 0, 0]}
              maxBarSize={12}
            />
            <Bar
              dataKey="markers"
              name="Markers"
              fill="#2563EB"
              radius={[2, 2, 0, 0]}
              maxBarSize={12}
            />
            <Bar
              dataKey="events"
              name="Events"
              fill="#16A34A"
              radius={[2, 2, 0, 0]}
              maxBarSize={12}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#FE0000]" />
          Projects
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
          Markers
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
          Events
        </span>
      </div>
    </div>
  );
}
