export type InitiativeStatus = "active" | "planned" | "proposed"

export type Initiative = {
  slug: string
  name: string
  status: InitiativeStatus
  tags: string[]
  summary: string
  details: string[]
}

export type EventStatus = "completed" | "planned"

export type EventItem = {
  slug: string
  title: string
  initiativeSlug: string
  tags: string[]
  status: EventStatus
  dateLabel: string
  summary: string
}

export type BlogPost = {
  slug: string
  title: string
  tags: string[]
  publishedAt: string
  excerpt: string
  body: string[]
  cover_image?: string
}

export const initiatives: Initiative[] = [
  {
    slug: "hackathon",
    name: "Hackathon",
    status: "active",
    tags: ["hackathon", "building", "teamwork", "coding"],
    summary: "48-hour build sprints where students ship real projects — websites, apps, hardware, games. Open to all skill levels across Nepal.",
    details: [
      "Multiple hackathon events throughout the year — each one a weekend build sprint with workshops, mentorship, and a shipped project.",
      "Projects are judged on execution, creativity, and real-world relevance — not on who has the shiniest resume.",
      "Workshops, mentorship, and team matching included. You show up with curiosity, leave with a shipped project.",
    ],
  },
  {
    slug: "mini-hackathon",
    name: "MiniHackathon",
    status: "active",
    tags: ["hackathon", "beginner", "hackday", "mentorship"],
    summary: "Shorter, beginner-friendly hack sessions under the HackDay format. Ship a prototype in a single day, no experience required.",
    details: [
      "A lightweight track designed for first-time hackers who want to build something without committing to a weekend-long event.",
      "Mentors guide teams through ideation to working prototype in 6-12 hours.",
      "Focus on rapid prototyping: pick a problem, form a team, build something that works.",
    ],
  },
  {
    slug: "gamejam",
    name: "GameJam",
    status: "active",
    tags: ["gamejam", "game-dev", "creative", "design"],
    summary: "Build a playable game in 24-48 hours. Design, code, and ship with a team — no game dev experience needed to start.",
    details: [
      "Weekend-long game jams focused on creativity, storytelling, and technical execution.",
      "Teams form around themes revealed at the start. Past games include Scratch platformers, Unity puzzle games, and text adventures.",
      "Workshops on game design, pixel art, and sound design are included with every jam.",
    ],
  },
]

export const events: EventItem[] = [
  {
    slug: "daydream-butwal-september-2024",
    title: "Daydream Butwal - September 2024",
    initiativeSlug: "gamejam",
    tags: ["gamejam", "game-dev", "high-school", "hackclub"],
    status: "completed",
    dateLabel: "September 27-28, 2024",
    summary: "A 24-hour game jam for high school students organized by Butwal Hacks in partnership with Hack Club. Participants built games, attended workshops, and showcased their creations.",
  },
  {
    slug: "hackday-butwal-2024",
    title: "HackDay Butwal 2024",
    initiativeSlug: "mini-hackathon",
    tags: ["hackathon", "beginner", "hackday", "learning"],
    status: "completed",
    dateLabel: "Completed program",
    summary: "A day-long build sprint where first-time hackers shipped their first projects — websites, games, and hardware demos.",
  },
]

export const blogPosts: BlogPost[] = [
  {
    slug: "why-butwal-needs-community-tech",
    title: "Why Community-Led Tech Learning Matters in Butwal",
    tags: ["community", "education", "mentorship", "butwal", "learning"],
    publishedAt: "2026-02-10",
    cover_image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200",
    excerpt:
      "A practical framework for volunteer-driven mentorship in Nepal's tech communities.",
    body: [
      "Butwal Hacks is a community where students build real projects and learn from each other. No gatekeeping, no fees — just people who show up to build.",
      "As a nonprofit, we keep our roadmap public and our finances transparent. Every rupee is tracked on Open Collective.",
    ],
  },
  {
    slug: "building-open-mentorship-culture",
    title: "Building an Open Mentorship Culture",
    tags: ["mentorship", "community", "culture", "opensource", "volunteer"],
    publishedAt: "2026-02-18",
    cover_image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1200",
    excerpt:
      "What we've learned from setting up volunteer-driven mentorship in Butwal and beyond.",
    body: [
      "Mentorship works best when the community shares ownership. Butwal Hacks helps mentors and learners work together consistently.",
      "Next up: better documentation, more consistent events, and community systems that work for everyone.",
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
  tags: string[]
  tagline: string
  dateLabel: string
  type: string
  price: string
  location: string
  initiativeSlug: string
  status: EventStatus
  whoCanParticipate: string[]
}

export const programs: Program[] = [
  {
    slug: "annual-hackathon",
    title: "Annual Hackathon",
    tags: ["hackathon", "annual", "flagship", "building"],
    tagline: "Building the future of Western Nepal, one commit at a time.",
    dateLabel: "Sept 15-17, 2024",
    type: "Hybrid (In-person & Online)",
    price: "Free",
    location: "Butwal, Rupandehi",
    initiativeSlug: "hackathon",
    status: "completed",
    whoCanParticipate: ["Open to all students and builders aged 15-30 residing in Nepal", "Teams of 1-4 members", "All skill levels welcome — beginners encouraged"],
  },
]

export function getProgramBySlug(slug: string): Program | undefined {
  return programs.find((p) => p.slug === slug)
}

// ─── Tag-based content matching ────────────────────────────

/**
 * Shared interface for any content item that has tags.
 */
export interface Taggable {
  slug: string
  tags?: string[]
}

/**
 * Returns items from `candidates` ranked by tag overlap with `sourceTags`,
 * excluding the item with `excludeSlug`. Falls back to returning up to `max`
 * items in original order when sourceTags is empty or no overlap is found.
 */
export function getRelatedByTags<T extends Taggable>(
  candidates: T[],
  sourceTags: string[],
  { excludeSlug, max = 3 }: { excludeSlug?: string; max?: number } = {},
): T[] {
  if (sourceTags.length === 0) {
    // No tags to match — return first N excluding current
    const filtered = excludeSlug
      ? candidates.filter((c) => c.slug !== excludeSlug)
      : [...candidates]
    return filtered.slice(0, max)
  }

  // Score each candidate by shared tag count, then sort descending
  const source = new Set(sourceTags)
  const scored = candidates
    .filter((c) => c.slug !== excludeSlug)
    .map((c) => ({
      item: c,
      score: (c.tags ?? []).reduce((sum, t) => sum + (source.has(t) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score)

  // If nothing scored, fall back to first N in original order
  if (scored.length === 0 || scored[0].score === 0) {
    const filtered = excludeSlug
      ? candidates.filter((c) => c.slug !== excludeSlug)
      : [...candidates]
    return filtered.slice(0, max)
  }

  return scored.slice(0, max).map((s) => s.item)
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
  { value: "—", label: "Community Members", description: "Active builders, mentors, and organizers across Lumbini Province" },
  { value: "—", label: "Events Hosted", description: "Hackathons, game jams, workshops, and meetups since 2024" },
  { value: "—", label: "Projects Shipped", description: "Open-source and hackathon projects built by the community" },
  { value: "—", label: "Districts Reached", description: "Youth participants from across Lumbini and neighboring provinces" },
]

export const communityMembers: CommunityMember[] = [
  { role: "Builder", count: 0, description: "Active hackers and project contributors" },
  { role: "Mentor", count: 0, description: "Experienced developers and engineers guiding the community" },
  { role: "Organizer", count: 0, description: "Volunteers running events and initiatives" },
  { role: "Sponsor", count: 0, description: "Organizations supporting the mission" },
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

// ─── Chapter Data (School-Based Model) ─────────────────────────
// Chapters are school-level, led by a student lead, partnered with
// the school's existing tech/coding club. Maintainers can dedicate
// orgs for schools and assign leads.

export type ChapterStatus = "active" | "forming" | "inactive"

export interface Chapter {
  slug: string
  name: string
  tags: string[]
  school: string
  leadName: string
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
    slug: "bhawani-secondary-school",
    name: "Bhawani Secondary School",
    tags: ["school", "bhawanipur", "rupandehi", "students"],
    school: "Bhawani Secondary School",
    leadName: "Sushant Acharya",
    city: "Siddharthanagar",
    district: "Rupandehi",
    province: "Lumbini Province",
    status: "active",
    established: "2025",
    memberCount: 35,
    description:
      "Partnered with the school's coding club to run monthly hackathons and weekend coding workshops. Students are building everything from quiz platforms to local marketplace tools.",
    highlights: [
      "Bi-weekly coding circles with 15+ regular attendees",
      "Inter-school hackathon 2025 — 8 teams participated",
      "Student-built quiz platform used by the school",
      "Mentorship partnership with Butwal tech professionals",
    ],
    socialLinks: {
      whatsapp: "https://chat.whatsapp.com/bhawani-chapter",
    },
  },
  {
    slug: "adarsha-secondary-school",
    name: "Adarsha Secondary School",
    tags: ["school", "adarsha", "butwal", "beginners"],
    school: "Adarsha Secondary School",
    leadName: "Pooja Thapa",
    city: "Butwal",
    district: "Rupandehi",
    province: "Lumbini Province",
    status: "active",
    established: "2025",
    memberCount: 28,
    description:
      "A high-energy chapter focused on introducing younger students to programming through game jams and creative coding projects in partnership with the school's tech club.",
    highlights: [
      "Game Jam 2025 — 12 student teams built Scratch and Python games",
      "Workshops on web fundamentals with 30+ participants",
      "Student-led project showcase every quarter",
      "Partnered with the school's IT club for lab access",
    ],
    socialLinks: {
      whatsapp: "https://chat.whatsapp.com/adarsha-chapter",
    },
  },
  {
    slug: "butwal-multiple-campus",
    name: "Butwal Multiple Campus",
    tags: ["campus", "butwal", "rupandehi", "college"],
    school: "Butwal Multiple Campus",
    leadName: "Anup Poudel",
    city: "Butwal",
    district: "Rupandehi",
    province: "Lumbini Province",
    status: "active",
    established: "2026",
    memberCount: 52,
    description:
      "Partnering with the campus's tech society to bridge curriculum learning with hands-on project building. Focus areas include web development, open source, and community tech solutions.",
    highlights: [
      "Monthly build nights with 20+ student attendees",
      "Open source contribution workshop — first PRs merged",
      "HackDay Butwal 2026 — 8 campus teams participated",
      "Industry mentorship sessions with local tech professionals",
    ],
    socialLinks: {
      whatsapp: "https://chat.whatsapp.com/bmc-chapter",
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
