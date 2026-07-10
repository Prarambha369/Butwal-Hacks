export type InitiativeStatus = "active" | "planned" | "proposed"

export type Initiative = {
  slug: string
  name: string
  status: InitiativeStatus
  summary: string
  details: string[]
}

export type EventStatus = "completed" | "planned"

export type EventItem = {
  slug: string
  title: string
  initiativeSlug: string
  status: EventStatus
  dateLabel: string
  summary: string
}

export type BlogPost = {
  slug: string
  title: string
  publishedAt: string
  excerpt: string
  body: string[]
}

export const initiatives: Initiative[] = [
  {
    slug: "hackathon",
    name: "Hackathon",
    status: "active",
    
    summary: "A long-term community hackathon initiative focused on practical building, teamwork, and problem-solving.",
    details: [
      "Hackathon is an active mission-layer initiative and can host multiple execution events over time.",
      "It exists continuously even between event cycles and focuses on sustained learning outcomes.",
      "The initiative supports students and youth in building practical solutions through collaboration.",
    ],
  },
  {
    slug: "mini-hackathon",
    name: "MiniHackathon",
    status: "active",
    
    summary: "A focused HackDay track under the Hackathon initiative for compact, beginner-friendly hack sessions.",
    details: [
      "MiniHackathon falls under the HackDay operating format and is part of the broader Hackathon direction.",
      "It uses shorter timelines and practical mentorship to make participation approachable.",
      "This track supports rapid prototyping and execution-focused teamwork.",
    ],
  },
  {
    slug: "gamejam",
    name: "GameJam",
    status: "active",
    
    summary: "A recurring initiative centered on game development, creativity, and collaborative design challenges.",
    details: [
      "GameJam is an active initiative designed for creative, hands-on project execution.",
      "It supports ideation, storytelling, and technical skills through structured jam cycles.",
      "Events under this initiative help participants ship playable prototypes in collaborative teams.",
    ],
  },
]

export const events: EventItem[] = [
  {
    slug: "daydream-butwal-september-2024",
    title: "Daydream Butwal - September 2024",
    initiativeSlug: "gamejam",
    status: "completed",
    dateLabel: "September 27-28, 2024",
    summary: "A 24-hour game jam for high school students organized by Butwal Hacks in partnership with Hack Club. Participants built games, attended workshops, and showcased their creations.",
  },
  {
    slug: "hackday-butwal-2024",
    title: "HackDay Butwal 2024",
    initiativeSlug: "mini-hackathon",
    status: "completed",
    dateLabel: "Completed program",
    summary: "A completed day of collaborative building and learning for local student and youth communities.",
  },
]

export const blogPosts: BlogPost[] = [
  {
    slug: "why-butwal-needs-community-tech",
    title: "Why Community-Led Tech Learning Matters in Butwal",
    publishedAt: "2026-02-10",
    excerpt:
      "How consistent local mentorship, open collaboration, and practical learning opportunities can shape long-term innovation outcomes.",
    body: [
      "Butwal Hacks is organized around community access and practical experience. Our focus is to create pathways where young people can learn through projects, discussion, and peer support.",
      "As a nonprofit initiative, we prioritize transparent growth and realistic program design. This means documenting what is active, what is planned, and what remains a proposal in our public roadmap.",
    ],
  },
  {
    slug: "building-open-mentorship-culture",
    title: "Building an Open Mentorship Culture",
    publishedAt: "2026-02-18",
    excerpt:
      "A practical framework for volunteer-driven mentorship in regional tech communities.",
    body: [
      "Mentorship works best when the community shares ownership. Butwal Hacks encourages facilitation models that help mentors and learners collaborate consistently.",
      "Our next phase is to improve documentation, event continuity, and community support systems while preserving inclusive participation.",
    ],
  },
]

export function getEventBySlug(slug: string): EventItem | undefined {
  return events.find((event) => event.slug === slug)
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug)
}

export function getInitiativeBySlug(slug: string): Initiative | undefined {
  return initiatives.find((initiative) => initiative.slug === slug)
}

export type Program = {
  slug: string
  title: string
  tagline: string
  dateLabel: string
  type: string
  price: string
  location: string
}

export const programs: Program[] = [
  {
    slug: "annual-hackathon",
    title: "Annual Hackathon",
    tagline: "Building the future of Western Nepal, one commit at a time.",
    dateLabel: "Sept 15-17, 2024",
    type: "Hybrid (In-person & Online)",
    price: "Free",
    location: "Butwal, Rupandehi",
  },
]

export function getProgramBySlug(slug: string): Program | undefined {
  return programs.find((p) => p.slug === slug)
}

// ─── Community Data ────────────────────────────────────────────

export type CommunityRole = "Builder" | "Mentor" | "Organizer" | "Sponsor"

export interface CommunityMember {
  role: CommunityRole
  count: number
  description: string
}

export interface CommunityStat {
  value: string
  label: string
  description: string
}

export const communityStats: CommunityStat[] = [
  { value: "500+", label: "Community Members", description: "Active builders, mentors, and organizers across Lumbini Province" },
  { value: "12+", label: "Events Hosted", description: "Hackathons, game jams, workshops, and meetups since 2024" },
  { value: "40+", label: "Projects Shipped", description: "Open-source and hackathon projects built by the community" },
  { value: "8+", label: "Districts Reached", description: "Youth participants from across Lumbini and neighboring provinces" },
]

export const communityMembers: CommunityMember[] = [
  { role: "Builder", count: 320, description: "Active hackers and project contributors" },
  { role: "Mentor", count: 45, description: "Experienced developers and engineers guiding the community" },
  { role: "Organizer", count: 28, description: "Volunteers running events and initiatives" },
  { role: "Sponsor", count: 12, description: "Organizations supporting the mission" },
]

export interface CommunityUpdate {
  date: string
  title: string
  excerpt: string
}

export const communityUpdates: CommunityUpdate[] = [
  {
    date: "2026-06-15",
    title: "Summer HackDay 2026 — Registrations Open",
    excerpt: "48-hour build sprint for students in Butwal. Form teams, ship projects, and earn trust markers.",
  },
  {
    date: "2026-05-28",
    title: "New Mentor Onboarding Program Launched",
    excerpt: "Structured mentorship track for experienced developers to guide first-time hackers.",
  },
  {
    date: "2026-05-10",
    title: "BH-ID Verification Now Live on Explorer",
    excerpt: "Public verification profiles are now searchable. Embed your BH-ID badge anywhere.",
  },
]

// ─── Chapter Data ────────────────────────────────────────────

export type ChapterStatus = "active" | "forming" | "inactive"

export interface Chapter {
  slug: string
  name: string
  city: string
  district: string
  province: string
  status: ChapterStatus
  established: string
  memberCount: number
  description: string
  highlights: string[]
  socialLinks: {
    whatsapp: string
  }
}

export const chapters: Chapter[] = [
  {
    slug: "pokhara",
    name: "Pokhara Chapter",
    city: "Pokhara",
    district: "Kaski",
    province: "Gandaki Province",
    status: "active",
    established: "2025",
    memberCount: 85,
    description:
      "Pokhara's tech community is growing fast. The chapter runs monthly meetups, weekend hackathons, and mentorship circles for students across Kaski and neighboring districts.",
    highlights: [
      "Monthly hack nights with 30+ attendees",
      "Student mentorship program with local colleges",
      "Annual Pokhara Hackathon — 48-hour build sprint",
      "Partnership with Gandaki University tech clubs",
    ],
    socialLinks: {
      whatsapp: "https://chat.whatsapp.com/pokhara-chapter",
    },
  },
  {
    slug: "kathmandu",
    name: "Kathmandu Chapter",
    city: "Kathmandu",
    district: "Kathmandu",
    province: "Bagmati Province",
    status: "active",
    established: "2025",
    memberCount: 120,
    description:
      "The Kathmandu chapter brings together students and professionals from the valley's top tech institutions. Known for flagship hackathons and industry mentorship sessions.",
    highlights: [
      "Valley-wide hackathon series — 100+ participants per event",
      "Industry mentorship from Kathmandu-based tech firms",
      "Workshop tracks on AI/ML, web dev, and open source",
      "Bi-weekly coding circles at partner co-working spaces",
    ],
    socialLinks: {
      whatsapp: "https://chat.whatsapp.com/kathmandu-chapter",
    },
  },
  {
    slug: "chitwan",
    name: "Chitwan Chapter",
    city: "Bharatpur",
    district: "Chitwan",
    province: "Bagmati Province",
    status: "active",
    established: "2026",
    memberCount: 45,
    description:
      "Chitwan's newest tech hub is already buzzing. Starting with an inaugural hackathon in Bharatpur, the chapter is building a strong community of young builders.",
    highlights: [
      "Inaugural Chitwan Hackathon — March 2026",
      "Growing mentorship network from Bharatpur colleges",
      "Focus on agritech and tourism-tech solutions",
      "Monthly beginner-friendly coding workshops",
    ],
    socialLinks: {
      whatsapp: "https://chat.whatsapp.com/chitwan-chapter",
    },
  },
]

export interface CommunityLink {
  name: string
  description: string
  href: string
  available: boolean
  icon: string
}

export const communityLinks: CommunityLink[] = [
  {
    name: "Discord",
    description: "Real-time discussions, project channels, and community hangouts.",
    href: "#",
    available: false,
    icon: "MessageSquare",
  },
  {
    name: "Telegram",
    description: "Quick updates, announcements, and community conversations.",
    href: "#",
    available: false,
    icon: "Send",
  },
  {
    name: "GitHub",
    description: "Open-source projects, code reviews, and collaborative development.",
    href: "https://github.com/Prarambha369/Butwal-Hacks",
    available: true,
    icon: "Github",
  },
  {
    name: "Contact",
    description: "Reach out directly for partnerships, sponsorships, or questions.",
    href: "/contact",
    available: true,
    icon: "Mail",
  },
]
