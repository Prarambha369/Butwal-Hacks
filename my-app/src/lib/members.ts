// ─── Member Profile Types ─────────────────────────────────────────

export interface ExplorerMember {
  bhId: string
  name: string
  role: "Builder" | "Mentor" | "Organizer" | "Sponsor"
  avatar: string
  bio: string
  skills: string[]
  projects: number
  events: number
  joined: string
  /** Opt-in flags from profiles (migration 031) — directory filter facets. */
  openToMentor: boolean
  lookingForTeam: boolean
}

// ─── Server-side Fetcher ──────────────────────────────────────────
// Queries Supabase for real profiles. Used by the explore page (server).
// Falls back to empty array when DB is unreachable.

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * DB roles are lowercase ('hacker', 'mentor', 'organizer', 'maintainer').
 * The directory speaks Builder/Mentor/Organizer/Sponsor, so normalize once
 * here — stats, role filter, and card pills all read ExplorerMember.role.
 */
export function toDisplayRole(dbRole: string | null): ExplorerMember["role"] {
  switch ((dbRole ?? "").toLowerCase()) {
    case "mentor":
      return "Mentor";
    case "organizer":
    case "maintainer":
      return "Organizer";
    case "sponsor":
      return "Sponsor";
    default:
      return "Builder";
  }
}

interface ProfileRow {
  id: string
  bh_id: string
  full_name: string
  role: string | null
  bio: string | null
  skills: string[] | null
  created_at: string
  looking_for_team?: boolean | null
  open_to_mentor?: boolean | null
}

export async function fetchExplorerMembers(
  supabase: SupabaseClient,
): Promise<ExplorerMember[]> {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(`
      id,
      bh_id,
      full_name,
      role,
      bio,
      skills,
      created_at,
      open_to_mentor,
      looking_for_team
    `)
    .not("bh_id", "is", null)
    .limit(100);

  if (error || !profiles) {
    console.error("Failed to fetch explorer members:", error?.message);
    return [];
  }

  // Batch-fetch project counts and event registrations for all returned profile
  // IDs. One pass per result set into a Map (O(n+m)) — the previous per-profile
  // `.filter()` scan was quadratic in (profiles × rows) and only stayed cheap
  // because both sides were ~100 rows.
  const profileIds = profiles.map((p: ProfileRow) => p.id);
  const projectCounts = new Map<string, number>();
  const eventCounts = new Map<string, number>();

  if (profileIds.length > 0) {
    const [projectAgg, eventAgg] = await Promise.all([
      supabase.from("projects").select("profile_id").in("profile_id", profileIds),
      supabase.from("event_registrations").select("profile_id").in("profile_id", profileIds),
    ]);

    for (const row of projectAgg.data ?? []) {
      const pid = row.profile_id;
      projectCounts.set(pid, (projectCounts.get(pid) ?? 0) + 1);
    }
    for (const row of eventAgg.data ?? []) {
      const pid = row.profile_id;
      eventCounts.set(pid, (eventCounts.get(pid) ?? 0) + 1);
    }
  }

  return (profiles as ProfileRow[]).map((p) => {
    const name = p.full_name || "Unnamed";
    const initials = name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return {
      bhId: p.bh_id || "",
      name,
      role: toDisplayRole(p.role),
      avatar: initials,
      bio: p.bio || "",
      skills: p.skills || [],
      projects: projectCounts.get(p.id) || 0,
      events: eventCounts.get(p.id) || 0,
      joined: p.created_at ? p.created_at.slice(0, 7) : "",
      openToMentor: p.open_to_mentor === true,
      lookingForTeam: p.looking_for_team === true,
    };
  });
}

// ─── Aggregated Stats (works on any ExplorerMember[]) ─────────────

export function getExplorerStats(members: ExplorerMember[]) {
  const total = members.length;
  const totalEvents = members.reduce((sum, m) => sum + m.events, 0);
  const totalProjects = members.reduce((sum, m) => sum + m.projects, 0);
  const byRole = {
    Builder: members.filter((m) => m.role === "Builder").length,
    Mentor: members.filter((m) => m.role === "Mentor").length,
    Organizer: members.filter((m) => m.role === "Organizer").length,
    Sponsor: members.filter((m) => m.role === "Sponsor").length,
  };

  return {
    total,
    totalEvents,
    totalProjects,
    byRole,
    openToMentor: members.filter((m) => m.openToMentor).length,
    lookingForTeam: members.filter((m) => m.lookingForTeam).length,
  };
}

// ─── Search & Filter Utilities ────────────────────────────────────

type ExplorerFilters = {
  role?: ExplorerMember["role"] | "All"
  query?: string
  sortBy?: "activity" | "projects" | "name" | "joined"
  /** Opt-in availability facets (profiles columns from migration 031). */
  openToMentor?: boolean
  lookingForTeam?: boolean
}

export function filterMembers(
  members: ExplorerMember[],
  filters: ExplorerFilters,
): ExplorerMember[] {
  let results = [...members];

  // Filter by role
  if (filters.role && filters.role !== "All") {
    results = results.filter((m) => m.role === filters.role);
  }

  // Search by BH-ID, name, skills, or bio
  if (filters.query && filters.query.trim()) {
    const q = filters.query.toLowerCase().trim();
    results = results.filter(
      (m) =>
        m.bhId.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.skills.some((s) => s.toLowerCase().includes(q)) ||
        m.bio.toLowerCase().includes(q),
    );
  }

  // Availability facets — only applied when enabled so an unchecked box
  // never hides anyone
  if (filters.openToMentor) {
    results = results.filter((m) => m.openToMentor);
  }
  if (filters.lookingForTeam) {
    results = results.filter((m) => m.lookingForTeam);
  }

  // Sort
  if (filters.sortBy) {
    results.sort((a, b) => {
      switch (filters.sortBy) {
        case "activity":
          return (b.projects + b.events) - (a.projects + a.events);
        case "projects":
          return b.projects - a.projects;
        case "name":
          return a.name.localeCompare(b.name);
        case "joined":
          return b.joined.localeCompare(a.joined);
        default:
          return 0;
      }
    });
  }

  return results;
}
