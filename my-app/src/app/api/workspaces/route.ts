import { NextRequest, NextResponse } from "next/server"
import { auth0 } from "@/lib/auth0"
import { createServiceClient } from "@/utils/supabase"
import { withRateLimit } from "@/lib/rate-limiter"
import { z } from "zod"

// ─── Validation Schema ────────────────────────────────────────────────

const CreateWorkspaceSchema = z.object({
  team_id: z.string().uuid(),
  name: z.string().min(1).max(100),
})

// ─── Helpers ──────────────────────────────────────────────────────────

async function verifyTeamAccess(profileId: string, teamId: string) {
  const db = createServiceClient()
  const { data: membership } = await db
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("profile_id", profileId)
    .maybeSingle()
  return !!membership
}

// ─── GET /api/workspaces ──────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const session = await auth0.getSession()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = createServiceClient()

  const { data: profile } = await db
    .from("profiles")
    .select("id")
    .eq("auth0_user_id", session.user.sub)
    .single()

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const teamId = searchParams.get("team_id")

  if (!teamId) {
    return NextResponse.json({ error: "team_id is required" }, { status: 400 })
  }

  const hasAccess = await verifyTeamAccess(profile.id, teamId)
  if (!hasAccess) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  }

  const { data: workspaces, error } = await db
    .from("workspaces")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ workspaces }, {
    headers: { "Cache-Control": "private, max-age=60" },
  })
}

// ─── POST /api/workspaces ─────────────────────────────────────────────

export const POST = withRateLimit(async (request: NextRequest) => {
  const session = await auth0.getSession()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = createServiceClient()

  const { data: profile } = await db
    .from("profiles")
    .select("id, role")
    .eq("auth0_user_id", session.user.sub)
    .single()

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = CreateWorkspaceSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const hasAccess = await verifyTeamAccess(profile.id, parsed.data.team_id)
  if (!hasAccess) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  }

  const { data: workspace, error } = await db
    .from("workspaces")
    .insert({
      team_id: parsed.data.team_id,
      name: parsed.data.name,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ workspace }, { status: 201 })
}, "user_action")
