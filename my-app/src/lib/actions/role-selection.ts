"use server";

import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";
import { describeSupabaseError } from "@/lib/supabase-error";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";
import { accessSubjectFor, isMaintainer } from "@/lib/dashboard-access";

const ALLOWED_ROLES = ["hacker", "organizer", "maintainer", "sponsor", "lead"] as const;
type Role = (typeof ALLOWED_ROLES)[number];

/**
 * Roles a member may grant themselves.
 *
 * Only `hacker`. Every other role is authority somebody had to decide to give,
 * and a role the user picks for themselves is not a decision -- it is a
 * request. `organizer` and `sponsor` go through `requestRoleUpgrade`;
 * `maintainer` and `lead` are assigned by maintainer tooling or the Auth0
 * role-sync webhook.
 *
 * This used to allow `maintainer` on the strength of the caller's own email
 * address, which made staff access self-service: any account that could be
 * created on the staff domain reached every admin surface. An address suffix
 * is an attribute of the account, not an authorization decision, so it cannot
 * be the second factor -- and the check was case-sensitive while the layout
 * gate it was supposed to mirror case-folded, so the two did not even agree.
 */
const SELF_SELECTABLE_ROLES = ["hacker"] as const;

/**
 * Select a role for the current user.
 *
 * Only `hacker` is self-selectable. See SELF_SELECTABLE_ROLES for why the
 * elevated roles are absent rather than merely gated.
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

  // ── Eligibility checks ─────────────────────────────────────
  if (!(SELF_SELECTABLE_ROLES as readonly string[]).includes(role)) {
    return {
      success: false,
      error:
        role === "maintainer" || role === "lead"
          ? `${role === "maintainer" ? "Maintainer" : "Lead"} access is granted by a maintainer, not self-assigned. Please use the 'Request Access' option.`
          : `${role === "organizer" ? "Organizer" : "Sponsor"} access requires approval. Please use the 'Request Access' option.`,
    };
  }

  // ── Update role in database ────────────────────────────────
  const db = createServiceClient();
  const { error } = await db
    .from("profiles")
    .update({ role })
    .eq("auth0_user_id", session.user.sub);

  if (error) {
    const { diagnostic, userMessage } = describeSupabaseError(error);
    logger.error(`[role-selection] Failed to update role: ${diagnostic}`);
    return { success: false, error: userMessage };
  }

  revalidatePath("/dashboard");

  // `role` is now provably "hacker" -- the only entry in SELF_SELECTABLE_ROLES.
  redirect(`/dashboard/${role}`);
}

/**
 * Request a role upgrade to organizer or sponsor.
 * Creates a request record that maintainers can review and approve.
 */
const APPROVABLE_REQUEST_ROLES = ["organizer", "sponsor"] as const;

export async function requestRoleUpgrade(formData: FormData) {
  const requestedRole = formData.get("requestedRole") as string;
  const message = (formData.get("message") as string) ?? "";

  if (!APPROVABLE_REQUEST_ROLES.includes(requestedRole as (typeof APPROVABLE_REQUEST_ROLES)[number])) {
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

  // Check if there's already a pending request.
  //
  // The error is inspected deliberately. This read used to be destructured
  // down to `{ data }`, so a failed lookup looked identical to "no duplicate
  // exists" and the guard failed open -- every submit went through whenever
  // the database was unreachable.
  const { data: existing, error: lookupError } = await db
    .from("role_requests")
    .select("id, status")
    .eq("auth0_user_id", session.user.sub)
    .eq("requested_role", requestedRole)
    .eq("status", "pending")
    .maybeSingle();

  if (lookupError) {
    const { diagnostic, userMessage } = describeSupabaseError(lookupError);
    logger.error(`[role-selection] Pending-request lookup failed: ${diagnostic}`);
    return { success: false, error: userMessage };
  }

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
    // The read above and this write are not atomic, so two concurrent submits
    // can both pass the duplicate check. The partial unique index
    // (migration 123) is the real authority, so a unique violation means
    // "already pending", not "failed".
    if (error.code === "23505") {
      return {
        success: false,
        error: `You already have a pending ${requestedRole} request. A maintainer will review it shortly.`,
      };
    }

    const { diagnostic, userMessage } = describeSupabaseError(error);
    logger.error(`[role-selection] Failed to create role request: ${diagnostic}`);
    return { success: false, error: userMessage };
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

  // The canonical predicate, not a bare role comparison. This used to accept
  // any profile carrying role='maintainer', including one on a personal
  // address that every maintainer layout refuses -- so the queue was readable
  // by accounts that could not otherwise reach a single admin page.
  const { data: profile } = await db
    .from("profiles")
    .select("role")
    .eq("auth0_user_id", session.user.sub)
    .single();

  if (!isMaintainer(accessSubjectFor(session.user, profile))) return [];

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

  // Same canonical predicate as the layouts and requireMaintainer(). This was
  // a bare role comparison with no address or verification check, which made
  // role approval reachable to any profile that happened to claim the role.
  const { data: callerProfile } = await db
    .from("profiles")
    .select("role")
    .eq("auth0_user_id", session.user.sub)
    .single();

  if (!isMaintainer(accessSubjectFor(session.user, callerProfile))) {
    return { success: false, error: "Only maintainers can approve role requests." };
  }

  // Get the request
  const { data: req } = await db
    .from("role_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (!req) return { success: false, error: "Request not found." };

  // `requested_role` is CHECK-constrained to organizer|sponsor in the database
  // (migration 091), so this is belt-and-braces: an approval must never be the
  // mechanism that grants a privileged role, whatever the row happens to say.
  if (!APPROVABLE_REQUEST_ROLES.includes(req.requested_role as (typeof APPROVABLE_REQUEST_ROLES)[number])) {
    logger.error("[role-selection] Refusing to approve a non-approvable role", {
      request_id: requestId,
    });
    return { success: false, error: "That role cannot be granted through a request." };
  }

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
