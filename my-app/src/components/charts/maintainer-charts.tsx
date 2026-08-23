"use client";

import { BarChart3, TrendingUp, ShieldCheck } from "lucide-react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────

interface SignupsChartProps {
  data: { day: string; signups: number }[];
}

interface MarkersChartProps {
  data: { month: string; count: number }[];
}

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

function ChartEmpty({ title, description }: { title?: string; description?: string }) {
  return (
    <div className="bh-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-xs font-bold text-primary">{title ?? "Chart"}</h3>
      </div>
      <div className="h-[120px] flex flex-col items-center justify-center text-center">
        <BarChart3 className="w-6 h-6 text-muted-foreground/30 mb-2" />
        <p className="text-xs text-muted-foreground">{description ?? "No data available yet."}</p>
      </div>
    </div>
  );
}

// ─── API Usage (static — requires external monitoring setup) ────────

export function APIUsageChart() {
  return (
    <div className="bh-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-xs font-bold text-primary">API Usage</h3>
      </div>
      <div className="h-[120px] flex flex-col items-center justify-center text-center">
        <BarChart3 className="w-6 h-6 text-muted-foreground/30 mb-2" />
        <p className="text-xs text-muted-foreground max-w-[180px]">
          Connect an API monitoring service to see request data here.
        </p>
      </div>
    </div>
  );
}

// ─── New Signups ────────────────────────────────────────────────────

export function NewSignupsChart({ data }: SignupsChartProps) {
  const hasData = data.some((d) => d.signups > 0);

  if (!hasData) {
    return (
      <ChartEmpty
        title="New Signups"
        description="No signups in the last 7 days."
      />
    );
  }

  return (
    <div className="bh-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-status-green" />
        <h3 className="text-xs font-bold text-primary">New Signups</h3>
      </div>
      <div className="h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
          >
            <defs>
              <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#16A34A" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#16A34A" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 8, fill: "#888" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="signups"
              stroke="#16A34A"
              strokeWidth={2}
              fill="url(#signupGradient)"
              dot={{ r: 2, fill: "#16A34A", strokeWidth: 0 }}
              activeDot={{ r: 4, fill: "#16A34A", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between text-[8px] font-mono text-muted-foreground">
        <span>Last 7 days</span>
        <span>{data.reduce((sum, d) => sum + d.signups, 0)} total</span>
      </div>
    </div>
  );
}

// ─── Trust Marker Issuance ──────────────────────────────────────────

export function TrustMarkersChart({ data }: MarkersChartProps) {
  const hasData = data.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <ChartEmpty
        title="Trust Marker Issuance"
        description="No trust markers issued this year yet."
      />
    );
  }

  return (
    <div className="bh-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-primary-red" />
        <h3 className="text-xs font-bold text-primary">Trust Marker Issuance</h3>
      </div>
      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
            barCategoryGap={4}
          >
            <XAxis
              dataKey="month"
              tick={{ fontSize: 9, fill: "#888" }}
              axisLine={false}
              tickLine={false}
              interval={2}
            />
            <YAxis hide />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
            <Bar
              dataKey="count"
              fill="#FE0000"
              radius={[3, 3, 0, 0]}
              maxBarSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
