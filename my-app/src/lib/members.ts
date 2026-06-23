// ─── Member Profile Types ─────────────────────────────────────────
// ponytail: static data for the explorer hub. Replace with Supabase query
// when the profiles API is ready. content-driven, no DB dependency.

export interface ExplorerMember {
  bhId: string
  name: string
  role: "Builder" | "Mentor" | "Organizer" | "Sponsor"
  avatar: string
  bio: string
  skills: string[]
  xp: number
  projects: number
  joined: string
  /** Auth0 user ID for live presence matching. Undefined for static sample data. */
  auth0_user_id?: string
}

// ─── Sample Member Profiles ───────────────────────────────────────
// Realistic profiles for Butwal's youth tech community.
// When the profiles API is ready, replace this with:
//   const { data } = await supabase.from('profiles').select('...')

export const explorerMembers: ExplorerMember[] = [
  {
    bhId: "BH-26-001",
    name: "Aarav Sharma",
    role: "Builder",
    avatar: "AS",
    bio: "Full-stack developer passionate about building tools for local businesses in Butwal.",
    skills: ["React", "Node.js", "PostgreSQL", "Tailwind"],
    xp: 2450,
    projects: 4,
    joined: "2024-09",
  },
  {
    bhId: "BH-26-002",
    name: "Priya Gurung",
    role: "Mentor",
    avatar: "PG",
    bio: "Software engineer with 5+ years of experience. Mentoring first-time hackers and open-source contributors.",
    skills: ["Python", "Django", "AWS", "Docker", "Mentoring"],
    xp: 5800,
    projects: 12,
    joined: "2024-06",
  },
  {
    bhId: "BH-26-003",
    name: "Rajan Thapa",
    role: "Builder",
    avatar: "RT",
    bio: "CS student building open-source projects for Nepal's education sector.",
    skills: ["Next.js", "TypeScript", "Supabase", "Figma"],
    xp: 1800,
    projects: 3,
    joined: "2025-01",
  },
  {
    bhId: "BH-26-004",
    name: "Sneha KC",
    role: "Organizer",
    avatar: "SK",
    bio: "Community lead at Butwal Hacks. Organizing events, managing teams, and growing the local tech ecosystem.",
    skills: ["Event Management", "Community Building", "Public Speaking", "Git"],
    xp: 3200,
    projects: 2,
    joined: "2024-03",
  },
  {
    bhId: "BH-26-005",
    name: "Binod Acharya",
    role: "Builder",
    avatar: "BA",
    bio: "Self-taught developer building mobile-first web apps. Hackathon winner 2024.",
    skills: ["React Native", "Firebase", "JavaScript", "UI/UX"],
    xp: 2100,
    projects: 5,
    joined: "2024-11",
  },
  {
    bhId: "BH-26-006",
    name: "Anita Basnet",
    role: "Mentor",
    avatar: "AB",
    bio: "DevOps engineer helping teams ship faster. Specializes in CI/CD and cloud infrastructure.",
    skills: ["Kubernetes", "Terraform", "CI/CD", "Go", "Linux"],
    xp: 6400,
    projects: 8,
    joined: "2024-04",
  },
  {
    bhId: "BH-26-007",
    name: "Kiran Poudel",
    role: "Builder",
    avatar: "KP",
    bio: "High school student learning to code. Built a waste management tracker for Butwal municipality.",
    skills: ["HTML/CSS", "JavaScript", "Python", "Arduino"],
    xp: 890,
    projects: 2,
    joined: "2025-03",
  },
  {
    bhId: "BH-26-008",
    name: "Maya Rai",
    role: "Organizer",
    avatar: "MR",
    bio: "Co-organizer of Daydream Butwal game jam. Advocating for women in tech in Lumbini Province.",
    skills: ["Game Design", "Workshop Facilitation", "Graphic Design", "Unity"],
    xp: 2700,
    projects: 3,
    joined: "2024-05",
  },
  {
    bhId: "BH-26-009",
    name: "Sagar Bhatta",
    role: "Sponsor",
    avatar: "SB",
    bio: "CTO of a local SaaS company. Supporting Butwal Hacks through sponsorships and mentorship.",
    skills: ["SaaS", "Product Management", "Vue.js", "Leadership"],
    xp: 4200,
    projects: 6,
    joined: "2024-08",
  },
  {
    bhId: "BH-26-010",
    name: "Roshani Thapa",
    role: "Builder",
    avatar: "RT",
    bio: "Frontend developer and UI designer. Building accessible web experiences for Nepali users.",
    skills: ["React", "CSS", "Accessibility", "Storybook", "Figma"],
    xp: 1650,
    projects: 3,
    joined: "2024-12",
  },
  {
    bhId: "BH-26-011",
    name: "Dipendra Koirala",
    role: "Mentor",
    avatar: "DK",
    bio: "Backend engineer at a Kathmandu-based fintech. Helping students master system design.",
    skills: ["Java", "Spring Boot", "Microservices", "Redis", "SQL"],
    xp: 5100,
    projects: 10,
    joined: "2024-07",
  },
  {
    bhId: "BH-26-012",
    name: "Sunita Ghimire",
    role: "Builder",
    avatar: "SG",
    bio: "Data science enthusiast exploring ML applications for agriculture in Nepal.",
    skills: ["Python", "Pandas", "Scikit-learn", "Jupyter", "R"],
    xp: 1300,
    projects: 2,
    joined: "2025-02",
  },
]

// ─── Search & Filter Utilities ────────────────────────────────────

export type ExplorerFilters = {
  role?: ExplorerMember["role"] | "All"
  query?: string
  sortBy?: "xp" | "projects" | "name" | "joined"
}

export function filterMembers(filters: ExplorerFilters): ExplorerMember[] {
  let results = [...explorerMembers]

  // Filter by role
  if (filters.role && filters.role !== "All") {
    results = results.filter((m) => m.role === filters.role)
  }

  // Search by BH-ID, name, skills, or bio
  if (filters.query && filters.query.trim()) {
    const q = filters.query.toLowerCase().trim()
    results = results.filter(
      (m) =>
        m.bhId.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.skills.some((s) => s.toLowerCase().includes(q)) ||
        m.bio.toLowerCase().includes(q),
    )
  }

  // Sort
  if (filters.sortBy) {
    results.sort((a, b) => {
      switch (filters.sortBy) {
        case "xp":
          return b.xp - a.xp
        case "projects":
          return b.projects - a.projects
        case "name":
          return a.name.localeCompare(b.name)
        case "joined":
          return b.joined.localeCompare(a.joined)
        default:
          return 0
      }
    })
  }

  return results
}

// ─── Aggregated Stats ─────────────────────────────────────────────

export function getExplorerStats() {
  const total = explorerMembers.length
  const totalXp = explorerMembers.reduce((sum, m) => sum + m.xp, 0)
  const totalProjects = explorerMembers.reduce((sum, m) => sum + m.projects, 0)
  const byRole = {
    Builder: explorerMembers.filter((m) => m.role === "Builder").length,
    Mentor: explorerMembers.filter((m) => m.role === "Mentor").length,
    Organizer: explorerMembers.filter((m) => m.role === "Organizer").length,
    Sponsor: explorerMembers.filter((m) => m.role === "Sponsor").length,
  }

  return { total, totalXp, totalProjects, byRole }
}
