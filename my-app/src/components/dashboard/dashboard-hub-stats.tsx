"use client";

import { Medal, Code2, Trophy, Building2 } from "lucide-react";
import { StatCard, StatGrid } from "@/components/dashboard/shell/stat-card";

/**
 * The hub's KPI row.
 *
 * This used to render the same three numbers twice: once as stat cards, then
 * again as an "activity" list whose timestamps were the literal strings
 * "Recent" and "Ongoing". That is not a record of anything, and repeating the
 * figures made a page of three real counts look busier than it was.
 *
 * The counts are now stated once, and the fourth tile uses the chapter count
 * that was already being fetched for the onboarding checklist.
 */
export default function DashboardHubStats({
  trustMarkerCount,
  projectCount,
  hackathonCount,
  chapterCount = 0,
}: {
  trustMarkerCount: number;
  projectCount: number;
  hackathonCount: number;
  chapterCount?: number;
}) {
  return (
    <section aria-label="Your stats">
      <StatGrid cols={4}>
        <StatCard
          label="Trust Markers"
          value={trustMarkerCount}
          icon={Medal}
          tone={trustMarkerCount > 0 ? "yellow" : "neutral"}
          hint={trustMarkerCount > 0 ? "Verified achievements" : "Ship a project to earn one"}
        />
        <StatCard
          label="Projects"
          value={projectCount}
          icon={Code2}
          tone={projectCount > 0 ? "blue" : "neutral"}
          hint={projectCount > 0 ? "Submitted" : "Submit your first build"}
        />
        <StatCard
          label="Hackathons"
          value={hackathonCount}
          icon={Trophy}
          tone={hackathonCount > 0 ? "green" : "neutral"}
          hint={hackathonCount > 0 ? "Registered" : "Find one to join"}
        />
        <StatCard
          label="Chapters"
          value={chapterCount}
          icon={Building2}
          tone={chapterCount > 0 ? "teal" : "neutral"}
          hint={chapterCount > 0 ? "Communities" : "Join a local chapter"}
        />
      </StatGrid>
    </section>
  );
}
