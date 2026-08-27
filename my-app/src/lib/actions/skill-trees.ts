"use server";

import { logger } from "@/lib/logger";
import { createServiceClient } from "@/utils/supabase";
import { revalidatePath } from "next/cache";
import { resolveProfileId } from "@/lib/profile-resolver";
import {
  SKILL_TREES,
  type SkillTreeWithStatus,
  type SkillWithStatus,
  type SkillStatus,
} from "@/lib/skill-trees";

interface Project {
  tech_stack?: string[] | null;
  github_url?: string | null;
  demo_url?: string | null;
}

interface EventRegistration {
  attended?: boolean | null;
}

interface UnlockedCredential {
  credential_id: string;
}

/**
 * Fetch all skill trees with the user's unlock status.
 * Evaluates project data, event registrations, and already-unlocked credentials.
 */
export async function getSkillTreesWithStatus(options?: {
  page?: number;
  per_page?: number;
}): Promise<SkillTreeWithStatus[]> {
  const supabase = createServiceClient();
  const profileId = await resolveProfileId();

  // Fetch user's projects
  const { data: projects } = await supabase
    .from("projects")
    .select("tech_stack, github_url, demo_url")
    .eq("profile_id", profileId);

  // Fetch event registrations
  const { data: registrations } = await supabase
    .from("event_registrations")
    .select("attended")
    .eq("profile_id", profileId);

  // Fetch already-unlocked credentials
  const { data: unlocked } = await supabase
    .from("profile_micro_credentials")
    .select("credential_id")
    .eq("profile_id", profileId);

  const unlockedIds = new Set((unlocked ?? []).map((u: UnlockedCredential) => u.credential_id));
  const userProjects = (projects ?? []) as Project[];
  const eventRegistrations = (registrations ?? []) as EventRegistration[];

  // Compute technology usage statistics
  const techCounts = new Map<string, number>();
  let uniqueTechCount = 0;
  let githubVerifiedCount = 0;
  let hasFrontend = false;
  let hasBackend = false;
  let hasApiProject = false;
  let hasDatabaseProject = false;

  for (const p of userProjects) {
    const techs = p.tech_stack ?? [];
    for (const tech of techs) {
      techCounts.set(tech, (techCounts.get(tech) ?? 0) + 1);
    }
    if (p.github_url) githubVerifiedCount++;
  }

  uniqueTechCount = techCounts.size;
  hasFrontend = techCounts.has("React") || techCounts.has("Tailwind CSS") || techCounts.has("Next.js") || techCounts.has("Vue") || techCounts.has("Angular");
  hasBackend = techCounts.has("Node.js") || techCounts.has("Python") || techCounts.has("Go") || techCounts.has("Rust") || techCounts.has("Django") || techCounts.has("Flask") || techCounts.has("Express");
  hasApiProject = userProjects.some((p) => (p.tech_stack ?? []).some((t) => ["Node.js", "Express", "FastAPI", "GraphQL", "REST"].includes(t)));
  hasDatabaseProject = userProjects.some((p) => (p.tech_stack ?? []).some((t) => ["PostgreSQL", "MongoDB", "Supabase", "Prisma", "SQLite", "MySQL"].includes(t)));

  const attendedEvents = eventRegistrations.filter((r) => r.attended).length;
  const totalProjects = userProjects.length;

  function evaluateCondition(skillId: string, conditions: { type: string; tech?: string; categories?: string[]; min_count: number }): { met: boolean; current: number; target: number } {
    switch (conditions.type) {
      case "tech_count": {
        const current = techCounts.get(conditions.tech ?? "") ?? 0;
        return { met: current >= conditions.min_count, current, target: conditions.min_count };
      }
      case "tech_categories": {
        let matched = 0;
        if (conditions.categories?.includes("Frontend") && hasFrontend) matched++;
        if (conditions.categories?.includes("Backend") && hasBackend) matched++;
        if (conditions.categories?.includes("API") && hasApiProject) matched++;
        if (conditions.categories?.includes("Database") && hasDatabaseProject) matched++;
        return { met: matched >= conditions.min_count, current: matched, target: conditions.min_count };
      }
      case "github_verified": {
        return { met: githubVerifiedCount >= conditions.min_count, current: githubVerifiedCount, target: conditions.min_count };
      }
      case "event_count": {
        return { met: attendedEvents >= conditions.min_count, current: attendedEvents, target: conditions.min_count };
      }
      case "project_count": {
        return { met: totalProjects >= conditions.min_count, current: totalProjects, target: conditions.min_count };
      }
      case "unique_tech_count": {
        return { met: uniqueTechCount >= conditions.min_count, current: uniqueTechCount, target: conditions.min_count };
      }
      default:
        return { met: false, current: 0, target: conditions.min_count };
    }
  }

  function evaluateSkillStatus(skill: { id: string; conditions: { type: string; tech?: string; categories?: string[]; min_count: number }; prerequisiteIds: string[] }): { status: SkillStatus; progress: number; progressMax: number } {
    // Already unlocked?
    if (unlockedIds.has(skill.id)) {
      return { status: "unlocked", progress: 1, progressMax: 1 };
    }

    // Check prerequisites
    const allPrereqsMet = skill.prerequisiteIds.every((pid) => unlockedIds.has(pid));

    if (!allPrereqsMet) {
      return { status: "locked", progress: 0, progressMax: 1 };
    }

    // Evaluate conditions
    const result = evaluateCondition(skill.id, skill.conditions);

    if (result.met && result.current >= result.target) {
      return { status: "available", progress: result.target, progressMax: result.target };
    }

    if (result.current > 0) {
      return { status: "in_progress", progress: result.current, progressMax: result.target };
    }

    return { status: "available", progress: 0, progressMax: result.target };
  }

  const treesWithStatus: SkillTreeWithStatus[] = SKILL_TREES.map((tree) => {
    let unlockedCount = 0;
    let totalCount = 0;

    const tiersWithStatus = tree.tiers.map((tier) => {
      const skillsWithStatus: SkillWithStatus[] = tier.skills.map((skill) => {
        totalCount++;
        const evalResult = evaluateSkillStatus(skill);
        if (evalResult.status === "unlocked") unlockedCount++;
        return {
          ...skill,
          status: evalResult.status,
          progress: evalResult.progress,
          progressMax: evalResult.progressMax,
          tierId: tier.id,
          treeId: tree.id,
        };
      });
      return { ...tier, skills: skillsWithStatus };
    });

    return {
      ...tree,
      tiers: tiersWithStatus,
      unlockedCount,
      totalCount,
      overallProgress: totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0,
    };
  });

  // Apply pagination if requested
  const page = Math.max(1, options?.page ?? 1);
  const perPage = Math.min(50, Math.max(1, options?.per_page ?? 50));
  const start = (page - 1) * perPage;

  if (options?.page) {
    return treesWithStatus.slice(start, start + perPage);
  }

  return treesWithStatus;
}

/**
 * Attempt to unlock a skill by ID.
 * Evaluates conditions server-side and inserts into profile_micro_credentials if met.
 * Also awards XP for the unlock.
 */
export async function unlockSkill(skillId: string) {
  const supabase = createServiceClient();
  const profileId = await resolveProfileId();

  // Find the skill definition from already-imported SKILL_TREES
  let targetSkill: { id: string; name: string; xpReward: number } | null = null;
  for (const tree of SKILL_TREES) {
    for (const tier of tree.tiers) {
      const found = tier.skills.find((s) => s.id === skillId);
      if (found) {
        targetSkill = { id: found.id, name: found.name, xpReward: found.xpReward };
        break;
      }
    }
    if (targetSkill) break;
  }

  if (!targetSkill) {
    throw new Error("Skill not found");
  }

  // Check if already unlocked
  const { data: existing } = await supabase
    .from("profile_micro_credentials")
    .select("credential_id")
    .eq("profile_id", profileId)
    .eq("credential_id", skillId)
    .single();

  if (existing) {
    return { success: true, alreadyUnlocked: true, skillName: targetSkill.name };
  }

  // Get current status to verify conditions are met
  const treesWithStatus = await getSkillTreesWithStatus();
  let skillFound = false;
  let conditionMet = false;

  for (const tree of treesWithStatus) {
    for (const tier of tree.tiers) {
      const skill = tier.skills.find((s) => s.id === skillId);
      if (skill) {
        skillFound = true;
        conditionMet = skill.status === "available" || skill.status === "in_progress";
        break;
      }
    }
    if (skillFound) break;
  }

  if (!conditionMet) {
    throw new Error("Skill unlock conditions not yet met. Complete the required projects first.");
  }

  // Insert unlock record
  const { error: insertError } = await supabase
    .from("profile_micro_credentials")
    .insert({
      profile_id: profileId,
      credential_id: skillId,
      unlocked_at: new Date().toISOString(),
    });

  if (insertError) {
    logger.error("Failed to unlock skill:", insertError);
    throw new Error("Failed to unlock skill");
  }

  // Award XP
  const { data: profile } = await supabase
    .from("profiles")
    .select("xp")
    .eq("id", profileId)
    .single();

  const currentXP = profile?.xp ?? 0;
  const newXP = currentXP + targetSkill.xpReward;

  const { error: xpError } = await supabase
    .from("profiles")
    .update({ xp: newXP })
    .eq("id", profileId);

  if (xpError) {
    logger.error("Failed to award XP for skill unlock:", xpError);
  }

  // Audit log
  const { error: auditError } = await supabase
    .from("audit_logs")
    .insert({
      actor_id: profileId,
      action: "SKILL_UNLOCKED",
      target_type: "micro_credential",
      target_id: skillId,
      metadata: {
        skill_name: targetSkill.name,
        xp_awarded: targetSkill.xpReward,
        previous_xp: currentXP,
        new_xp: newXP,
      },
    });

  if (auditError) {
    logger.error("Failed to log skill unlock:", auditError);
  }

  revalidatePath("/dashboard/hacker");
  revalidatePath("/dashboard/hacker/skills");
  revalidatePath("/api/skill-trees");
  return {
    success: true,
    alreadyUnlocked: false,
    skillName: targetSkill.name,
    xpAwarded: targetSkill.xpReward,
    newXP,
  };
}

/**
 * Fetch unlocked micro-credentials for a specific profile (for the public Hacker ID profile page).
 * Returns the list of unlocked skills with their details and icons from SKILL_TREES.
 */
export async function getProfileUnlockedSkills(profileId: string) {
  const supabase = createServiceClient();

  const { data: unlocked } = await supabase
    .from("profile_micro_credentials")
    .select("credential_id, unlocked_at")
    .eq("profile_id", profileId);

  if (!unlocked || unlocked.length === 0) {
    return { unlockedSkills: [], totalUnlocked: 0, totalSkills: SKILL_TREES.reduce((s, t) => s + t.tiers.reduce((st, ti) => st + ti.skills.length, 0), 0) };
  }

  const unlockedIds = new Set(unlocked.map((u) => u.credential_id));

  // Match unlocked credentials against SKILL_TREES to get full skill details
  const unlockedSkills: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    treeName: string;
    treeColor: string;
    xpReward: number;
    unlockedAt: string;
  }> = [];

  for (const tree of SKILL_TREES) {
    for (const tier of tree.tiers) {
      for (const skill of tier.skills) {
        if (unlockedIds.has(skill.id)) {
          const record = unlocked.find((u) => u.credential_id === skill.id);
          unlockedSkills.push({
            id: skill.id,
            name: skill.name,
            description: skill.description,
            icon: skill.icon,
            treeName: tree.name,
            treeColor: tree.color,
            xpReward: skill.xpReward,
            unlockedAt: record?.unlocked_at ?? "",
          });
        }
      }
    }
  }

  const totalSkills = SKILL_TREES.reduce(
    (s, t) => s + t.tiers.reduce((st, ti) => st + ti.skills.length, 0),
    0
  );

  return {
    unlockedSkills,
    totalUnlocked: unlockedSkills.length,
    totalSkills,
  };
}

/**
 * Get a summary of the user's skill tree progress (for dashboard widgets).
 */
export async function getSkillTreeSummary() {
  const trees = await getSkillTreesWithStatus();
  const totalSkills = trees.reduce((sum, t) => sum + t.totalCount, 0);
  const totalUnlocked = trees.reduce((sum, t) => sum + t.unlockedCount, 0);
  const overallProgress = totalSkills > 0 ? (totalUnlocked / totalSkills) * 100 : 0;

  return {
    totalSkills,
    totalUnlocked,
    overallProgress,
    treeCount: trees.length,
    recentUnlocks: trees
      .flatMap((t) => t.tiers.flatMap((ti) => ti.skills))
      .filter((s) => s.status === "unlocked"),
  };
}
