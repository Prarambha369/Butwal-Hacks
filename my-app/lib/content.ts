export type InitiativeStatus = "active" | "planned" | "proposed"

export type Initiative = {
  slug: string
  name: string
  status: InitiativeStatus
  tier: 1 | 2 | 3 | 4
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
    tier: 2,
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
    tier: 2,
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
    tier: 2,
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
