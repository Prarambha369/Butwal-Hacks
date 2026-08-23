import { createServiceClient } from "@/utils/supabase"
import { GraduationCap } from "lucide-react"
import type { Metadata } from "next"
import { MentorDirectoryClient } from "./mentor-directory-client"

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

        {/* Interactive directory with search + filters */}
        <MentorDirectoryClient mentors={list} />
      </div>
    </main>
  );
}
