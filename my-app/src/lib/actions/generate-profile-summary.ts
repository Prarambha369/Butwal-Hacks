"use server";

import { createServiceClient } from "@/utils/supabase/service";
import { auth0 } from "@/lib/auth0";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";

function buildPrompt(profile: {
  full_name: string
  bio: string | null
  skills: string[] | null
  github_username: string | null
  trust_markers: { title: string; description: string | null }[] | null
  projects: { title: string; description: string | null }[] | null
}): string {
  const parts: string[] = [
    `Name: ${profile.full_name}`,
  ]
  if (profile.bio) parts.push(`Bio: ${profile.bio}`)
  if (profile.skills?.length) parts.push(`Skills: ${profile.skills.join(", ")}`)
  if (profile.github_username) parts.push(`GitHub: https://github.com/${profile.github_username}`)
  if (profile.trust_markers?.length) {
    const markers = profile.trust_markers.map((m) => `${m.title}${m.description ? ` — ${m.description}` : ""}`).join("\n")
    parts.push(`Verified Achievements:\n${markers}`)
  }
  if (profile.projects?.length) {
    const projs = profile.projects.map((p) => `${p.title}${p.description ? `: ${p.description}` : ""}`).join("\n")
    parts.push(`Projects:\n${projs}`)
  }

  return [
    "You are writing a professional 'About Me' summary for a young technologist's profile on Butwal Hacks, a nonprofit tech community in Nepal.",
    "Write 2-3 punchy sentences in first-person that highlight their skills, achievements, and what drives them.",
    "Be specific about actual achievements (events won, projects built, skills demonstrated).",
    "Keep it concise — aim for 30-50 words. No fluff, no markdown, plain text only.",
    "Do not use phrases like 'I am passionate about' — show, don't tell.",
    "",
    "Here is their profile data:",
    ...parts.map((p) => `  ${p}`),
  ].join("\n")
}

export async function generateProfileSummary(profileId: string) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured. Set it in your .env.local file.")
  }

  const session = await auth0.getSession()
  if (!session?.user) throw new Error("Unauthorized")

  const supabase = createServiceClient()
  const userId = session.user.sub

  // Verify the profile belongs to the current user
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*, trust_markers(*), auth0_user_id")
    .eq("id", profileId)
    .single()

  if (profileError || !profile) throw new Error("Profile not found")
  if (profile.auth0_user_id !== userId) throw new Error("Not authorized to modify this profile")

  // Fetch recent projects
  const { data: projects } = await supabase
    .from("projects")
    .select("title, description")
    .eq("profile_id", profileId)
    .limit(5)

  const prompt = buildPrompt({
    full_name: profile.full_name,
    bio: profile.bio,
    skills: profile.skills,
    github_username: profile.github_username,
    trust_markers: profile.trust_markers,
    projects: projects ?? null,
  })

  let summary: string

  try {
    // 30s timeout — AI inference takes longer. Falls back gracefully with error message.
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      signal: AbortSignal.timeout(30_000),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        temperature: 0.7,
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      logger.error("[generate-profile-summary] Groq API error:", { status: res.status, body: errorText })
      throw new Error(`Groq API returned ${res.status}`)
    }

    const json = await res.json()
    summary = json.choices?.[0]?.message?.content?.trim()

    if (!summary) throw new Error("Empty response from Groq")
  } catch (err) {
    logger.error("[generate-profile-summary] Failed:", err)
    throw new Error("Failed to generate profile summary. Check your GROQ_API_KEY and try again.")
  }

  // Store the summary
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ ai_summary: summary })
    .eq("id", profileId)

  if (updateError) {
    logger.error("[generate-profile-summary] Failed to save summary:", updateError)
    throw new Error("Failed to save summary")
  }

  revalidatePath(`/p/${profile.bh_id}`)

  return { summary }
}
