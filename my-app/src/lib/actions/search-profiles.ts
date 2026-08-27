"use server";

import { createServiceClient } from "@/utils/supabase";
import { logger } from "@/lib/logger";

export interface TalentSearchResult {
  id: string;
  display_name: string;
  slug_id: string;
  avatar_url: string | null;
  bio: string | null;
  xp: number;
  trust_marker_count: number;
  top_markers: { title: string; type: string }[];
}

export interface TalentSearchFilters {
  query?: string;
  markerType?: string;
  skill?: string;
}

// ── Guaranteed columns from 001_initial_schema.sql ───────────────────────
// profiles: id, slug_id, email, role, is_claimed, github_username, bio,
//           avatar_url, xp, is_suspended, created_at
// trust_markers: id, profile_id, issuer_id, event_id, type, title,
//                description, is_revoked, revocation_reason,
//                crypto_signature, created_at
// Later migrations (004, 005, 031) add full_name, bh_id, skills,
// looking_for_team — these may NOT be applied, so we don't depend on them.

const BASE_PROFILE_COLS = "id, slug_id, bio, avatar_url, xp";
const PROFILE_COLS_WITH_SKILLS = "id, slug_id, bio, avatar_url, xp, skills";

/**
 * Search claimed hacker profiles with text and marker-type filters.
 * Only uses columns guaranteed by migration 001_initial_schema.sql.
 */
export async function searchTalent(
  filters: TalentSearchFilters = {},
  limit = 50
): Promise<TalentSearchResult[]> {
  try {
    const supabase = createServiceClient();  // ── Step 1: Query profiles — include skills when filtering by skill
  // This avoids a second full-table scan when skill filter is active.
  const selectCols = filters.skill ? PROFILE_COLS_WITH_SKILLS : BASE_PROFILE_COLS;
  let query = supabase
    .from("profiles")
    .select(selectCols)
    .eq("is_claimed", true)
    .neq("role", "maintainer")
    .order("xp", { ascending: false })
    .limit(limit);

  if (filters.query && filters.query.trim().length >= 2) {
    const term = `%${filters.query.trim()}%`;
    query = query.or(`slug_id.ilike.${term},bio.ilike.${term}`);
  }

  const { data: profiles, error } = await query;

  if (error) {
    logger.error("[search-talent] Profiles query error:", error);
    return [];
  }

  if (!profiles || profiles.length === 0) return [];

  let typedProfiles: any[] = profiles as any[];

  // ── Skill-based post-filter (in-memory, no extra DB call) ────────
  if (filters.skill && filters.skill.trim().length >= 2) {
    const skillTerm = filters.skill.trim().toLowerCase();
    typedProfiles = typedProfiles.filter((p) =>
      p.skills?.some((s: string) => s.toLowerCase().includes(skillTerm))
    );
  }

  // ── Step 2: Batch-fetch trust_markers for all matched profiles ──
    const profileIds = typedProfiles.map((p) => p.id);
    const { data: markers } = await supabase
      .from("trust_markers")
      .select("profile_id, title, type")
      .in("profile_id", profileIds)
      .eq("is_revoked", false);

    // Index markers by profile_id
    const markersByProfile: Record<string, { title: string; type: string }[]> = {};
    if (markers) {
      for (const m of markers) {
        if (!markersByProfile[m.profile_id]) markersByProfile[m.profile_id] = [];
        markersByProfile[m.profile_id].push({ title: m.title, type: m.type });
      }
    }

    // ── Step 3: Merge and post-filter ─────────────────────────────────
    let results: TalentSearchResult[] = typedProfiles.map((p) => {
      const profileMarkers = markersByProfile[p.id] ?? [];

      return {
        id: p.id,
        display_name: p.slug_id ?? "Unnamed",
        slug_id: p.slug_id ?? "",
        avatar_url: p.avatar_url,
        bio: p.bio,
        xp: p.xp ?? 0,
        trust_marker_count: profileMarkers.length,
        top_markers: profileMarkers.slice(0, 3),
      };
    });

    if (filters.markerType) {
      results = results.filter((r) =>
        r.top_markers.some((m) => m.type === filters.markerType)
      );
    }

    return results;
  } catch (err) {
    logger.error("[search-talent] Unexpected error:", err);
    return [];
  }
}
