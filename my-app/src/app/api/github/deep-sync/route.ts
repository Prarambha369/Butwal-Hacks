import { NextRequest, NextResponse } from "next/server"
import { auth0 } from "@/lib/auth0"
import { createServiceClient } from "@/utils/supabase"
import { logger } from "@/lib/logger"
import { withRateLimit } from "@/lib/rate-limiter"
import { revalidatePath } from "next/cache"
import { fetchRepoMeta } from "@/lib/github"

/**
 * POST /api/github/deep-sync
 *
 * Re-fetches GitHub metadata (stars, forks, commit count, README preview)
 * for all projects owned by the current user that have a github_url.
 * Updates the github_meta column in place.
 *
 * This is idempotent — run it anytime to refresh stale stats.
 */
export const POST = withRateLimit(async (_req: NextRequest) => {
  try {
    const session = await auth0.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.sub

    // Resolve profile
    const db = createServiceClient()
    const { data: profile } = await db
      .from("profiles")
      .select("id")
      .eq("auth0_user_id", userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 500 })
    }

    // Fetch all projects with github_url owned by this user
    const { data: projects } = await db
      .from("projects")
      .select("id, github_url")
      .eq("profile_id", profile.id)
      .not("github_url", "is", null)

    if (!projects || projects.length === 0) {
      return NextResponse.json({
        ok: true,
        updated: 0,
        total: 0,
        message: "No GitHub-linked projects found. Sync your repos first via /api/github/sync.",
      })
    }

    // ponytail: 15s route-level timeout — deep-sync can be slow with many repos.
    // Each internal fetchRepoMeta call already has per-fetch 5s timeouts.
    const DEEP_SYNC_TIMEOUT_MS = 15_000

    const results = await Promise.race([
      Promise.allSettled(
        projects.map(async (project) => {
          const meta = await fetchRepoMeta(project.github_url!)
          if (!meta) return null

          await db
            .from("projects")
            .update({
              github_meta: {
                stargazers_count: meta.stargazers_count,
                forks_count: meta.forks_count,
                commit_count: meta.commit_count,
                readme_preview: meta.readme_preview,
                pushed_at: meta.pushed_at,
                topics: meta.topics,
                language: meta.language,
              },
            })
            .eq("id", project.id)

          return project.id
        }),
      ),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Deep sync timed out after 15s")), DEEP_SYNC_TIMEOUT_MS),
      ),
    ]) as PromiseSettledResult<string | null>[]

    const updated = results.filter((r) => r.status === "fulfilled" && r.value !== null).length
    const failed = results.filter((r) => r.status === "rejected").length

    logger.info(`[github-deep-sync] Updated ${updated}/${projects.length} projects (${failed} failed)`)

    revalidatePath("/dashboard/hacker/projects")
    revalidatePath("/projects")

    return NextResponse.json({
      ok: true,
      updated,
      total: projects.length,
      failed,
      message: updated > 0
        ? `Refreshed metadata for ${updated} project${updated === 1 ? "" : "s"}.`
        : "No metadata refreshed. Repos may be private or unreachable.",
    })
  } catch (err) {
    logger.error("[github-deep-sync] unexpected error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}, "sensitive")
