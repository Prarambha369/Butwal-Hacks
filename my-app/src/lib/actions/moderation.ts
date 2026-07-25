"use server";

import { logger } from "@/lib/logger";
import { createServiceClient } from "@/utils/supabase";
import { revalidatePath } from "next/cache";
import { auth0 } from "@/lib/auth0";

export async function verifyProjectGitHub(projectId: string) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const supabase = createServiceClient();

    const { error } = await supabase
      .from("projects")
      .update({ github_verified: true })
      .eq("id", projectId);

    if (error) throw error;

    revalidatePath("/dashboard/maintainer");
    return { success: true };
  } catch (error) {
    logger.error("Error verifying project:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Verification failed",
    };
  }
}

export async function updateProjectStatus(projectId: string, status: string) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) throw new Error("Unauthorized");

    const supabase = createServiceClient();

    const { error } = await supabase
      .from("projects")
      .update({ status })
      .eq("id", projectId);

    if (error) throw error;

    revalidatePath("/dashboard/maintainer");
    return { success: true };
  } catch (error) {
    logger.error("Error updating project status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
}
