import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import DashboardSidebar from "@/components/dashboard-sidebar"
import {
  LayoutDashboard,
  CalendarDays,
  MapPin,
  BookMarked,
  ScanLine,
  KeyRound,
} from "lucide-react"

const organizerLinks = [
  {
    href: "/dashboard/organizer",
    label: "Overview",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    href: "/dashboard/organizer/events",
    label: "Events",
    icon: <CalendarDays className="w-4 h-4" />,
  },
  {
    href: "/dashboard/organizer/issue-marker",
    label: "Issue Marker",
    icon: <MapPin className="w-4 h-4" />,
  },
  {
    href: "/dashboard/organizer/my-markers",
    label: "My Markers",
    icon: <BookMarked className="w-4 h-4" />,
  },
  {
    href: "/dashboard/organizer/check-in",
    label: "Check-in",
    icon: <ScanLine className="w-4 h-4" />,
  },
  {
    href: "/dashboard/organizer/api-keys",
    label: "API Keys",
    icon: <KeyRound className="w-4 h-4" />,
  },
]

export default async function OrganizerDashboardLayout({
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

  if (profile?.role && profile.role !== "organizer") {
    redirect(`/dashboard/${profile.role}`)
  }

  const slugId = profile?.slug_id ?? user.id.slice(0, 8).toUpperCase()

  return (
    <div className="flex min-h-screen bg-[#1C1C1E]">
      <DashboardSidebar
        role="organizer"
        slugId={slugId}
        links={organizerLinks}
      />
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
