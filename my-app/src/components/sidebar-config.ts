export type Role = "hacker" | "sponsor" | "organizer" | "maintainer" | "lead"

export interface NavLink {
  href: string
  label: string
  icon: React.ReactNode
}

export type SlimProfile = {
  full_name?: string | null;
  bio?: string | null;
  socials?: Record<string, string> | null;
  xp?: number | null;
  trust_markers?: unknown[] | null;
}

export interface DashboardSidebarProps {
  role: Role
  slugId: string
  links: NavLink[]
  onboardingProfile?: SlimProfile | null
  onboardingChapterCount?: number
  onboardingProjectCount?: number
}

export interface RoleStyle {
  dot: string
  badge: string
  badgeText: string
  activeClass: string
}

export const roleConfig: Record<Role, RoleStyle> = {
  hacker: {
    dot: "bg-status-green",
    badge: "bg-status-green/10 text-status-green border border-status-green/20",
    badgeText: "hacker",
    activeClass: "bg-surface-hover text-primary font-semibold",
  },
  sponsor: {
    dot: "bg-status-blue",
    badge: "bg-status-blue/10 text-status-blue border border-status-blue/20",
    badgeText: "sponsor",
    activeClass: "bg-status-blue/8 text-primary font-semibold",
  },
  organizer: {
    dot: "bg-status-yellow",
    badge: "bg-status-yellow/10 text-status-yellow border border-status-yellow/20",
    badgeText: "organizer",
    activeClass: "bg-surface-hover text-primary font-semibold",
  },
  maintainer: {
    dot: "bg-primary-red",
    badge: "bg-primary-red/10 text-primary-red border border-primary-red/20",
    badgeText: "maintainer",
    activeClass: "bg-primary-red/8 text-primary-red font-semibold border border-primary-red/20",
  },
  lead: {
    dot: "bg-status-purple",
    badge: "bg-status-purple/10 text-status-purple border border-status-purple/20",
    badgeText: "lead",
    activeClass: "bg-status-purple/8 text-status-purple font-semibold border border-status-purple/20",
  },
}
