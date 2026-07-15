"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  User,
  KanbanSquare,
  Code2,
  FileText,
  Users,
  UsersRound,
  Key,
  CalendarDays,
  MapPin,
  ShieldCheck,
  Terminal,
  ScrollText,
  Settings2,
  BookOpen,
  GraduationCap,
  Search,
  Briefcase,
  Building2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Zap,
} from "lucide-react";

interface Tool {
  name: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  purpose: string;
  howTo: string;
  badge?: string;
}

interface RoleSection {
  role: string;
  color: string;
  dot: string;
  tools: Tool[];
}

const toolCatalog: RoleSection[] = [
  {
    role: "Hacker",
    color: "text-status-green",
    dot: "bg-status-green",
    tools: [
      {
        name: "Overview",
        description: "Your personal command center showing XP, projects, trust markers, chapters, and activity feed.",
        href: "/dashboard/hacker",
        icon: <LayoutDashboard className="w-4 h-4" />,
        purpose: "Your XP, projects, trust markers, and activity feed in one place.",
        howTo: "Visit /dashboard/hacker after onboarding. Stats cards show your totals; the activity feed shows community updates.",
      },
      {
        name: "My Profile",
        description: "Edit your full name, bio, social links, and avatar to build your public hacker identity.",
        href: "/dashboard/hacker/profile",
        icon: <User className="w-4 h-4" />,
        purpose: "Your profile shows who you are. Complete it to connect with the community.",
        howTo: "Fill in your bio, add GitHub/Twitter/LinkedIn links, and upload an avatar. A complete profile unlocks onboarding step 1.",
      },
      {
        name: "Work (Kanban Board)",
        description: "Notion-style drag-and-drop task board with 4 columns: To Do, In Progress, Review, Done.",
        href: "/dashboard/hacker/work",
        icon: <KanbanSquare className="w-4 h-4" />,
        purpose: "Organize hackathon tasks, track progress, and collaborate visually with your team.",
        howTo: "Create tasks, drag them between columns to update status. Each task has a detail drawer for properties and descriptions.",
        badge: "New",
      },
      {
        name: "Projects",
        description: "Submit and manage all your hackathon project submissions in one place.",
        href: "/dashboard/hacker/projects",
        icon: <Code2 className="w-4 h-4" />,
        purpose: "Submit your work. Each project builds your portfolio and earns XP.",
        howTo: "Click 'New Project' to submit. Add title, description, tech stack, and links. You can also sync from GitHub.",
      },
      {
        name: "Certificates",
        description: "View and download your Open Badges-compatible certificates and credentials.",
        href: "/dashboard/hacker/certificates",
        icon: <FileText className="w-4 h-4" />,
        purpose: "Your verified achievements, portable anywhere. Use them on LinkedIn, your portfolio, or in job applications.",
        howTo: "Earn certificates by participating in events and completing challenges. Download as Open Badges (JSON-LD).",
      },
      {
        name: "Teams",
        description: "Form, join, and manage hackathon teams with role-based permissions.",
        href: "/teams",
        icon: <Users className="w-4 h-4" />,
        purpose: "Hackathons are better together. Find teammates, assign roles, and ship faster.",
        howTo: "Create a team, invite members by email or BH-ID, and assign roles (lead, member, reviewer).",
      },
      {
        name: "AI Team Match",
        description: "Get AI-suggested teammates based on complementary skills and past projects.",
        href: "/dashboard/hacker/team-matching",
        icon: <UsersRound className="w-4 h-4" />,
        purpose: "Find teammates whose skills complement yours. Powered by Llama 3 on Groq.",
        howTo: "AI analyzes your skills and suggests 3 optimal matches. Review profiles and send invites directly.",
        badge: "AI",
      },
      {
        name: "API Keys",
        description: "Generate API keys to pull your BH-ID data into external portfolios and apps.",
        href: "/dashboard/hacker/api-keys",
        icon: <Key className="w-4 h-4" />,
        purpose: "Your data, your way. Use our public API to embed your verified profile anywhere.",
        howTo: "Create an API key with specific scopes. Use it to call /api/v1/profile/[slugId] from your portfolio site.",
      },
    ],
  },
  {
    role: "Organizer",
    color: "text-status-yellow",
    dot: "bg-status-yellow",
    tools: [
      {
        name: "Overview",
        description: "Event statistics, registrant counts, and quick management actions at a glance.",
        href: "/dashboard/organizer",
        icon: <LayoutDashboard className="w-4 h-4" />,
        purpose: "Monitor your events and track participant growth from one dashboard.",
        howTo: "View your event count, total registrants, and impact score. Quick links to create events and manage teams.",
      },
      {
        name: "Events",
        description: "Create, publish, and manage hackathon events with full lifecycle control.",
        href: "/dashboard/organizer/events",
        icon: <CalendarDays className="w-4 h-4" />,
        purpose: "Design and run hackathons. Control registration, scheduling, and team formation.",
        howTo: "Click 'Create New Event'. Set title, description, dates, and publishing status. Track attendees per event.",
      },
      {
        name: "Issue Marker",
        description: "Issue cryptographically-signed trust markers (verified credentials) to participants.",
        href: "/dashboard/organizer/issue-marker",
        icon: <MapPin className="w-4 h-4" />,
        purpose: "Recognize achievements with tamper-proof, Ed25519-signed credentials that hackers can display forever.",
        howTo: "Enter the participant's email, add a title and description for the marker, and submit. The marker is signed and linked to their BH-ID.",
        badge: "Verified",
      },
      {
        name: "Team Work",
        description: "Organizer-level Kanban board to manage work distribution across your hackathon teams.",
        href: "/dashboard/organizer/work",
        icon: <KanbanSquare className="w-4 h-4" />,
        purpose: "Coordinate tasks and track progress across all teams in your hackathon.",
        howTo: "Create tasks, assign to teams, and track through the pipeline from To Do to Done.",
      },
      {
        name: "API Keys",
        description: "Programmatic API access for organizers to automate event management.",
        href: "/dashboard/organizer/api-keys",
        icon: <Key className="w-4 h-4" />,
        purpose: "Integrate Butwal Hacks into your own tools and workflows.",
        howTo: "Generate scoped API keys for your event management tools.",
      },
    ],
  },
  {
    role: "Maintainer",
    color: "text-primary-red",
    dot: "bg-primary-red",
    tools: [
      {
        name: "Command Center",
        description: "Global system overview with integrity checks and critical control points.",
        href: "/dashboard/maintainer",
        icon: <Terminal className="w-4 h-4" />,
        purpose: "Monitor platform health and access all administrative controls from one place.",
        howTo: "View system stats (hackers, projects, events, trust markers) and run integrity checks on RLS policies, auth bridge, and credentials.",
      },
      {
        name: "Users",
        description: "Manage all users across the platform: roles, bans, and account status.",
        href: "/dashboard/maintainer/users",
        icon: <Users className="w-4 h-4" />,
        purpose: "Manage users, roles, and permissions across the platform.",
        howTo: "Search users, toggle maintainer roles, ban/unban accounts. Use the table for quick batch operations.",
      },
      {
        name: "Audit Log",
        description: "View the complete system audit trail for security and compliance.",
        href: "/dashboard/maintainer/audit-log",
        icon: <ScrollText className="w-4 h-4" />,
        purpose: "Track every administrative action for accountability and debugging.",
        howTo: "Browse timestamped logs of all admin actions. Filter by user, action type, or date range.",
      },
      {
        name: "Trust Override",
        description: "Override, revoke, or restore trust markers when needed.",
        href: "/dashboard/maintainer/trust-override",
        icon: <ShieldCheck className="w-4 h-4" />,
        purpose: "Maintain credential integrity. Revoke fraud markers, restore legitimate ones.",
        howTo: "Search by BH-ID or marker ID. Review the marker details and choose to revoke or restore with an audit trail.",
      },
      {
        name: "Site Config",
        description: "Global site configuration and feature flags.",
        href: "/dashboard/maintainer/site-config",
        icon: <Settings2 className="w-4 h-4" />,
        purpose: "Control platform-wide settings without touching code.",
        howTo: "Toggle features, update global parameters, and manage maintenance mode.",
      },
      {
        name: "API Docs",
        description: "Public API documentation for the Butwal Hacks credentialing system.",
        href: "/api-docs",
        icon: <BookOpen className="w-4 h-4" />,
        purpose: "Help developers integrate with Butwal Hacks APIs.",
        howTo: "Browse endpoint documentation, try requests, and copy code examples.",
      },
      {
        name: "Dedicate School",
        description: "Manage school dedications and educational institution partnerships.",
        href: "/dashboard/maintainer/dedicate-school",
        icon: <GraduationCap className="w-4 h-4" />,
        purpose: "Partner with schools to issue credentials and track student participation.",
        howTo: "Add schools, assign dedicated organizers, and view school-specific analytics.",
      },
    ],
  },
  {
    role: "Sponsor",
    color: "text-status-blue",
    dot: "bg-status-blue",
    tools: [
      {
        name: "Overview",
        description: "Sponsor dashboard with company stats and program overview.",
        href: "/portal/sponsors",
        icon: <LayoutDashboard className="w-4 h-4" />,
        purpose: "Track your sponsorship impact and manage your programs.",
        howTo: "View your company profile, active bounties, and recruitment metrics.",
      },
      {
        name: "Discover Hackers",
        description: "Search for hackers by skills, BH-ID, bio, and experience level.",
        href: "/portal/recruiters",
        icon: <Search className="w-4 h-4" />,
        purpose: "Find talent. Browse verified profiles with trust markers and project portfolios.",
        howTo: "Use the search bar to find hackers by skill or BH-ID. View their full profile, trust markers, and project history.",
      },
      {
        name: "Bounties",
        description: "Create and manage bounty programs for hackers to earn rewards.",
        href: "/portal/bounties",
        icon: <Briefcase className="w-4 h-4" />,
        purpose: "Post challenges, set rewards, and attract top talent to solve real problems.",
        howTo: "Create a bounty with description, reward amount, and deliverables. Review submissions and pay out via Open Collective.",
      },
      {
        name: "Company Profile",
        description: "Edit your company/organization profile visible to hackers.",
        href: "/portal/sponsors/company",
        icon: <Building2 className="w-4 h-4" />,
        purpose: "Present your company to the hacker community. Attract talent that fits your culture.",
        howTo: "Add your company logo, description, website, and social links. Highlight what makes your team unique.",
      },
    ],
  },
];

export function ToolGuideSection() {
  const [expandedRole, setExpandedRole] = useState<string>("Hacker");
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  const toggleRole = (role: string) => {
    setExpandedRole(expandedRole === role ? "" : role);
    setExpandedTool(null);
  };

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary-red" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary-red">
            Tool Guide
          </span>
        </div>
        <h2 className="text-2xl font-black tracking-tight text-primary">
          Everything at your fingertips
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Explore every tool available to you. Each tool is organized by role — click any tool to see why it exists and how to use it.
        </p>
      </div>

      {/* Role accordion */}
      <div className="space-y-3">
        {toolCatalog.map((section) => (
          <div key={section.role} className="bh-card overflow-hidden">
            {/* Role header */}
            <button
              onClick={() => toggleRole(section.role)}
              className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-surface-hover transition-colors text-left"
              aria-expanded={expandedRole === section.role}
            >
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${section.dot}`} />
                <span className={cn("text-base font-bold", section.color)}>
                  {section.role}
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  {section.tools.length} tools
                </span>
              </div>
              {expandedRole === section.role ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {/* Tool grid */}
            {expandedRole === section.role && (
              <div className="border-t border-border">
                <div className="divide-y divide-border">
                  {section.tools.map((tool) => (
                    <div key={tool.name}>
                      {/* Tool header (always visible) */}
                      <button
                        onClick={() =>
                          setExpandedTool(expandedTool === tool.name ? null : tool.name)
                        }
                        className="w-full flex items-center justify-between p-4 pl-6 md:pl-8 hover:bg-surface-hover transition-colors text-left group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="p-2 rounded-lg bg-surface-hover text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                            {tool.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-primary truncate">
                                {tool.name}
                              </span>
                              {tool.badge && (
                                <span className={cn(
                                  "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0",
                                  tool.badge === "New"
                                    ? "bg-primary-red/10 text-primary-red"
                                    : tool.badge === "AI"
                                    ? "bg-status-blue/10 text-status-blue"
                                    : tool.badge === "Verified"
                                    ? "bg-status-green/10 text-status-green"
                                    : "bg-surface-hover text-muted-foreground"
                                )}>
                                  {tool.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 text-left">
                              {tool.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <Link
                            href={tool.href}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-red/10 text-primary-red text-[11px] font-bold hover:bg-primary-red/20 transition-colors"
                          >
                            Open <ExternalLink className="w-3 h-3" />
                          </Link>
                          {expandedTool === tool.name ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>

                      {/* Expanded details */}
                      {expandedTool === tool.name && (
                        <div className="px-6 md:px-8 pb-5 pt-2 bg-surface-hover/30 border-t border-border">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5 text-primary-red" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-primary-red">
                                  Why
                                </span>
                              </div>
                              <p className="text-xs text-text-body leading-relaxed">
                                {tool.purpose}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Terminal className="w-3.5 h-3.5 text-status-blue" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-status-blue">
                                  How
                                </span>
                              </div>
                              <p className="text-xs text-text-body leading-relaxed">
                                {tool.howTo}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
