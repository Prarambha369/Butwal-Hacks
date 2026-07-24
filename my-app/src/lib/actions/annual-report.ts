"use server";

import { createServiceClient } from "@/utils/supabase/service";

export interface AnnualReportData {
  year: number;
  generatedAt: string;
  summary: {
    newUsers: number;
    totalUsers: number;
    newEvents: number;
    newProjects: number;
    newTeams: number;
    trustMarkersIssued: number;
    microCredentialsAwarded: number;
    eventRegistrations: number;
    totalXpAwarded: number;
  };
  financials: {
    balance: number;
    received: number;
    spent: number;
    currency: string;
    available: boolean;
  };
  topHackers: { bh_id: string; full_name: string; xp: number }[];
  monthlySignups: { month: number; count: number }[];
  projectCategories: { category: string; count: number }[];
  techUsage: { tech: string; count: number }[];
  skillTreeUnlocks: { month: number; count: number }[];
  communityMetrics: {
    activeChapters: number;
    sponsorOrganizations: number;
    totalEventsHeld: number;
    bountiesCompleted: number;
    totalProjects: number;
  };
}

export async function generateAnnualReport(year: number): Promise<AnnualReportData | null> {
  const supabase = createServiceClient();
  const startDate = `${year}-01-01T00:00:00Z`;
  const endDate = `${year + 1}-01-01T00:00:00Z`;

  try {
    // ── Platform Metrics ──────────────────────────────────────────
    const [
      { count: newProfiles },
      { count: allProfiles },
      { count: newEvents },
      { count: newProjects },
      { count: newTeams },
      { count: newMarkers },
      { count: newCredentials },
      { count: newRegistrations },
      { data: xpData },
      { data: topHackers },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", startDate).lt("created_at", endDate),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("events").select("*", { count: "exact", head: true }).gte("created_at", startDate).lt("created_at", endDate),
      supabase.from("projects").select("*", { count: "exact", head: true }).gte("created_at", startDate).lt("created_at", endDate),
      supabase.from("teams").select("*", { count: "exact", head: true }).gte("created_at", startDate).lt("created_at", endDate),
      supabase.from("trust_markers").select("*", { count: "exact", head: true }).gte("created_at", startDate).lt("created_at", endDate),
      supabase.from("profile_micro_credentials").select("*", { count: "exact", head: true }).gte("created_at", startDate).lt("created_at", endDate),
      supabase.from("event_registrations").select("*", { count: "exact", head: true }).gte("created_at", startDate).lt("created_at", endDate),
      supabase.from("profiles").select("xp").gte("created_at", startDate).lt("created_at", endDate),
      supabase.from("profiles").select("bh_id, full_name, xp").order("xp", { ascending: false }).limit(10),
    ]);

    const totalXpAwarded = xpData?.reduce((sum, p: { xp: number }) => sum + (p.xp ?? 0), 0) ?? 0;

    // ── Monthly Signups ───────────────────────────────────────────
    const { data: monthlyProfiles } = await supabase
      .from("profiles").select("created_at")
      .gte("created_at", startDate).lt("created_at", endDate);

    const monthlySignups = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const count = (monthlyProfiles ?? []).filter((p: { created_at: string }) => {
        const d = new Date(p.created_at);
        return d.getMonth() + 1 === month;
      }).length;
      return { month, count };
    });

    // ── Project Category Breakdown ────────────────────────────────
    const { data: allProjects } = await supabase
      .from("projects").select("tech_stack, category")
      .gte("created_at", startDate).lt("created_at", endDate);

    const categoryCounts = new Map<string, number>();
    const techCounts = new Map<string, number>();

    const projectList = (allProjects ?? []) as Array<{ tech_stack?: string[] | null; category?: string | null }>;
    for (let i = 0; i < projectList.length; i++) {
      const p = projectList[i];
      const cat = p.category || "Other";
      categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);

      const stack = p.tech_stack ?? [];
      for (let j = 0; j < stack.length; j++) {
        const tech = stack[j];
        techCounts.set(tech, (techCounts.get(tech) ?? 0) + 1);
      }
    }

    const projectCategories = [...categoryCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ category, count }));

    const techUsage = [...techCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tech, count]) => ({ tech, count }));

    // ── Skill Tree Unlocks (by month) ─────────────────────────────
    const { data: credentialData } = await supabase
      .from("profile_micro_credentials")
      .select("unlocked_at")
      .gte("unlocked_at", startDate).lt("unlocked_at", endDate);

    const skillTreeUnlocks = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const count = (credentialData ?? []).filter((c: { unlocked_at: string }) => {
        const d = new Date(c.unlocked_at);
        return d.getMonth() + 1 === month;
      }).length;
      return { month, count };
    });

    // ── Open Collective Financial Data ────────────────────────────
    let financials = { balance: 0, received: 0, spent: 0, currency: "USD", available: false };
    try {
      const ocRes = await fetch("https://api.opencollective.com/graphql/v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `{
            account(slug: "butwal-hacks") {
              stats {
                balanceWithBlockedFunds { value currency }
                totalAmountReceived { value currency }
                totalAmountSpent { value currency }
              }
            }
          }`,
        }),
        signal: AbortSignal.timeout(5000),
      });
      const ocJson = await ocRes.json();
      const s = ocJson?.data?.account?.stats;
      if (s) {
        financials = {
          balance: s.balanceWithBlockedFunds?.value ?? 0,
          received: s.totalAmountReceived?.value ?? 0,
          spent: s.totalAmountSpent?.value ?? 0,
          currency: s.balanceWithBlockedFunds?.currency ?? "USD",
          available: true,
        };
      }
    } catch {
      // OC unavailable — provide empty financials
    }

    return {
      year,
      generatedAt: new Date().toISOString(),
      summary: {
        newUsers: newProfiles ?? 0,
        totalUsers: allProfiles ?? 0,
        newEvents: newEvents ?? 0,
        newProjects: newProjects ?? 0,
        newTeams: newTeams ?? 0,
        trustMarkersIssued: newMarkers ?? 0,
        microCredentialsAwarded: newCredentials ?? 0,
        eventRegistrations: newRegistrations ?? 0,
        totalXpAwarded,
      },
      financials,
      topHackers: topHackers ?? [],
      monthlySignups,
      projectCategories,
      techUsage,
      skillTreeUnlocks,
      communityMetrics: {
        activeChapters: 3,
        sponsorOrganizations: 0,
        totalEventsHeld: newEvents ?? 0,
        bountiesCompleted: 0,
        totalProjects: newProjects ?? 0,
      },
    };
  } catch (err) {
    console.error("[annual-report] Error generating report:", err);
    return null;
  }
}
