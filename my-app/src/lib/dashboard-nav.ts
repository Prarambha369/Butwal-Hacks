/**
 * dashboard-nav.ts — the typed navigation config for the authenticated dashboard.
 *
 * Access control does NOT live here. These entries are labels only: they render
 * inside layouts that have already gated the route, so listing an item never
 * grants access to it. Any conditional visibility must call the predicates in
 * `src/lib/dashboard-access.ts` — never an inline check on a raw role array.
 * Organizer access is time-boxed to an event's timeline plus ORGANIZER_GRACE_DAYS,
 * and maintainer access additionally requires a verified @butwalhacks.com address;
 * a role column alone proves neither.
 *
 * One shape fits both consumers without casts: the sidebar's `NavLink`
 * (href, label, icon) and the command palette's `DashboardNavItem`, which adds
 * the required `shortcut`. `section` is a grouping label — it grants nothing and
 * does not reorder the array.
 */
import { createElement } from "react";
import { PROFILE_SETTINGS_PATH } from "@/lib/routes";
import {
  LayoutDashboard,
  User,
  Code2,
  Users,
  Key,
  KeyRound,
  UsersRound,
  FileText,
  KanbanSquare,
  GitBranch,
  MessageSquare,
  CalendarDays,
  MapPin,
  LayoutTemplate,
  Terminal,
  ScrollText,
  ShieldCheck,
  Stethoscope,
  Settings2,
  BookOpen,
  GraduationCap,
  Image as ImageIcon,
  Handshake,
  Search,
  Briefcase,
  Building2,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  shortcut: string;
  section?: string;
}

/**
 * Group links into rendered sections by their `section` label, preserving
 * array order (each group is a run of adjacent items with the same label).
 * Items without a `section` form a leading unlabelled run. Renders nothing
 * extra when no link carries a section — the flat list stays the fallback.
 */
export function sectionGroups<T extends { section?: string }>(
  links: readonly T[],
): { label: string | null; items: T[] }[] {
  const groups: { label: string | null; items: T[] }[] = [];
  for (const link of links) {
    const label = link.section?.trim() || null;
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(link);
    } else {
      groups.push({ label, items: [link] });
    }
  }
  return groups;
}

// Icons use createElement because this is a .ts module, where JSX is not valid.
export const hackerNav: NavItem[] = [
  {
    href: "/dashboard/hacker",
    label: "Overview",
    shortcut: "h",
    icon: createElement(LayoutDashboard, { className: "w-4 h-4" }),
    section: "Workspace",
  },
  {
    href: PROFILE_SETTINGS_PATH,
    label: "My Profile",
    shortcut: "r",
    icon: createElement(User, { className: "w-4 h-4" }),
    section: "Workspace",
  },
  {
    href: "/dashboard/hacker/work",
    label: "Work",
    shortcut: "w",
    icon: createElement(KanbanSquare, { className: "w-4 h-4" }),
    section: "Workspace",
  },
  {
    href: "/dashboard/hacker/projects",
    label: "Projects",
    shortcut: "p",
    icon: createElement(Code2, { className: "w-4 h-4" }),
    section: "Workspace",
  },
  {
    href: "/dashboard/hacker/certificates",
    label: "Certificates",
    shortcut: "c",
    icon: createElement(FileText, { className: "w-4 h-4" }),
    section: "Workspace",
  },
  {
    href: "/teams",
    label: "Teams",
    shortcut: "t",
    icon: createElement(Users, { className: "w-4 h-4" }),
    section: "Collaboration",
  },
  {
    href: "/dashboard/hacker/team-matching",
    label: "AI Team Match",
    shortcut: "m",
    icon: createElement(UsersRound, { className: "w-4 h-4" }),
    section: "Collaboration",
  },
  {
    href: "/dashboard/hacker/api-keys",
    label: "API Keys",
    shortcut: "k",
    icon: createElement(Key, { className: "w-4 h-4" }),
    section: "Credentials",
  },
  {
    href: "/dashboard/hacker/skills",
    label: "Skill Trees",
    shortcut: "s",
    icon: createElement(GitBranch, { className: "w-4 h-4" }),
    section: "Credentials",
  },
  {
    href: "/dashboard/hacker/connections",
    label: "Account Connections",
    shortcut: "a",
    icon: createElement(Users, { className: "w-4 h-4" }),
    section: "Credentials",
  },
  {
    href: "/dashboard/hacker/chat",
    label: "Team Chat",
    shortcut: "x",
    icon: createElement(MessageSquare, { className: "w-4 h-4" }),
    section: "Collaboration",
  },
];

export const organizerNav: NavItem[] = [
  {
    href: "/dashboard/organizer",
    label: "Overview",
    shortcut: "o",
    icon: createElement(LayoutDashboard, { className: "w-4 h-4" }),
    section: "Workspace",
  },
  {
    href: "/dashboard/organizer/events",
    label: "Events",
    shortcut: "e",
    icon: createElement(CalendarDays, { className: "w-4 h-4" }),
    section: "Workspace",
  },
  {
    href: "/dashboard/organizer/work",
    label: "Team Work",
    shortcut: "w",
    icon: createElement(KanbanSquare, { className: "w-4 h-4" }),
    section: "Workspace",
  },
  {
    href: "/dashboard/organizer/issue-marker",
    label: "Issue Marker",
    shortcut: "i",
    icon: createElement(MapPin, { className: "w-4 h-4" }),
    section: "Tools",
  },
  {
    // Was reachable only by typing the URL. It is a shipped feature -- the
    // editor, roster import, bulk issue and domain send all live here -- so
    // hiding it in the nav made it look unfinished to organizers. Comment
    // carried over from the inline array this was extracted from.
    href: "/dashboard/organizer/certificates/templates",
    label: "Certificate Templates",
    shortcut: "t",
    icon: createElement(LayoutTemplate, { className: "w-4 h-4" }),
    section: "Tools",
  },
  {
    href: "/dashboard/organizer/api-keys",
    label: "API Keys",
    shortcut: "k",
    icon: createElement(KeyRound, { className: "w-4 h-4" }),
    section: "Credentials",
  },
];

export const maintainerNav: NavItem[] = [
  {
    href: "/dashboard/maintainer",
    label: "Command Center",
    shortcut: "c",
    icon: createElement(Terminal, { className: "w-4 h-4" }),
    section: "Admin",
  },
  {
    href: "/dashboard/maintainer/users",
    label: "Users",
    shortcut: "u",
    icon: createElement(Users, { className: "w-4 h-4" }),
    section: "Admin",
  },
  {
    href: "/dashboard/maintainer/system-check",
    label: "System Check",
    shortcut: "k",
    icon: createElement(Stethoscope, { className: "w-4 h-4" }),
    section: "Admin",
  },
  {
    href: "/dashboard/maintainer/audit-log",
    label: "Audit Log",
    shortcut: "a",
    icon: createElement(ScrollText, { className: "w-4 h-4" }),
    section: "Admin",
  },
  {
    href: "/dashboard/maintainer/trust-override",
    label: "Trust Override",
    shortcut: "t",
    icon: createElement(ShieldCheck, { className: "w-4 h-4" }),
    section: "Admin",
  },
  {
    href: "/dashboard/maintainer/site-config",
    label: "Site Config",
    shortcut: "s",
    icon: createElement(Settings2, { className: "w-4 h-4" }),
    section: "Admin",
  },
  {
    href: "/dashboard/maintainer/photos",
    label: "Photos",
    shortcut: "p",
    icon: createElement(ImageIcon, { className: "w-4 h-4" }),
    section: "Content",
  },
  {
    href: "/dashboard/maintainer/partners",
    label: "Partners",
    shortcut: "w",
    icon: createElement(Handshake, { className: "w-4 h-4" }),
    section: "Content",
  },
  {
    href: "/dashboard/maintainer/chapters",
    label: "Chapters",
    shortcut: "h",
    icon: createElement(GraduationCap, { className: "w-4 h-4" }),
    section: "Content",
  },
  {
    href: "/dashboard/maintainer/blog",
    label: "Blog",
    shortcut: "b",
    icon: createElement(BookOpen, { className: "w-4 h-4" }),
    section: "Content",
  },
  {
    href: "/api-docs",
    label: "API Docs",
    shortcut: "d",
    icon: createElement(BookOpen, { className: "w-4 h-4" }),
    section: "Off-site",
  },
  {
    href: "/dashboard/maintainer/dedicate-school",
    label: "Dedicate School",
    shortcut: "g",
    icon: createElement(GraduationCap, { className: "w-4 h-4" }),
    section: "Content",
  },
];

// Sponsor shortcuts are inert today: the portal layout renders the sidebar but
// not the palette, so no listener ever reads these. They exist so the one shape
// stays total — every NavItem carries every field, and a future portal palette
// can switch on without inventing letters under pressure.
export const sponsorNav: NavItem[] = [
  {
    href: "/portal/sponsors",
    label: "Overview",
    shortcut: "o",
    icon: createElement(LayoutDashboard, { className: "w-4 h-4" }),
    section: "Overview",
  },
  {
    href: "/portal/recruiters",
    label: "Discover Hackers",
    shortcut: "d",
    icon: createElement(Search, { className: "w-4 h-4" }),
    section: "Sourcing",
  },
  {
    href: "/portal/bounties",
    label: "Bounties",
    shortcut: "b",
    icon: createElement(Briefcase, { className: "w-4 h-4" }),
    section: "Sourcing",
  },
  {
    href: "/portal/sponsors/company",
    label: "Company Profile",
    shortcut: "c",
    icon: createElement(Building2, { className: "w-4 h-4" }),
    section: "Company",
  },
];
