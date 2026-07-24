"use client";

import { BarChart3, TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────

interface TopSkillsChartProps {
  data: { skill: string; count: number }[];
}

interface ProjectsSubmittedChartProps {
  data: { day: string; count: number }[];
}

interface DemographicsChartProps {
  data: { name: string; value: number }[];
}

const DEMO_COLORS = ["#FE0000", "#2563EB", "#16A34A", "#EA580C"];

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

// ─── Empty State ─────────────────────────────────────────────────────

function ChartEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="bh-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-xs font-bold text-primary">{title}</h3>
      </div>
      <div className="h-[140px] flex flex-col items-center justify-center text-center">
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

// ─── Top Skills ─────────────────────────────────────────────────────

export function TopSkillsChart({ data }: TopSkillsChartProps) {
  if (!data.length) {
    return (
      <ChartEmpty
        title="Top Skills"
        description="No skill data available yet. As hackers add projects, skills will appear here."
      />
    );
  }

  return (
    <div className="bh-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-primary-red" />
        <h3 className="text-sm font-bold text-primary">Top Skills</h3>
      </div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 8, left: -12, bottom: 0 }}
            barCategoryGap={8}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="skill"
              tick={{ fontSize: 11, fill: "#666" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
            <Bar
              dataKey="count"
              fill="#FE0000"
              radius={[0, 4, 4, 0]}
              maxBarSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Projects Submitted ─────────────────────────────────────────────

export function ProjectsSubmittedChart({ data }: ProjectsSubmittedChartProps) {
  if (!data.length) {
    return (
      <ChartEmpty
        title="Projects Submitted"
        description="No projects submitted in the last 7 days."
      />
    );
  }

  return (
    <div className="bh-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-status-blue" />
        <h3 className="text-xs font-bold text-primary">Projects Submitted</h3>
      </div>
      <div className="h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
            barCategoryGap={6}
          >
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "#888" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
            <Bar
              dataKey="count"
              fill="#2563EB"
              radius={[3, 3, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Demographics ───────────────────────────────────────────────────

export function DemographicsChart({ data }: DemographicsChartProps) {
  if (!data.length) {
    return (
      <ChartEmpty
        title="Demographics"
        description="Demographic data will be available once more hackers complete their profiles."
      />
    );
  }

  return (
    <div className="bh-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <PieChartIcon className="w-4 h-4 text-status-orange" />
        <h3 className="text-xs font-bold text-primary">Demographics</h3>
      </div>
      <div className="flex items-center gap-4">
        <div className="h-[120px] w-[120px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={28}
                outerRadius={52}
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={DEMO_COLORS[i % DEMO_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: DEMO_COLORS[i % DEMO_COLORS.length] }}
              />
              <span className="text-[10px] text-muted-foreground flex-1">{d.name}</span>
              <span className="text-[10px] font-mono text-primary">{d.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
