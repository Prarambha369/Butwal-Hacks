export type MemberRole = "founder" | "organizer" | "mentor" | "volunteer" | "member"

export interface Member {
  id: string
  name: string
  role: MemberRole
  title: string
  bio: string
  skills: string[]
  github?: string
  linkedin?: string
  twitter?: string
  website?: string
  avatar?: string
  joinDate: string
  projects: number
  contributions: number
}

export const members: Member[] = [
  {
    id: "1",
    name: "Bashyal",
    role: "founder",
    title: "Founder & Lead Organizer",
    bio: "Passionate about building tech communities and empowering youth through technology education.",
    skills: ["React", "TypeScript", "Node.js", "Community Building"],
    github: "https://github.com/Prarambha369",
    
    joinDate: "2023-01-15",
    projects: 12,
    contributions: 156,
  },
  {
    id: "2",
    name: "Sabin Sharma",
    role: "organizer",
    title: "Event Coordinator",
    bio: "Full-stack developer focused on creating inclusive tech events and workshops.",
    skills: ["Python", "Django", "React", "Event Management"],
    
    
    joinDate: "2023-03-20",
    projects: 8,
    contributions: 89,
  },
  {
    id: "3",
    name: "Priya Adhikari",
    role: "mentor",
    title: "Frontend Mentor",
    bio: "Frontend specialist helping newcomers master modern web development.",
    skills: ["React", "Vue.js", "CSS", "UI/UX Design"],
    
    
    
    joinDate: "2023-05-10",
    projects: 6,
    contributions: 67,
  },
  {
    id: "4",
    name: "Ramesh Kumar",
    role: "member",
    title: "Student Developer",
    bio: "CS student exploring open source and building practical projects.",
    skills: ["Java", "Android", "Git", "Algorithms"],
    
    joinDate: "2024-01-05",
    projects: 3,
    contributions: 23,
  },
  {
    id: "5",
    name: "Sita Devi",
    role: "member",
    title: "Aspiring Developer",
    bio: "Learning programming through community mentorship and hackathons.",
    skills: ["JavaScript", "HTML", "CSS", "Python"],
    
    joinDate: "2024-02-15",
    projects: 2,
    contributions: 15,
  },
  {
    id: "6",
    name: "Mohan Poudel",
    role: "volunteer",
    title: "Community Volunteer",
    bio: "Helping organize events and supporting new community members.",
    skills: ["Communication", "Project Management", "Documentation"],
    
    joinDate: "2023-08-12",
    projects: 4,
    contributions: 45,
  },
]

export const roleLabels: Record<MemberRole, string> = {
  founder: "Founder",
  organizer: "Organizer",
  mentor: "Mentor",
  volunteer: "Volunteer",
  member: "Member",
}

export const roleColors: Record<MemberRole, string> = {
  founder: "bg-primary text-primary-foreground",
  organizer: "bg-secondary text-secondary-foreground",
  mentor: "bg-accent text-accent-foreground",
  volunteer: "bg-muted text-muted-foreground",
  member: "bg-card text-card-foreground border border-border",
}

export function getMemberById(id: string): Member | undefined {
  return members.find((member) => member.id === id)
}

export function getMembersByRole(role: MemberRole): Member[] {
  return members.filter((member) => member.role === role)
}

export function getTopContributors(limit: number = 5): Member[] {
  return [...members]
    .sort((a, b) => b.contributions - a.contributions)
    .slice(0, limit)
}
