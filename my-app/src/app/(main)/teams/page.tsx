import Link from "next/link";
import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { createClient } from "@/utils/supabase/server";
import { Users, Plus, ChevronRight, UserPlus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

export default async function TeamsPage() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;

  if (!userId) redirect("/auth/login");

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, slug_id")
    .eq("auth0_user_id", userId)
    .single();

  if (!profile) redirect("/dashboard/hacker");

  // Fetch teams where user is a member
  const { data: memberships } = await supabase
    .from("team_members")
    .select(`
      team_id,
      role,
      teams!inner(id, name, description, created_at, event_id)
    `)
    .eq("profile_id", profile.id);

  const teams = memberships?.map((m) => {
    const team = m.teams as unknown as {
      id: string;
      name: string;
      description: string | null;
      created_at: string;
      event_id: string | null;
    };
    return { ...team, myRole: m.role };
  });

  // Fetch pending invites
  const { data: invites } = await supabase
    .from("team_invites")
    .select(`
      id,
      status,
      teams!inner(id, name)
    `)
    .eq("profile_id", profile.id)
    .eq("status", "pending");

  // ── Early return: empty state ────────────────────────────────
  const invitesSection = invites && invites.length > 0 ? (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-widest text-status-yellow flex items-center gap-2">
        <UserPlus size={14} />
        Pending Invitations ({invites.length})
      </h3>
      <div className="space-y-2">
        {invites.map((invite) => {
          const team = invite.teams as unknown as { id: string; name: string };
          return (
            <div
              key={invite.id}
              className="bh-card px-5 py-3 border border-status-yellow/20 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-status-yellow/10 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-status-yellow" />
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">
                    Invitation to join {team.name}
                  </p>
                  <p className="text-[10px] text-secondary/60">
                    Respond to accept or decline
                  </p>
                </div>
              </div>
              <Link
                href={`/teams?invite=${invite.id}`}
                className="text-xs font-bold text-primary-red hover:text-red-300 transition-colors"
              >
                View →
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  ) : null;

  if (!teams || teams.length === 0) {
    return (
      <div className="space-y-8 p-6 md:p-12">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">My Teams</h1>
            <p className="text-secondary">
              Collaborate with fellow hackers on projects and events.
            </p>
          </div>
          <Link
            href="/teams/create"
            className={cn(buttonVariants({ variant: "default", size: "sm" }))}
          >
            <Plus size={16} /> New Team
          </Link>
        </div>
        {invitesSection}
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="No teams yet"
          description="Teams let you collaborate with other hackers on projects and compete in events together. Create your own or join an existing one."
          actions={[
            { label: "Create a team", href: "/teams/create", variant: "primary" },
            { label: "Find teammates", href: "/dashboard/hacker/team-matching", variant: "secondary" },
          ]}
          hint="Use AI Team Matching to find complementary teammates"
        />
      </div>
    );
  }

  // ── Has teams ────────────────────────────────────────────────
  return (
    <div className="space-y-8 p-6 md:p-12">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">My Teams</h1>
          <p className="text-secondary">
            Collaborate with fellow hackers on projects and events.
          </p>
        </div>
        <Link
          href="/teams/create"
          className={cn(buttonVariants({ variant: "default", size: "sm" }))}
        >
          <Plus size={16} /> New Team
        </Link>
      </div>
      {invitesSection}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <Link
            key={team.id}
            href={`/teams/${team.id}`}
            className="bh-card p-6 space-y-4 group hover:border-primary-red/30 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-primary-red/10 text-primary-red">
                <Users size={20} />
              </div>
              <ChevronRight className="w-4 h-4 text-primary/20 group-hover:text-primary/50 transition-colors" />
            </div>
            <div>
              <h3 className="text-lg font-bold group-hover:text-primary-red transition-colors">
                {team.name}
              </h3>
              {team.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {team.description}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-[10px] font-mono text-muted-foreground/60 uppercase">
                {team.myRole === "lead" ? "Lead" : "Member"}
              </span>
              {team.event_id && (
                <span className="text-[10px] font-mono text-primary-red/60">
                  Event Team
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
