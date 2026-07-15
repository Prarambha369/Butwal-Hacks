"use server";

import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase/service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";

const ALLOWED_ROLES = ["hacker", "organizer", "maintainer", "sponsor", "lead"] as const;
type Role = (typeof ALLOWED_ROLES)[number];

/**
 * Select a role for the current user.
 * Handles eligibility checks for restricted roles:
 *   - hacker: always available
 *   - maintainer: requires @butwalhacks.com email + email_verified
 *   - organizer / sponsor: not available for self-selection (use requestRoleUpgrade)
 */
export async function selectRole(formData: FormData) {
  const role = formData.get("role") as Role;
  if (!ALLOWED_ROLES.includes(role)) {
    return { success: false, error: "Invalid role selected." };
  }

  const session = await auth0.getSession();
  if (!session?.user?.sub) {
    return { success: false, error: "Not authenticated." };
  }

  const userEmail = session.user.email ?? "";
  const emailVerified = session.user.email_verified === true;

  // ── Eligibility checks ─────────────────────────────────────
  if (role === "maintainer") {
    if (!userEmail.endsWith("@butwalhacks.com")) {
      return {
        success: false,
        error: "Maintainer access requires a @butwalhacks.com email address.",
      };
    }
    if (!emailVerified) {
      return {
        success: false,
        error: "Please verify your email address before selecting Maintainer role. Check your inbox for a verification link from Auth0.",
      };
    }
  }

  if (role === "organizer" || role === "sponsor") {
    return {
      success: false,
      error:
        role === "organizer"
          ? "Organizer access requires approval from a Maintainer. Please use the 'Request Access' option."
          : "Sponsor access requires approval from an Organizer or Maintainer. Please use the 'Request Access' option.",
    };
  }

  // ── Update role in database ────────────────────────────────
  const db = createServiceClient();
  const { error } = await db
    .from("profiles")
    .update({ role })
    .eq("auth0_user_id", session.user.sub);

  if (error) {
    logger.error("[role-selection] Failed to update role:", error);
    return { success: false, error: "Failed to update role. Please try again." };
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard/${role}`);
}

/**
 * Request a role upgrade to organizer or sponsor.
 * Creates a request record that maintainers can review and approve.
 */
export async function requestRoleUpgrade(formData: FormData) {
  const requestedRole = formData.get("requestedRole") as string;
  const message = (formData.get("message") as string) ?? "";

  if (!["organizer", "sponsor"].includes(requestedRole)) {
    return { success: false, error: "Invalid role requested." };
  }

  if (!message.trim() || message.trim().length < 10) {
    return { success: false, error: "Please provide a brief explanation (at least 10 characters)." };
  }

  const session = await auth0.getSession();
  if (!session?.user?.sub) {
    return { success: false, error: "Not authenticated." };
  }

  const db = createServiceClient();

  // Check if there's already a pending request
  const { data: existing } = await db
    .from("role_requests")
    .select("id, status")
    .eq("auth0_user_id", session.user.sub)
    .eq("requested_role", requestedRole)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      error: `You already have a pending ${requestedRole} request. A maintainer will review it shortly.`,
    };
  }

  const { error } = await db.from("role_requests").insert({
    auth0_user_id: session.user.sub,
    email: session.user.email ?? "",
    requested_role: requestedRole,
    message: message.trim().slice(0, 1000),
    status: "pending",
  });

  if (error) {
    logger.error("[role-selection] Failed to create role request:", error);
    return { success: false, error: "Failed to submit request. Please try again." };
  }

  logger.info(`[role-selection] Role upgrade request: ${session.user.email} → ${requestedRole}`);

  return {
    success: true,
    message: `Your ${requestedRole} request has been submitted. A maintainer will review it and reach out to you.`,
  };
}

/**
 * Get pending role requests (Maintainer only).
 */
export async function getPendingRoleRequests() {
  const session = await auth0.getSession();
  if (!session?.user?.sub) return [];

  const db = createServiceClient();

  // Verify the caller is a maintainer
  const { data: profile } = await db
    .from("profiles")
    .select("role, email")
    .eq("auth0_user_id", session.user.sub)
    .single();

  if (profile?.role !== "maintainer") return [];

  const { data: requests } = await db
    .from("role_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return requests ?? [];
}

/**
 * Approve or reject a role upgrade request (Maintainer only).
 */
export async function approveRoleRequest(formData: FormData) {
  const requestId = formData.get("requestId") as string;
  const action = formData.get("action") as "approve" | "reject";

  if (!requestId || !["approve", "reject"].includes(action)) {
    return { success: false, error: "Invalid request." };
  }

  const session = await auth0.getSession();
  if (!session?.user?.sub) return { success: false, error: "Not authenticated." };

  const db = createServiceClient();

  // Verify caller is a maintainer
  const { data: profile } = await db
    .from("profiles")
    .select("role, email")
    .eq("auth0_user_id", session.user.sub)
    .single();

  if (profile?.role !== "maintainer") {
    return { success: false, error: "Only maintainers can approve role requests." };
  }

  // Get the request
  const { data: req } = await db
    .from("role_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (!req) return { success: false, error: "Request not found." };

  if (action === "approve") {
    // Update the user's role
    const { error: updateError } = await db
      .from("profiles")
      .update({ role: req.requested_role })
      .eq("auth0_user_id", req.auth0_user_id);

    if (updateError) {
      logger.error("[role-selection] Failed to approve role request:", updateError);
      return { success: false, error: "Failed to approve request." };
    }
  }

  // Update request status
  await db
    .from("role_requests")
    .update({
      status: action === "approve" ? "approved" : "rejected",
      reviewed_by: session.user.sub,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  revalidatePath("/dashboard/maintainer/role-requests");

  return {
    success: true,
    message: action === "approve" ? "Request approved. User role updated." : "Request rejected.",
  };
}
