import Image from "next/image";
import { auth0 } from "@/lib/auth0";
import { notFound, redirect } from "next/navigation";
import { createServiceClient } from "@/utils/supabase";
import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { Users, Shield, CalendarDays } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return buildPageMetadata({
    title: `${slug} Members`,
    description: `Members of the ${slug} chapter.`,
    path: `/orgs/${slug}/members`,
  });
}

export default async function OrgMembersPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth0.getSession();
  const userId = session?.user?.sub;

  if (!userId) redirect("/sign-in");

  const supabase = createServiceClient();

  const { data: chapter } = await supabase
    .from("chapters")
    .select("id, name")
    .eq("slug", slug)
    .single();

  if (!chapter) notFound();

  void (null); // admin role check available via chapter_members table

  const { data: members } = await supabase
    .from("chapter_members")
    .select(`
      org_role,
      joined_at,
      profiles!inner(id, full_name, avatar_url, bh_id, role)
    `)
    .eq("chapter_id", chapter.id)
    .order("joined_at", { ascending: true });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-primary">{chapter.name} Members</h1>
          <p className="text-sm text-primary/50">{members?.length ?? 0} member{(members?.length ?? 0) !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {members && members.length > 0 ? (
        <div className="space-y-2">
          {members.map((member) => {
            const profile = (Array.isArray(member.profiles) ? member.profiles[0] : member.profiles) as unknown as { id: string; full_name: string; avatar_url: string | null; bh_id: string | null; role: string };
            const isMemberAdmin = member.org_role === "admin";
            return (
              <div key={profile.id} className="bh-card p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface/10 overflow-hidden flex-shrink-0 relative">
                  {profile.avatar_url ? (
                    <Image loading="lazy" src={profile.avatar_url} alt={profile.full_name ?? "Member"} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-primary/40">{profile.full_name?.charAt(0) ?? "?"}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-primary truncate">{profile.full_name ?? "Unknown"}</span>
                    {isMemberAdmin && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-status-yellow bg-status-yellow/10 px-2 py-0.5 rounded-full">
                        <Shield className="w-3 h-3" /> Admin
                      </span>
                    )}
                  </div>
                  {profile.bh_id && <p className="text-xs font-mono text-primary/40">{profile.bh_id}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 text-[10px] text-primary/30">
                    <CalendarDays className="w-3 h-3" /> Joined {new Date(member.joined_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bh-card p-12 text-center">
          <Users className="w-12 h-12 text-primary/20 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-primary/60 mb-2">No members yet</h3>
          <p className="text-sm text-primary/40">Members will appear here once they join the chapter.</p>
        </div>
      )}
    </div>
  );
}
