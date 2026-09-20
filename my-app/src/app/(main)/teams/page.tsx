import Link from "next/link";
import Image from "next/image";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";
import { getAvatarUrl } from "@/lib/utils";
import { Users, Plus, ChevronRight, UserPlus, CalendarDays, Camera } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { buildPageMetadata } from "@/lib/seo"


export const metadata = buildPageMetadata({title: "Teams", description: "The teams behind Butwal Hacks events. See who built what, with whom.", path: "/teams", keywords: []});

export const dynamic = "force-dynamic";

interface ShowcaseMember {
  bh_id: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

interface ShowcaseTeam {
  id: string;
  name: string;
  description: string | null;
  members: ShowcaseMember[];
}

interface ShowcaseEvent {
  id: string;
  title: string;
  slug: string | null;
  teams: ShowcaseTeam[];
}

/**
 * Teams index — reframed as the public showcase of organizer teams behind
 * each event: per event, its teams, their members (linked profiles), and a
 * path to the event's photos. Team names/descriptions stay editable by
 * team leads in the dashboard; maintainers can remove teams outright.
 * Signed-in members additionally see their pending invites here.
 */
export default async function TeamsPage() {
  const session = await auth0.getSession().catch(() => null);
  const supabase = createServiceClient();

  // Published events, newest first — the backbone of the showcase.
  const { data: dbEvents } = await supabase
    .from("events")
    .select("id, title, slug, start_date")
    .eq("is_published", true)
    .order("start_date", { ascending: false })
    .limit(20);

  const eventIds = (dbEvents ?? []).map((e) => e.id);

  // Teams attached to those events.
  const { data: dbTeams } = eventIds.length > 0
    ? await supabase
        .from("teams")
        .select("id, name, description, event_id")
        .in("event_id", eventIds)
    : { data: [] as Array<{ id: string; name: string; description: string | null; event_id: string | null }> };

  const teamIds = (dbTeams ?? []).map((t) => t.id);

  // Members of those teams (public profile columns only).
  const { data: dbMembers } = teamIds.length > 0
    ? await supabase
        .from("team_members")
        .select("team_id, profiles!inner(bh_id, full_name, avatar_url)")
        .in("team_id", teamIds)
    : { data: [] as Array<{ team_id: string; profiles: unknown }> };

  const membersByTeam = new Map<string, ShowcaseMember[]>();
  for (const row of dbMembers ?? []) {
    const p = row.profiles as unknown as ShowcaseMember;
    const list = membersByTeam.get(row.team_id) ?? [];
    list.push({ bh_id: p?.bh_id ?? null, full_name: p?.full_name ?? null, avatar_url: p?.avatar_url ?? null });
    membersByTeam.set(row.team_id, list);
  }

  const showcase: ShowcaseEvent[] = (dbEvents ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    slug: e.slug,
    teams: (dbTeams ?? [])
      .filter((t) => t.event_id === e.id)
      .map((t) => ({ id: t.id, name: t.name, description: t.description, members: membersByTeam.get(t.id) ?? [] })),
  })).filter((e) => e.teams.length > 0);

  // Pending invites for the signed-in member (personal layer).
  let invitesSection = null;
  if (session?.user?.sub) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth0_user_id", session.user.sub)
      .single();
    if (profile) {
      const { data: invites } = await supabase
        .from("team_invites")
        .select("id, status, teams!inner(id, name)")
        .eq("profile_id", profile.id)
        .eq("status", "pending");
      if (invites && invites.length > 0) {
        invitesSection = (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-status-yellow flex items-center gap-2">
              <UserPlus size={14} />
              Pending Invitations ({invites.length})
            </h3>
            <div className="space-y-2">
              {invites.map((invite) => {
                const team = invite.teams as unknown as { id: string; name: string };
                return (
                  <div key={invite.id} className="bh-card px-5 py-3 border border-status-yellow/20 flex items-center justify-between">
                    <p className="text-sm font-bold text-primary">Invitation to join {team.name}</p>
                    <Link href={`/teams/${team.id}`} className="text-xs font-bold text-primary-red hover:text-primary-red/70 transition-colors">
                      View →
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
    }
  }

  return (
    <div className="space-y-10 p-6 md:p-12">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Teams behind the events</h1>
          <p className="text-secondary">
            Who built what, with whom — organizer teams for every event.
          </p>
        </div>
        <Link href="/teams/create" className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
          <Plus size={16} /> New Team
        </Link>
      </div>

      {invitesSection}

      {showcase.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="No event teams yet"
          description="Teams appear here once organizers attach them to a published event. Create your own or find teammates."
          actions={[
            { label: "Create a team", href: "/teams/create", variant: "primary" },
            { label: "Find teammates", href: "/dashboard/hacker/team-matching", variant: "secondary" },
          ]}
          hint="Use AI Team Matching to find complementary teammates"
        />
      ) : (
        <div className="space-y-12">
          {showcase.map((event) => (
            <section key={event.id} aria-label={event.title}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-primary-red" />
                  {event.slug ? (
                    <Link href={`/events/${event.slug}`} className="hover:text-primary-red transition-colors">
                      {event.title}
                    </Link>
                  ) : (
                    event.title
                  )}
                </h2>
                <Link
                  href="/gallery"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary-red transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" /> Event photos
                </Link>
                <span className="text-[10px] font-mono text-muted-foreground/60 uppercase">
                  {event.teams.length} team{event.teams.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {event.teams.map((team) => (
                  <Link
                    key={team.id}
                    href={`/teams/${team.id}`}
                    className="bh-card p-5 space-y-3 group hover:border-primary-red/30 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="text-base font-bold group-hover:text-primary-red transition-colors">
                        {team.name}
                      </h3>
                      <ChevronRight className="w-4 h-4 text-primary/20 group-hover:text-primary/50 transition-colors shrink-0" />
                    </div>
                    {team.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{team.description}</p>
                    )}
                    {team.members.length > 0 && (
                      <div className="flex items-center gap-2 pt-3 border-t border-border">
                        <div className="flex -space-x-2">
                          {team.members.slice(0, 5).map((m, i) => (
                            <span key={i} className="relative h-7 w-7 rounded-full overflow-hidden border-2 border-surface bg-surface-hover">
                              {m.avatar_url ? (
                                <Image src={getAvatarUrl(m.avatar_url, m.full_name)} alt={m.full_name ?? "Member"} fill className="object-cover" sizes="28px" />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-muted-foreground">
                                  {(m.full_name ?? "?").charAt(0).toUpperCase()}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {team.members.map((m) => m.full_name).filter(Boolean).slice(0, 3).join(", ")}
                          {team.members.length > 3 ? ` +${team.members.length - 3}` : ""}
                        </span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
