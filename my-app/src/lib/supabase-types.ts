
export type Role = 'hacker' | 'organizer' | 'maintainer' | 'sponsor' | 'lead'

export interface Profile {
  id: string
  full_name: string
  slug_id: string
  email: string | null
  role: Role
  is_claimed: boolean
  github_username: string | null
  bio: string | null
  avatar_url: string | null
  xp: number
  is_suspended: boolean
  created_at: string
  bh_id: string
  socials?: {
    github?: string
    linkedin?: string
    twitter?: string
    website?: string
  }
  skills?: string[]
  trust_markers?: TrustMarker[]
  ai_summary?: string | null
}

export interface BHEvent {
  id: string
  organizer_id: string
  title: string
  description: string | null
  start_date: string
  end_date: string
  location: string | null
  banner_url: string | null
  is_published: boolean
  created_at: string
}

export interface TrustMarker {
  id: string
  profile_id: string
  issuer_id: string
  event_id: string | null
  type: string
  title: string
  description: string | null
  is_revoked: boolean
  revocation_reason: string | null
  crypto_signature: string | null
  created_at: string
}

export type ProjectCategory = 'Web App' | 'Mobile App' | 'AI/ML' | 'Data Science' | 'Blockchain' | 'Hardware/IoT' | 'DevOps/Tools' | 'Game Dev' | 'Open Source Tool' | 'Other';

export const PROJECT_CATEGORIES: ProjectCategory[] = [
  'Web App',
  'Mobile App',
  'AI/ML',
  'Data Science',
  'Blockchain',
  'Hardware/IoT',
  'DevOps/Tools',
  'Game Dev',
  'Open Source Tool',
  'Other',
];

export interface Project {
  id: string
  team_id: string | null
  event_id: string | null
  title: string
  description: string | null
  demo_url: string | null
  github_url: string | null
  cover_image: string | null
  video_url: string | null
  tech_stack: string[]
  category: ProjectCategory | null
  github_verified: boolean
  created_at: string
  gallery: string[] | null
  project_likes?: { count: number }[]
}

export interface Team {
  id: string
  event_id: string
  name: string
  looking_for_members: boolean
  created_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  profile_id: string
  is_captain: boolean
  created_at: string
}

export interface EventRegistration {
  id: string
  event_id: string
  profile_id: string
  attended: boolean
  created_at: string
}

export interface AuditLog {
  id: string
  actor_id: string
  action: string
  target_type: string | null
  target_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface Photo {
  id: string
  event_id: string
  uploader_id: string
  url: string
  span: number
  tagged_profiles: string[]
  created_at: string
}

export interface ApiKey {
  id: string
  profile_id: string
  key_hash: string
  name: string
  is_active: boolean
  last_used_at: string | null
  created_at: string
}

// ─── Display Types (UI-facing, not DB schema) ─────────────────

export interface Certificate {
  id: string
  title: string
  issuer: string
  date: string
  year: string
  verified: 'Verified' | 'NotVerified' | 'UnknownSource'
  certificateUrl?: string
  verificationTrail?: string
}

export interface EventHistory {
  id: string
  name: string
  date: string
  role: 'Participant' | 'Organizer' | 'Mentor' | 'Volunteer' | 'Winner' | 'Runner-up' | 'Speaker' | 'Judge'
  status: 'Completed' | 'Upcoming'
  eventLogo?: string
}

export interface HackerProfile {
  uniqueId: string
  name: string
  avatar: string
  bannerUrl?: string
  role: 'Organizer' | 'Hacker' | 'Mentor'
  bio: string
  socials: {
    github?: string
    linkedin?: string
    twitter?: string
    website?: string
  }
  certificates: Certificate[]
  projects: DisplayProject[]
  events: EventHistory[]
  photos: DisplayPhoto[]
  trustMarkers?: TrustMarker[]
  id?: string
  /** Auth0 user ID (auth0|abc...) — used for live presence matching */
  auth0_user_id?: string
}

export interface DisplayProject {
  id: string
  name: string
  description: string
  image: string
  techStack: string[]
  githubUrl?: string
  demoUrl?: string
  hackathonOrigin: string
}

export interface DisplayPhoto {
  id: string
  url: string
  event: string
  date: string
  span: number
}
