"use server";

import { createAuthenticatedClient } from "@/utils/supabase/server";
import { logger } from "@/lib/logger";

interface MatchResult {
  profileId: string
  name: string
  bh_id: string
  skills: string[]
  reason: string
}

export async function getAITeamRecommendations(): Promise<MatchResult[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");

  const authClient = await createAuthenticatedClient();
  if (!authClient) throw new Error("Unauthorized");

  const { supabase, userId } = authClient;

  // 1. Get current user's profile and skills
  const { data: me } = await supabase
    .from("profiles")
    .select("id, skills, full_name, auth0_user_id")
    .eq("auth0_user_id", userId)
    .single();

  if (!me) throw new Error("Profile not found");

  const mySkills: string[] = me.skills ?? [];

  // 2. Fetch other profiles with their skills
  const { data: others } = await supabase
    .from("profiles")
    .select("id, full_name, bh_id, skills, bio")
    .neq("auth0_user_id", userId)
    .limit(50);

  if (!others || others.length === 0) return [];

  // 3. Build a compact prompt with skills data
  const mySkillsLine = mySkills.length > 0
    ? `My skills: ${mySkills.join(", ")}`
    : "No skills listed yet.";

  const candidates = others
    .filter((p) => p.skills && p.skills.length > 0)
    .slice(0, 20)
    .map(
      (p) =>
        `- ID: ${p.id} — ${p.full_name} (${p.bh_id}): skills [${p.skills?.join(", ") ?? ""}]${p.bio ? ` — "${p.bio.slice(0, 80)}"` : ""}`,
    )
    .join("\n");

  if (!candidates) return [];

  const prompt = [
    "You are an AI team-builder for Butwal Hacks, a Nepali youth tech community.",
    "Given my skills and a list of potential teammates, recommend 3 people who would complement me best.",
    "Look for complementary skills (e.g. if I'm frontend, recommend backend or UI/UX).",
    "Return ONLY a JSON array — no markdown, no explanation outside the JSON.",
    "Each object: { \"profileId\": \"the UUID from the ID: field\", \"reason\": \"why they're a good match (1 sentence)\" }",
    "",
    mySkillsLine,
    "",
    "Available hackers:",
    candidates,
  ].join("\n");

  try {
    // ponytail: 30s timeout — AI inference takes longer. Falls back gracefully.
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
        max_tokens: 500,
        temperature: 0.5,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      logger.error("[ai-team-match] Groq API error:", { status: res.status, body: errorText });
      throw new Error(`Groq API returned ${res.status}`);
    }

    const json = await res.json();
    const raw = json.choices?.[0]?.message?.content?.trim() ?? "";

    // Strip markdown code block wrapping if present (common LLM behavior)
    const cleaned = raw.replace(/```(?:json)?\n?/gi, "").trim();
    const parsed = JSON.parse(cleaned) as { profileId: string; reason: string }[];

    // Map back to full profile data
    const results: MatchResult[] = parsed
      .map((r) => {
        const profile = others.find((p) => p.id === r.profileId);
        if (!profile) return null;
        return {
          profileId: profile.id,
          name: profile.full_name,
          bh_id: profile.bh_id,
          skills: profile.skills ?? [],
          reason: r.reason,
        };
      })
      .filter((r): r is MatchResult => r !== null)
      .slice(0, 3);

    return results;
  } catch (err) {
    logger.error("[ai-team-match] Failed:", err);
    throw new Error("Failed to get AI recommendations");
  }
}
