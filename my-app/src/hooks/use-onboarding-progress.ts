"use client";



type Profile = {
  full_name?: string | null;
  bio?: string | null;
  socials?: Record<string, string> | null;
  xp?: number | null;
  trust_markers?: unknown[] | null;
};

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  isComplete: boolean;
}

export type StepState = "pending" | "current" | "completed";

export const WIZARD_DISMISSED_KEY = "bh:wizard-dismissed";

const STEP_DEFINITIONS: Pick<
  OnboardingStep,
  "id" | "title" | "description" | "href" | "cta"
>[] = [
  {
    id: "profile",
    title: "Complete Your Profile",
    description:
      "Add your name, bio, and social links so the community knows who you are.",
    href: "/dashboard/hacker/profile",
    cta: "Set up profile",
  },
  {
    id: "chapter",
    title: "Join a Chapter",
    description:
      "Find your local hackathon chapter and start collaborating with fellow builders.",
    href: "/explore",
    cta: "Browse chapters",
  },
  {
    id: "project",
    title: "Submit Your First Project",
    description:
      "Ship something. A hack, a tool, an experiment. Your first project starts your portfolio.",
    href: "/dashboard/hacker/projects",
    cta: "Create project",
  },
  {
    id: "marker",
    title: "Earn Your First Trust Marker",
    description:
      "Participate in an event or challenge and get a cryptographically-signed credential.",
    href: "/events",
    cta: "Explore events",
  },
];

/**
 * useOnboardingProgress — determines which onboarding steps are complete
 * based on the user's profile and activity.
 *
 * Returns the steps array, completion metadata, and the next incomplete step.
 */
export function useOnboardingProgress(
  profile: Profile | null,
  chapterCount: number,
  projectCount: number
) {
  const hasName = !!profile?.full_name && profile.full_name !== "New Hacker";
  const hasBio = !!profile?.bio;
  const hasSocial =
    !!profile?.socials && Object.values(profile.socials).some(Boolean);
  const hasMarkers = (profile?.trust_markers?.length ?? 0) > 0;

  const steps: OnboardingStep[] = STEP_DEFINITIONS.map((def) => {
    let isComplete = false;
    switch (def.id) {
      case "profile":
        isComplete = hasName && hasBio && hasSocial;
        break;
      case "chapter":
        isComplete = chapterCount > 0;
        break;
      case "project":
        isComplete = projectCount > 0;
        break;
      case "marker":
        isComplete = hasMarkers;
        break;
    }
    return { ...def, isComplete };
  });

  const completedCount = steps.filter((s) => s.isComplete).length;
  const totalCount = steps.length;
  const allComplete = completedCount === totalCount;
  const progress = Math.round((completedCount / totalCount) * 100);
  const currentStepIndex = steps.findIndex((s) => !s.isComplete);

  return {
    steps,
    completedCount,
    totalCount,
    allComplete,
    progress,
    currentStepIndex,
  };
}
