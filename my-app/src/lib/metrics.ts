/**
 * Shared annual report metrics — single source of truth for SQL aggregation.
 *
 * Both the API route (maintainer endpoint) and the public page import from here
 * instead of duplicating identical Supabase count queries.
 */

import { createServiceClient } from "@/utils/supabase/service"
import { createClient } from "@/utils/supabase/server"

export interface YearMetrics {
  year: number
  generatedAt: string
  summary: {
    newUsers: number
    newEvents: number
    newProjects: number
    newTeams: number
    trustMarkersIssued: number
    microCredentialsAwarded: number
    eventRegistrations: number
    totalXpAwarded: number
  }
  topHackers: { bh_id: string; full_name: string; xp: number }[]
  monthlySignups: { month: number; count: number }[]
  communityMetrics: {
    activeChapters: number
    sponsorOrganizations: number
    bountyCompleted: number
    totalEventsHeld: number
  }
}

export async function getYearMetrics(year: number, useServiceRole = false): Promise<YearMetrics | null> {
  try {
    const db = useServiceRole ? createServiceClient() : createClient()
    const startDate = `${year}-01-01T00:00:00Z`
    const endDate = `${year + 1}-01-01T00:00:00Z`

    const [
      { count: newProfiles },
      { count: newEvents },
      { count: newProjects },
      { count: newTeams },
      { count: newMarkers },
      { count: newCredentials },
      { count: newRegistrations },
      { data: xpData },
      { data: topHackers },
      { count: activeChapters },
      { count: sponsorOrganizations },
    ] = await Promise.all([
      db.from("profiles").select("*", { count: "exact", head: true })
        .gte("created_at", startDate).lt("created_at", endDate),
      db.from("events").select("*", { count: "exact", head: true })
        .gte("created_at", startDate).lt("created_at", endDate),
      db.from("projects").select("*", { count: "exact", head: true })
        .gte("created_at", startDate).lt("created_at", endDate),
      db.from("teams").select("*", { count: "exact", head: true })
        .gte("created_at", startDate).lt("created_at", endDate),
      db.from("trust_markers").select("*", { count: "exact", head: true })
        .gte("created_at", startDate).lt("created_at", endDate),
      db.from("profile_micro_credentials").select("*", { count: "exact", head: true })
        .gte("created_at", startDate).lt("created_at", endDate),
      db.from("event_registrations").select("*", { count: "exact", head: true })
        .gte("created_at", startDate).lt("created_at", endDate),
      db.from("profiles").select("xp")
        .gte("created_at", startDate).lt("created_at", endDate),
      db.from("profiles").select("bh_id, full_name, xp")
        .order("xp", { ascending: false }).limit(10),
      db.from("chapters").select("*", { count: "exact", head: true }),
      db.from("sponsor_profiles").select("*", { count: "exact", head: true }),
    ])

    const totalXpAwarded = xpData?.reduce((sum, p) => sum + (p.xp ?? 0), 0) ?? 0

    const { data: monthlyProfiles } = await db
      .from("profiles")
      .select("created_at")
      .gte("created_at", startDate)
      .lt("created_at", endDate)

    const monthlySignups = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const count = monthlyProfiles?.filter((p) => {
        const d = new Date(p.created_at)
        return d.getMonth() + 1 === month
      }).length ?? 0
      return { month, count }
    })

    return {
      year,
      generatedAt: new Date().toISOString(),
      summary: {
        newUsers: newProfiles ?? 0,
        newEvents: newEvents ?? 0,
        newProjects: newProjects ?? 0,
        newTeams: newTeams ?? 0,
        trustMarkersIssued: newMarkers ?? 0,
        microCredentialsAwarded: newCredentials ?? 0,
        eventRegistrations: newRegistrations ?? 0,
        totalXpAwarded,
      },
      topHackers: topHackers ?? [],
      monthlySignups,
      communityMetrics: {
        activeChapters: activeChapters ?? 0,
        sponsorOrganizations: sponsorOrganizations ?? 0,
        bountyCompleted: 0,
        totalEventsHeld: newEvents ?? 0,
      },
    }
  } catch {
    return null
  }
}
