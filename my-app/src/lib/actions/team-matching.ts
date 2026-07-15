"use server";

import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase/service";

/**
 * AI Team Matching — find potential teammates based on shared skills,
 * tech stack, and event participation.
 *
 * ponytail: Simple overlap scoring. No vector DB needed for MVP.
 */

export interface TeammateCandidate {
  id: string;
  full_name: string;
  bh_id: string;
  role: string;
  xp: number;
  avatar_url: string | null;
  bio: string | null;
  skills: string[];
  social_links: Record<string, string>;
  matchScore: number;
  matchReasons: string[];
  commonEvents: string[];
}

export interface TeamMatchResult {
  candidates: TeammateCandidate[];
  yourSkills: string[];
}

/**
 * Find matching teammates for the current user.
 * Scores are based on skill overlap + shared tech interests.
 */
export async function findTeammates(): Promise<TeamMatchResult> {
  const session = await auth0.getSession();
  if (!session?.user) throw new Error("You must be signed in");

  const supabase = createServiceClient();

  // Get current user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, skills, social_links, bh_id, xp, bio")
    .eq("auth0_user_id", session.user.sub)
    .single();

  if (!profile) throw new Error("Profile not found");

  const mySkills: string[] = profile.skills ?? [];
  const myId = profile.id;

  // Get other hackers (exclude self)
  const { data: others } = await supabase
    .from("profiles")
    .select(`
      id, full_name, bh_id, role, xp, avatar_url, bio, skills, social_links
    `)
    .neq("id", myId)
    .eq("is_claimed", true)
    .limit(50);

  if (!others || others.length === 0) {
    return { candidates: [], yourSkills: mySkills };
  }

  // Score each candidate
  const candidates: TeammateCandidate[] = others.map((other) => {
    const otherSkills: string[] = other.skills ?? [];
    const reasons: string[] = [];
    const commonEvents: string[] = [];

    // Skill overlap
    const commonSkills = mySkills.filter((s) =>
      otherSkills.some((os) => os.toLowerCase() === s.toLowerCase())
    );

    if (commonSkills.length > 0) {
      reasons.push(`Shared skills: ${commonSkills.slice(0, 3).join(", ")}${commonSkills.length > 3 ? "..." : ""}`);
    }

    // Compute a simple match score (0-100)
    let score = 0;
    if (mySkills.length > 0 && otherSkills.length > 0) {
      score += (commonSkills.length / Math.max(mySkills.length, otherSkills.length)) * 60;
    }

    // XP proximity bonus
    const xpDiff = Math.abs((profile.xp ?? 0) - (other.xp ?? 0));
    if (xpDiff < 500) {
      score += 20;
      reasons.push("Similar experience level");
    }

    // Bio-based match (keyword overlap)
    const myBio = profile.bio ?? "";
    const otherBio = other.bio ?? "";
    if (myBio && otherBio) {
      const myWords = new Set(myBio.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4));
      const otherWords = otherBio.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4);
      const commonWords = [...myWords].filter((w) => otherWords.includes(w));
      if (commonWords.length > 0) {
        score += 10;
        reasons.push("Shared interests in bio");
      }
    }

    // Bonus for having any skills listed
    if (otherSkills.length > 0) score += 10;

    return {
      id: other.id,
      full_name: other.full_name ?? "Unnamed",
      bh_id: other.bh_id ?? "",
      role: other.role ?? "hacker",
      xp: other.xp ?? 0,
      avatar_url: other.avatar_url,
      bio: other.bio,
      skills: otherSkills,
      social_links: (other.social_links ?? {}) as Record<string, string>,
      matchScore: Math.round(Math.min(score, 100)),
      matchReasons: reasons,
      commonEvents,
    };
  });

  // Sort by match score descending
  candidates.sort((a, b) => b.matchScore - a.matchScore);

  return {
    candidates: candidates.filter((c) => c.matchScore > 0).slice(0, 12),
    yourSkills: mySkills,
  };
}
