// ─── Member Profile Types ─────────────────────────────────────────

export interface ExplorerMember {
  bhId: string
  name: string
  role: "Builder" | "Mentor" | "Organizer" | "Sponsor"
  avatar: string
  bio: string
  skills: string[]
  xp: number // kept internally for sort signal; not displayed
  projects: number
  events: number
  joined: string
  /** Auth0 user ID for live presence matching. */
  auth0_user_id?: string
}

// ─── Server-side Fetcher ──────────────────────────────────────────
// Queries Supabase for real profiles. Used by the explore page (server).
// Falls back to empty array when DB is unreachable.

import type { SupabaseClient } from "@supabase/supabase-js";

interface ProfileRow {
  id: string
  bh_id: string
  full_name: string
  role: string | null
  bio: string | null
  skills: string[] | null
  xp: number | null
  created_at: string
  auth0_user_id?: string | null
  project_count?: number
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
      xp,
      created_at,
      auth0_user_id
    `)
    .not("bh_id", "is", null)
    .order("xp", { ascending: false })
    .limit(100);

  if (error || !profiles) {
    console.error("Failed to fetch explorer members:", error?.message);
    return [];
  }

  // Batch-fetch project counts and event registrations for all returned profile IDs
  const profileIds = profiles.map((p: ProfileRow) => p.id);
  const projectCounts = new Map<string, number>();
  const eventCounts = new Map<string, number>();

  if (profileIds.length > 0) {
    const [projectAgg, eventAgg] = await Promise.all([
      supabase.from("projects").select("profile_id").in("profile_id", profileIds),
      supabase.from("event_registrations").select("profile_id").in("profile_id", profileIds),
    ]);

    if (projectAgg.data) {
      for (const pid of profileIds) {
        projectCounts.set(
          pid,
          projectAgg.data.filter((p: { profile_id: string }) => p.profile_id === pid).length,
        );
      }
    }
    if (eventAgg.data) {
      for (const pid of profileIds) {
        eventCounts.set(
          pid,
          eventAgg.data.filter((e: { profile_id: string }) => e.profile_id === pid).length,
        );
      }
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
      role: (p.role as ExplorerMember["role"]) || "Builder",
      avatar: initials,
      bio: p.bio || "",
      skills: p.skills || [],
      xp: p.xp || 0,
      projects: projectCounts.get(p.id) || 0,
      events: eventCounts.get(p.id) || 0,
      joined: p.created_at ? p.created_at.slice(0, 7) : "",
      auth0_user_id: p.auth0_user_id || undefined,
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

  return { total, totalEvents, totalProjects, byRole };
}

// ─── Search & Filter Utilities ────────────────────────────────────

export type ExplorerFilters = {
  role?: ExplorerMember["role"] | "All"
  query?: string
  sortBy?: "activity" | "projects" | "name" | "joined"
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
