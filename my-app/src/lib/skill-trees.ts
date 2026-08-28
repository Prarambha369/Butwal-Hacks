// ponytail: icon string keys only — React elements live in UI components.

export interface SkillCondition {
  type: "tech_count" | "tech_categories" | "github_verified" | "event_count" | "project_count" | "unique_tech_count";
  tech?: string;
  categories?: string[];
  min_count: number;
}

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  conditions: SkillCondition;
  prerequisiteIds: string[];
}

export interface SkillTier {
  id: string;
  name: string;
  skills: SkillNode[];
}

export interface SkillTree {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  tiers: SkillTier[];
}

export const SKILL_TREES: SkillTree[] = [
  {
    id: "frontend",
    name: "Frontend Foundations",
    description: "Master the art of building beautiful, responsive user interfaces.",
    icon: "Layout",
    color: "from-blue-500 to-cyan-400",
    tiers: [
      {
        id: "frontend-tier-1",
        name: "Core Builder",
        skills: [          {
            id: "react-pro",
            name: "React Pro",
            description: "Build 3+ projects using React",
            icon: "react",
            xpReward: 200,
            conditions: { type: "tech_count", tech: "React", min_count: 3 },
            prerequisiteIds: [],
          },
        ],
      },
      {
        id: "frontend-tier-2",
        name: "Design Master",
        skills: [
          {
            id: "ui-master",
            name: "UI Master",
            description: "Build projects using Tailwind CSS or similar frameworks",
            icon: "palette",
            xpReward: 250,
            conditions: { type: "tech_count", tech: "Tailwind CSS", min_count: 2 },
            prerequisiteIds: ["react-pro"],
          },
        ],
      },
      {
        id: "frontend-tier-3",
        name: "Full Stack Bridge",
        skills: [
          {
            id: "full-stack",
            name: "Full Stack",
            description: "Build projects using both frontend and backend technologies",
            icon: "globe",
            xpReward: 250,
            conditions: { type: "tech_categories", categories: ["Frontend","Backend"], min_count: 2 },
            prerequisiteIds: ["react-pro"],
          },
        ],
      },
    ],
  },
  {
    id: "backend",
    name: "Backend & API",
    description: "Build servers, APIs, and data pipelines that power applications.",
    icon: "Server",
    color: "from-emerald-500 to-teal-400",
    tiers: [
      {
        id: "backend-tier-1",
        name: "Language Foundations",
        skills: [          {
            id: "pythonista",
            name: "Pythonista",
            description: "Build 1+ project using Python",
            icon: "python",
            xpReward: 100,
            conditions: { type: "tech_count", tech: "Python", min_count: 1 },
            prerequisiteIds: [],
          },
        ],
      },
      {
        id: "backend-tier-2",
        name: "API Builder",
        skills: [
          {
            id: "api-architect",
            name: "API Architect",
            description: "Build 2+ projects with API or database integrations",
            icon: "cable",
            xpReward: 200,
            conditions: { type: "tech_categories", categories: ["API","Database"], min_count: 2 },
            prerequisiteIds: ["pythonista"],
          },
        ],
      },
    ],
  },
  {
    id: "ai-ml",
    name: "AI & Machine Learning",
    description: "Explore artificial intelligence and machine learning technologies.",
    icon: "Brain",
    color: "from-purple-500 to-pink-400",
    tiers: [
      {
        id: "ai-tier-1",
        name: "AI Foundations",
        skills: [
          {
            id: "ai-explorer",
            name: "AI Explorer",
            description: "Build 1+ project using AI/ML technologies",
            icon: "cpu",
            xpReward: 200,
            conditions: { type: "tech_count", tech: "AI", min_count: 1 },
            prerequisiteIds: [],
          },
        ],
      },
      {
        id: "ai-tier-2",
        name: "Advanced ML",
        skills: [
          {
            id: "ml-practitioner",
            name: "ML Practitioner",
            description: "Build 2+ AI/ML projects with verifiable results",
            icon: "network",
            xpReward: 300,
            conditions: { type: "tech_count", tech: "AI", min_count: 2 },
            prerequisiteIds: ["ai-explorer"],
          },
        ],
      },
    ],
  },
  {
    id: "devops",
    name: "DevOps & Tools",
    description: "Master version control, deployment, and developer workflows.",
    icon: "GitBranch",
    color: "from-orange-500 to-amber-400",
    tiers: [
      {
        id: "devops-tier-1",
        name: "Version Control",
        skills: [
          {
            id: "git-master",
            name: "Git Master",
            description: "Ship 2+ GitHub-verified projects",
            icon: "link",
            xpReward: 150,
            conditions: { type: "github_verified", min_count: 2 },
            prerequisiteIds: [],
          },
        ],
      },
      {
        id: "devops-tier-2",
        name: "Deployment",
        skills: [
          {
            id: "deployment-pro",
            name: "Deployment Pro",
            description: "Deploy 2+ projects with live URLs",
            icon: "rocket",
            xpReward: 200,
            conditions: { type: "project_count", min_count: 2 },
            prerequisiteIds: ["git-master"],
          },
        ],
      },
    ],
  },
  {
    id: "community",
    name: "Community & Growth",
    description: "Engage with the community, participate in events, and contribute projects.",
    icon: "Users",
    color: "from-rose-500 to-red-400",
    tiers: [
      {
        id: "community-tier-1",
        name: "Participation",
        skills: [
          {
            id: "hackathon-hero",
            name: "Hackathon Hero",
            description: "Participate in 3+ events",
            icon: "trophy",
            xpReward: 150,
            conditions: { type: "event_count", min_count: 3 },
            prerequisiteIds: [],
          },
        ],
      },
      {
        id: "community-tier-2",
        name: "Contribution",
        skills: [
          {
            id: "community-champion",
            name: "Community Champion",
            description: "Submit 3+ projects total",
            icon: "zap",
            xpReward: 100,
            conditions: { type: "project_count", min_count: 3 },
            prerequisiteIds: ["hackathon-hero"],
          },
        ],
      },
      {
        id: "community-tier-3",
        name: "Mastery",
        skills: [
          {
            id: "polyglot",
            name: "Polyglot Dev",
            description: "Use 5+ different technologies across your projects",
            icon: "layers",
            xpReward: 300,
            conditions: { type: "unique_tech_count", min_count: 5 },
            prerequisiteIds: ["community-champion"],
          },
        ],
      },
    ],
  },
];

export type SkillStatus = "locked" | "available" | "in_progress" | "unlocked";

export interface SkillWithStatus extends SkillNode {
  status: SkillStatus;
  progress: number;
  progressMax: number;
  tierId: string;
  treeId: string;
}

export interface SkillTreeWithStatus extends Omit<SkillTree, "tiers"> {
  tiers: Array<Omit<SkillTier, "skills"> & { skills: SkillWithStatus[] }>;
  unlockedCount: number;
  totalCount: number;
  overallProgress: number;
}

/**
 * Shared mapping from skill icon name to Lucide React component.
 * Import this from any component that needs to render skill icons.
 */
// SKILL_ICONS removed — UI components render icons directly.