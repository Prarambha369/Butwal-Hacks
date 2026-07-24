import { NextRequest, NextResponse } from "next/server"
import { auth0 } from "@/lib/auth0"
import { createServiceClient } from "@/utils/supabase/service"
import { logger } from "@/lib/logger"
import { withRateLimit } from "@/lib/rate-limiter"
import { revalidatePath } from "next/cache"
import { captureServerEvent } from "@/lib/analytics/server"
import { fetchRepoMeta } from "@/lib/github"

// ponytail: single endpoint. Fetches public repos from GitHub API via a stored
// GitHub token in the profiles table. Users must connect GitHub through the
// dashboard settings, which stores the token directly in Supabase.

export const POST = withRateLimit(async (_req: NextRequest) => {
  try {
    const session = await auth0.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.sub

    // Look up GitHub token from profiles table
    const db = createServiceClient()
    const { data: profile } = await db
      .from("profiles")
      .select("id, github_token, github_username")
      .eq("auth0_user_id", userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 500 })
    }

    if (!profile.github_token) {
      return NextResponse.json(
        { error: "No GitHub token found. Connect GitHub in your dashboard settings first." },
        { status: 400 },
      )
    }

    // ── Fetch repos from GitHub API ────────────────────────────
    // ponytail: 15s timeout — GitHub API can be slow for accounts with many repos. Returns 502 on timeout.
    const reposRes = await fetch("https://api.github.com/user/repos?sort=updated&per_page=50&type=public", {
      signal: AbortSignal.timeout(15_000),
      headers: {
        Authorization: `Bearer ${profile.github_token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "ButwalHacks/1.0",
      },
    })

    if (!reposRes.ok) {
      const errText = await reposRes.text()
      logger.error("[github-sync] GitHub API error:", reposRes.status, errText)
      return NextResponse.json({ error: "GitHub API error. Token may be expired." }, { status: 502 })
    }

    const repos: {
      id: number
      name: string
      description: string | null
      html_url: string
      homepage: string | null
      language: string | null
      topics: string[]
      fork: boolean
    }[] = await reposRes.json()

    if (repos.length === 0) {
      return NextResponse.json({ ok: true, synced: 0, total: 0, message: "No public repos found." })
    }

    // ── Import repos as projects ───────────────────────────────
    // Update github_username if not set
    const ghUsername = repos[0]?.html_url?.split("/")[3]
    if (ghUsername && !profile.github_username) {
      await db.from("profiles").update({ github_username: ghUsername }).eq("id", profile.id)
    }

    // Get existing github URLs to avoid duplicates
    const { data: existing } = await db
      .from("projects")
      .select("github_url")

    const existingUrls = new Set(existing?.map((p) => p.github_url) ?? [])

    let synced = 0
    let metaSynced = 0
    // ponytail: repos are paginated at 50. If a hacker has more, they can sync again.
    for (const repo of repos) {
      if (repo.fork) continue // Skip forks
      if (existingUrls.has(repo.html_url)) continue // Already imported

      const techStack: string[] = []
      if (repo.language) techStack.push(repo.language)
      repo.topics.forEach((t) => {
        if (!techStack.includes(t)) techStack.push(t)
      })

      // Fetch deep GitHub metadata for each new repo
      let githubMeta: Record<string, unknown> | null = null
      try {
        const meta = await fetchRepoMeta(repo.html_url)
        if (meta) {
          githubMeta = {
            stargazers_count: meta.stargazers_count,
            forks_count: meta.forks_count,
            commit_count: meta.commit_count,
            readme_preview: meta.readme_preview,
            pushed_at: meta.pushed_at,
            topics: meta.topics,
            language: meta.language,
          }
          metaSynced++
        }
      } catch {
        // Best-effort — metadata is optional
      }

      const { error: insertError } = await db.from("projects").insert({
        profile_id: profile.id,
        title: repo.name,
        description: repo.description || `A ${repo.language || "project"} on GitHub`,
        github_url: repo.html_url,
        demo_url: repo.homepage || null,
        tech_stack: techStack,
        github_verified: false,
        github_meta: githubMeta,
      })

      if (insertError) {
        logger.warn("[github-sync] insert error for", repo.name, insertError)
        continue
      }
      synced++
    }

    logger.info(`[github-sync] Synced ${synced}/${repos.length} repos, meta for ${metaSynced}`)
    await captureServerEvent('github_sync_completed', userId, {
      synced_count: synced,
      meta_synced: metaSynced,
      total_repos: repos.filter((r) => !r.fork).length,
    });
    revalidatePath("/dashboard/hacker/projects")
    revalidatePath("/projects")

    return NextResponse.json({
      ok: true,
      synced,
      metaSynced,
      total: repos.filter((r) => !r.fork).length,
      message: synced > 0
        ? `Imported ${synced} project${synced === 1 ? "" : "s"} from GitHub.`
        : "All repos already imported.",
    })
  } catch (err) {
    logger.error("[github-sync] unexpected error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}, "sensitive")
