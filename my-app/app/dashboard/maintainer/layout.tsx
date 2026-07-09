import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import MaintainerSidebar from "@/components/maintainer-sidebar"
import {
  Terminal,
  Users,
  ScrollText,
  ShieldCheck,
  Settings2,
} from "lucide-react"

const maintainerLinks = [
  {
    href: "/dashboard/maintainer",
    label: "Command Center",
    icon: <Terminal className="w-4 h-4" />,
  },
  {
    href: "/dashboard/maintainer/users",
    label: "Users",
    icon: <Users className="w-4 h-4" />,
  },
  {
    href: "/dashboard/maintainer/audit-log",
    label: "Audit Log",
    icon: <ScrollText className="w-4 h-4" />,
  },
  {
    href: "/dashboard/maintainer/trust-override",
    label: "Trust Override",
    icon: <ShieldCheck className="w-4 h-4" />,
  },
  {
    href: "/dashboard/maintainer/site-config",
    label: "Site Config",
    icon: <Settings2 className="w-4 h-4" />,
  },
]

export default async function MaintainerDashboardLayout({
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

  if (profile?.role && profile.role !== "maintainer") {
    redirect(`/dashboard/${profile.role}`)
  }

  const slugId = profile?.slug_id ?? user.id.slice(0, 8).toUpperCase()

  return (
    <div className="flex min-h-screen bg-[#1C1C1E]">
      <MaintainerSidebar slugId={slugId} links={maintainerLinks} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
