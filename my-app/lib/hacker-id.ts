export type HackerRole = 'Organizer' | 'Hacker' | 'Mentor';

export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  date: string;
  year: string;
  verified: 'Verified' | 'NotVerified' | 'UnknownSource';
  certificateUrl?: string;
  verificationTrail?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  image: string;
  techStack: string[];
  githubUrl?: string;
  demoUrl?: string;
  hackathonOrigin: string;
}

export interface EventHistory {
  id: string;
  name: string;
  date: string;
  role: 'Participant' | 'Organizer' | 'Mentor' | 'Volunteer' | 'Winner' | 'Runner-up' | 'Speaker' | 'Judge';
  status: 'Completed' | 'Upcoming';
  eventLogo?: string;
}

export interface Photo {
  id: string;
  url: string;
  event: string;
  date: string;
  span: number; // For Bento Grid (1 or 2)
}

export interface HackerProfile {
  uniqueId: string; // e.g., BH-2024-089
  name: string;
  avatar: string;
  bannerUrl?: string;
  role: HackerRole;
  bio: string;
  socials: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  certificates: Certificate[];
  projects: Project[];
  events: EventHistory[];
  photos: Photo[];
}

export const hackerProfiles: Record<string, HackerProfile> = {
  'BH-2024-001': {
    uniqueId: 'BH-2024-001',
    name: 'Bashyal',
    avatar: '/avatars/bashyal.jpg', // Placeholder
    role: 'Organizer',
    bio: 'Founder of Butwal Hacks. Dedicated to decentralizing tech education in Nepal.',
    socials: {
      github: 'https://github.com/Prarambha369',
      linkedin: 'https://linkedin.com/in/bashyal',
    },
    certificates: [
      {
        id: 'cert-1',
        title: 'Community Leadership Award',
        issuer: 'The Hack Foundation',
        date: '2024-05-20',
        year: '24',
        verified: 'Verified',
        certificateUrl: 'https://via.placeholder.com/800x1100?text=Official+Certification+Image',
        verificationTrail: 'Verified via direct API integration with The Hack Foundation Registry on 2024-06-01. Document authenticity confirmed by SHA-256 hash match.',
      },
      {
        id: 'cert-2',
        title: 'Open Source Contributor',
        issuer: 'Community Project X',
        date: '2023-11-10',
        year: '23',
        verified: 'NotVerified',
        certificateUrl: 'https://via.placeholder.com/800x1100?text=Pending+Certification',
        verificationTrail: 'Verification request sent to Community Project X on 2024-05-10. Awaiting response from issuer.',
      },
      {
        id: 'cert-3',
        title: 'Web Development Basics',
        issuer: 'Local Workshop',
        date: '2022-08-15',
        year: '22',
        verified: 'UnknownSource',
        certificateUrl: 'https://via.placeholder.com/800x1100?text=Unverified+Document',
        verificationTrail: 'Self-uploaded document. No verifiable contact found for "Local Workshop".',
      },
    ],
    projects: [
      {
        id: 'proj-1',
        name: 'Butwal Hacks Platform',
        description: 'The official hub for the community.',
        image: '/projects/bh-platform.jpg',
        techStack: ['Next.js', 'Tailwind v4', 'TypeScript'],
        githubUrl: 'https://github.com/Prarambha369/Butwal-Hacks',
        demoUrl: 'https://butwalhacks.com',
        hackathonOrigin: 'Internal Development',
      },
    ],
    events: [
      {
        id: 'ev-1',
        name: 'Daydream Butwal',
        date: '2024-09-15',
        role: 'Organizer',
        status: 'Completed',
        eventLogo: 'https://via.placeholder.com/100x100?text=DB',
      },
      {
        id: 'ev-2',
        name: 'Hack-a-Thon 2024',
        date: '2024-11-20',
        role: 'Winner',
        status: 'Completed',
        eventLogo: 'https://via.placeholder.com/100x100?text=HAT',
      },
      {
        id: 'ev-3',
        name: 'DevSummit Nepal',
        date: '2025-01-10',
        role: 'Speaker',
        status: 'Completed',
        eventLogo: 'https://via.placeholder.com/100x100?text=DSN',
      },
      {
        id: 'ev-4',
        name: 'Lumbini Tech Meet',
        date: '2025-03-05',
        role: 'Judge',
        status: 'Completed',
        eventLogo: 'https://via.placeholder.com/100x100?text=LTM',
      },
      {
        id: 'ev-5',
        name: 'Youth Tech Expo',
        date: '2025-05-12',
        role: 'Mentor',
        status: 'Upcoming',
        eventLogo: 'https://via.placeholder.com/100x100?text=YTE',
      },
      {
        id: 'ev-6',
        name: 'Open Source Week',
        date: '2025-06-01',
        role: 'Volunteer',
        status: 'Upcoming',
        eventLogo: 'https://via.placeholder.com/100x100?text=OSW',
      },
      {
        id: 'ev-7',
        name: 'Regional Hack',
        date: '2025-07-20',
        role: 'Runner-up',
        status: 'Upcoming',
        eventLogo: 'https://via.placeholder.com/100x100?text=RH',
      },
      {
        id: 'ev-8',
        name: 'Community Sync',
        date: '2025-08-15',
        role: 'Participant',
        status: 'Upcoming',
        eventLogo: 'https://via.placeholder.com/100x100?text=CS',
      },
    ],
    photos: [
      { id: 'ph-1', url: '/photos/bh-1.jpg', event: 'Daydream Butwal', date: '2024-09', span: 2 },
      { id: 'ph-2', url: '/photos/bh-2.jpg', event: 'Daydream Butwal', date: '2024-09', span: 1 },
    ],
  },
  'BH-2024-089': {
    uniqueId: 'BH-2024-089',
    name: 'Sabin Sharma',
    avatar: '/avatars/sabin.jpg',
    role: 'Hacker',
    bio: 'Full-stack enthusiast and rapid prototyper.',
    socials: {
      github: 'https://github.com/sabin',
    },
    certificates: [],
    projects: [],
    events: [],
    photos: [],
  },
};

export async function getHackerProfile(uniqueId: string): Promise<HackerProfile | null> {
  // Simulating async DB call
  return hackerProfiles[uniqueId] || null;
}

// Simulation for current logged-in user
export const currentUser = {
  uniqueId: 'BH-2024-001', // Defaulting to Bashyal for testing owner view
  name: 'Bashyal',
};
