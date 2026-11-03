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
  UsersRound,
  FileText,
  KanbanSquare,
  GitBranch,
  MessageSquare,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  shortcut: string;
  section?: string;
}

// Icons use createElement because this is a .ts module, where JSX is not valid.
export const hackerNav: readonly NavItem[] = [
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
    href: "/dashboard/hacker/chat",
    label: "Team Chat",
    shortcut: "x",
    icon: createElement(MessageSquare, { className: "w-4 h-4" }),
    section: "Collaboration",
  },
];
