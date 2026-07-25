import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServiceClient } from "@/utils/supabase"
import { logger } from "@/lib/logger"
import { withRateLimit } from "@/lib/rate-limiter"

export const runtime = "edge"

interface SearchItem {
  type: "profile" | "project" | "event"
  id: string
  title: string
  subtitle: string
  href: string
}

const searchSchema = z.object({
  q: z.string().transform(v => v.trim()).pipe(z.string().min(2).max(100)),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(4),
})

export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({}))
    const parsed = searchSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ results: [] })
    }

    const { q, page, limit } = parsed.data
    const term = `%${q}%`
    const from = (page - 1) * limit
    const to = from + limit - 1

    const supabase = createServiceClient()

    const [profilesRes, projectsRes, eventsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, bh_id")
        .or(`full_name.ilike.${term},bh_id.ilike.${term}`)
        .range(from, to),
      supabase
        .from("projects")
        .select("id, title")
        .or(`title.ilike.${term},description.ilike.${term}`)
        .range(from, to),
      supabase
        .from("events")
        .select("id, slug, title, start_date")
        .or(`title.ilike.${term},description.ilike.${term}`)
        .range(from, to),
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

    const hasMore =
      (profilesRes.data?.length ?? 0) >= limit ||
      (projectsRes.data?.length ?? 0) >= limit ||
      (eventsRes.data?.length ?? 0) >= limit

    return NextResponse.json({ results, page, limit, hasMore })
  } catch (err) {
    logger.error("[api/search] Unexpected error:", err)
    return NextResponse.json({ results: [] }, { status: 500 })
  }
}, "frequent")
