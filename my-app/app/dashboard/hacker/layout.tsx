import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import DashboardSidebar from "@/components/dashboard-sidebar"
import {
  LayoutDashboard,
  User,
  Code2,
  Users,
  UserPlus,
} from "lucide-react"

const hackerLinks = [
  {
    href: "/dashboard/hacker",
    label: "Overview",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    href: "/dashboard/hacker/profile",
    label: "My Profile",
    icon: <User className="w-4 h-4" />,
  },
  {
    href: "/dashboard/hacker/projects",
    label: "Projects",
    icon: <Code2 className="w-4 h-4" />,
  },
  {
    href: "/dashboard/hacker/teams",
    label: "Teams",
    icon: <Users className="w-4 h-4" />,
  },
  {
    href: "/dashboard/hacker/teammates",
    label: "Find Teammates",
    icon: <UserPlus className="w-4 h-4" />,
  },
]

export default async function HackerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, slug_id")
    .eq("id", user.id)
    .single()

  if (profile?.role && profile.role !== "hacker") {
    redirect(`/dashboard/${profile.role}`)
  }

  const slugId = profile?.slug_id ?? user.id.slice(0, 8).toUpperCase()

  return (
    <div className="flex min-h-screen bg-[#1C1C1E]">
      <DashboardSidebar role="hacker" slugId={slugId} links={hackerLinks} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
