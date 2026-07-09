
export type Role = 'hacker' | 'organizer' | 'maintainer'

export interface Profile {
  id: string
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
  github_verified: boolean
  created_at: string
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

export interface SkillEndorsement {
  id: string
  endorser_id: string
  endorsee_id: string
  skill: string
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

export interface BatchJob {
  id: string
  organizer_id: string
  status: 'pending' | 'processing' | 'done' | 'failed'
  payload: unknown
  processed_count: number
  created_at: string
}
