"use server"

import { createAuthenticatedClient } from "@/utils/supabase/server"
import { logger } from "@/lib/logger"
import { revalidatePath } from "next/cache"

interface CredentialRule {
  type: "tech_count" | "tech_categories" | "github_verified" | "unique_tech_count" | "event_count" | "project_count"
  tech?: string
  categories?: string[]
  min_count: number
}

interface Credential {
  id: string
  name: string
  description: string
  icon: string
  category: string
  rules: CredentialRule
  xp_reward: number
}

/** Fetch a hacker's projects and check which new credentials they qualify for. */
export async function checkMicroCredentials() {
  const authClient = await createAuthenticatedClient()
  if (!authClient) throw new Error("Unauthorized")
  const { supabase, userId } = authClient

  // 1. Get profile ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth0_user_id", userId)
    .single()
  if (!profile) throw new Error("Profile not found")

  const profileId = profile.id

  // 2. Fetch all credentials and already-unlocked ones
  const [credsRes, unlockedRes] = await Promise.all([
    supabase.from("micro_credentials").select("*"),
    supabase
      .from("profile_micro_credentials")
      .select("credential_id")
      .eq("profile_id", profileId),
  ])

  const credentials = (credsRes.data ?? []) as Credential[]
  const unlockedIds = new Set((unlockedRes.data ?? []).map((u: { credential_id: string }) => u.credential_id))

  // 3. Fetch projects and registrations for qualification checks
  const [projectsRes, registrationsRes] = await Promise.all([
    supabase.from("projects").select("tech_stack, github_verified").eq("profile_id", profileId),
    supabase.from("event_registrations").select("event_id").eq("profile_id", profileId),
  ])

  const projects = projectsRes.data ?? []
  const registrations = registrationsRes.data ?? []
  const registeredEventIds = new Set(registrations.map((r: { event_id: string }) => r.event_id))

  // 4. Evaluate each credential
  const newlyUnlocked: { id: string; name: string; icon: string }[] = []

  for (const cred of credentials) {
    if (unlockedIds.has(cred.id)) continue

    const rule = cred.rules
    let qualified = false

    switch (rule.type) {
      case "tech_count": {
        const tech = rule.tech!.toLowerCase()
        const count = projects.filter((p) =>
          (p.tech_stack ?? []).some((t: string) => t.toLowerCase().includes(tech)),
        ).length
        qualified = count >= rule.min_count
        break
      }
      case "github_verified": {
        const count = projects.filter((p) => p.github_verified).length
        qualified = count >= rule.min_count
        break
      }
      case "unique_tech_count": {
        const unique = new Set<string>()
        projects.forEach((p) => (p.tech_stack ?? []).forEach((t: string) => unique.add(t.toLowerCase())))
        qualified = unique.size >= rule.min_count
        break
      }
      case "project_count": {
        qualified = projects.length >= rule.min_count
        break
      }
      case "event_count": {
        qualified = registeredEventIds.size >= rule.min_count
        break
      }
      case "tech_categories": {
        // Simple category detection by keyword matching
        const allTechs = new Set<string>()
        projects.forEach((p) => (p.tech_stack ?? []).forEach((t: string) => allTechs.add(t.toLowerCase())))

        const frontend = ["react", "vue", "angular", "svelte", "html", "css", "javascript", "typescript", "tailwind", "next.js"]
        const backend = ["node", "express", "python", "django", "flask", "go", "rust", "ruby", "php", "java", "spring", "postgresql", "mongodb", "graphql", "supabase"]

        let matches = 0
        const userTechs = Array.from(allTechs)

        if (rule.categories?.includes("Frontend") && userTechs.some((t) => frontend.includes(t))) matches++
        if (rule.categories?.includes("Backend") && userTechs.some((t) => backend.includes(t))) matches++
        if (rule.categories?.includes("Database") && userTechs.some((t) => ["postgresql", "mongodb", "sqlite", "supabase", "redis"].includes(t))) matches++
        if (rule.categories?.includes("DevOps") && userTechs.some((t) => ["docker", "kubernetes", "ci/cd", "aws", "gcp", "vercel"].includes(t))) matches++

        qualified = matches >= rule.min_count
        break
      }
    }

    if (qualified) {
      newlyUnlocked.push({ id: cred.id, name: cred.name, icon: cred.icon })

      // Insert credential
      await supabase.from("profile_micro_credentials").insert({
        profile_id: profileId,
        credential_id: cred.id,
        progress: {},
      })

      // Award XP
      if (cred.xp_reward > 0) {
        const { error: xpErr } = await supabase.rpc("increment_xp", {
          p_profile_id: profileId,
          p_amount: cred.xp_reward,
        })
        if (xpErr) logger.error("[micro-credentials] XP error:", xpErr)
      }
    }
  }

  if (newlyUnlocked.length > 0) {
    revalidatePath(`/dashboard/hacker`)
    revalidatePath(`/p/${profileId}`)
  }

  return {
    newlyUnlocked,
    totalUnlocked: unlockedIds.size + newlyUnlocked.length,
  }
}

/** Fetch all credentials for display, with their unlock status for a profile. */
export async function getMicroCredentials(profileId?: string) {
  const supabase = (await createAuthenticatedClient())?.supabase
  if (!supabase) throw new Error("Unauthorized")

  const { data: credentials } = await supabase.from("micro_credentials").select("*").order("sort_order")

  if (!profileId) return { credentials: credentials ?? [] }

  const { data: unlocked } = await supabase
    .from("profile_micro_credentials")
    .select("credential_id, unlocked_at")
    .eq("profile_id", profileId)

  const unlockedMap = new Map((unlocked ?? []).map((u) => [u.credential_id, u.unlocked_at]))

  return {
    credentials: (credentials ?? []).map((c) => ({
      ...c,
      unlocked: unlockedMap.has(c.id),
      unlockedAt: unlockedMap.get(c.id) ?? null,
    })),
  }
}
