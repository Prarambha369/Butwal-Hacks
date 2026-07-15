import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/utils/supabase/service"
import { logger } from "@/lib/logger"

export const runtime = "edge"

interface SearchItem {
  type: "profile" | "project" | "event"
  id: string
  title: string
  subtitle: string
  href: string
}

export async function POST(req: NextRequest) {
  try {
    const { q } = await req.json()

    if (!q || typeof q !== "string" || q.trim().length < 2) {
      return NextResponse.json({ results: [] })
    }

    if (q.length > 100) {
      return NextResponse.json({ results: [] })
    }

    const term = `%${q.trim()}%`
    const limit = 4
    const supabase = createServiceClient()

    const [profilesRes, projectsRes, eventsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, bh_id")
        .or(`full_name.ilike.${term},bh_id.ilike.${term}`)
        .limit(limit),
      supabase
        .from("projects")
        .select("id, title")
        .or(`title.ilike.${term},description.ilike.${term}`)
        .limit(limit),
      supabase
        .from("events")
        .select("id, slug, title, start_date")
        .or(`title.ilike.${term},description.ilike.${term}`)
        .limit(limit),
    ])

    const results: SearchItem[] = []

    profilesRes.data?.forEach((p) => {
      results.push({
        type: "profile",
        id: p.id,
        title: p.full_name || "Unnamed",
        subtitle: p.bh_id || "",
        href: `/p/${p.bh_id || p.id}`,
      })
    })

    projectsRes.data?.forEach((p) => {
      results.push({
        type: "project",
        id: p.id,
        title: p.title,
        subtitle: "Project",
        href: `/projects/${p.id}`,
      })
    })

    eventsRes.data?.forEach((e) => {
      results.push({
        type: "event",
        id: e.id,
        title: e.title,
        subtitle: e.start_date
          ? new Date(e.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "Event",
        href: `/events/${e.slug}`,
      })
    })

    return NextResponse.json({ results })
  } catch (err) {
    logger.error("[api/search] Unexpected error:", err)
    return NextResponse.json({ results: [] }, { status: 500 })
  }
}
