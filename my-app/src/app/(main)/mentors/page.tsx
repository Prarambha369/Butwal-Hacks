import { createServiceClient } from "@/utils/supabase/service"
import { GraduationCap, ExternalLink, Calendar, Users, MessageSquare } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getAvatarUrl } from "@/lib/utils"
import type { Metadata } from "next"

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mentor Directory — Butwal Hacks",
  description: "Connect with mentors available for 1:1 chats. Browse experienced developers and engineers offering mentorship.",
};

interface MentorProfile {
  bh_id: string
  full_name: string
  avatar_url: string | null
  bio: string | null
  skills: string[] | null
  xp: number
  cal_com_url: string | null
  socials: Record<string, string> | null
}

export default async function MentorsPage() {
  const supabase = createServiceClient();

  const { data: mentors } = await supabase
    .from("profiles")
    .select("bh_id, full_name, avatar_url, bio, skills, xp, cal_com_url, socials")
    .eq("open_to_mentor", true)
    .not("bh_id", "is", null)
    .order("xp", { ascending: false })
    .limit(50);

  const list = (mentors ?? []) as unknown as MentorProfile[];

  return (
    <main className="min-h-dvh bg-background pt-28 pb-16 px-6 md:px-20">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-red/10 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-red" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary tracking-tight">Mentor Directory</h1>
              <p className="text-sm text-muted-foreground">
                Connect with mentors for 1:1 chats and guidance
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground/70 max-w-2xl leading-relaxed">
            Browse experienced developers and engineers who have volunteered to mentor community members.
            Book a 15-minute chat to ask questions, get career advice, or discuss your project.
          </p>
        </div>

        {/* List */}
        {list.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-surface-hover flex items-center justify-center mx-auto mb-4 ring-1 ring-border">
              <Users className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <p className="text-lg font-bold text-primary">No mentors available yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1 max-w-xs mx-auto">
              Mentors who mark themselves as available in their profile settings will appear here.
            </p>
            <Link
              href="/dashboard/hacker/profile"
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary-red/10 text-primary-red text-xs font-bold hover:bg-primary-red/20 transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Set up your mentor profile
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((mentor) => {
              return (
                <div
                  key={mentor.bh_id}
                  className="bh-card border border-border p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden group"
                >
                  {/* Mentor badge */}
                  <div className="absolute top-0 right-0">
                    <div className="bg-primary-red/10 text-primary-red text-[9px] font-bold px-3 py-1 rounded-bl-xl border-b border-l border-primary-red/20">
                      MENTOR
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative w-14 h-14 shrink-0 rounded-full overflow-hidden ring-2 ring-primary-red/20">
                      <Image
                        src={getAvatarUrl(mentor.avatar_url, mentor.full_name ?? mentor.bh_id)}
                        alt={mentor.full_name ?? "Mentor"}
                        width={56}
                        height={56}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                      {/* Name + XP */}
                      <div>
                        <h3 className="text-sm font-bold text-primary truncate group-hover:text-primary-red transition-colors">
                          {mentor.full_name ?? "Unnamed"}
                        </h3>
                        <p className="text-[10px] font-mono text-muted-foreground/50">
                          {mentor.xp.toLocaleString()} XP
                        </p>
                      </div>

                      {/* Bio */}
                      {mentor.bio && (
                        <p className="text-xs text-muted-foreground/70 leading-relaxed line-clamp-2">
                          {mentor.bio}
                        </p>
                      )}

                      {/* Skills */}
                      {mentor.skills && mentor.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {mentor.skills.slice(0, 4).map((skill) => (
                            <span
                              key={skill}
                              className="text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-surface-hover text-muted-foreground/60 border border-border/50"
                            >
                              {skill}
                            </span>
                          ))}
                          {mentor.skills.length > 4 && (
                            <span className="text-[9px] text-muted-foreground/40 px-1.5 py-0.5">
                              +{mentor.skills.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Links */}
                      <div className="flex items-center gap-2 pt-1">
                        <Link
                          href={`/p/${mentor.bh_id}`}
                          className="text-[10px] font-bold text-accent-teal hover:underline flex items-center gap-1"
                        >
                          View Profile <ExternalLink className="w-3 h-3" />
                        </Link>
                        {mentor.cal_com_url && (
                          <a
                            href={mentor.cal_com_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-red text-white text-[10px] font-bold hover:bg-deep-red transition-all shadow-[var(--bh-glow-red-soft)] hover:shadow-[var(--bh-glow-red)]"
                          >
                            <Calendar className="w-3 h-3" />
                            Book 15-min Chat
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
