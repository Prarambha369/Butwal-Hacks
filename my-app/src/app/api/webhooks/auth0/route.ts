import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/utils/supabase/service"
import { logger } from "@/lib/logger"
import { withRateLimit } from "@/lib/rate-limiter"
import { captureServerEvent, identifyServerUser } from "@/lib/analytics/server"
import { posthogLog } from "@/lib/posthog-logger"

const AUTH0_WEBHOOK_SECRET = process.env.AUTH0_WEBHOOK_SECRET ?? "";

/**
 * Maps Auth0 role names (assigned in Auth0 Dashboard) to app-internal role values.
 * The user configured these roles in Auth0 → User Management → Roles:
 *   "Hacker", "Organizer", "Maintainer", "Sponsors", "Lead"
 */
const AUTH0_ROLE_MAP: Record<string, string> = {
  "Hacker": "hacker",
  "Organizer": "organizer",
  "Maintainer": "maintainer",
  "Sponsors": "sponsor",   // Plural in Auth0, singular in app
  "Lead": "lead",           // Chapter Lead
};

/**
 * Priority order for role assignment. If a user has multiple Auth0 roles,
 * the highest-priority role wins.
 */
const ROLE_PRIORITY: Record<string, number> = {
  "maintainer": 5,
  "organizer": 4,
  "sponsor": 3,
  "lead": 2,
  "hacker": 1,
};

function mapAuth0Roles(auth0Roles: string[]): string | null {
  const mapped = auth0Roles
    .map((r) => AUTH0_ROLE_MAP[r])
    .filter(Boolean);

  if (mapped.length === 0) return null;

  // Return the highest-priority role
  return mapped.sort((a, b) => (ROLE_PRIORITY[b] || 0) - (ROLE_PRIORITY[a] || 0))[0];
}

/**
 * POST /api/webhooks/auth0
 *
 * Called by Auth0 Action (Post-Login) to sync user to Supabase profiles.
 * Auth0 Actions send a POST with the user's sub (Auth0 User ID), email, name,
 * and optional auth0_roles array.
 *
 * If AUTH0_WEBHOOK_SECRET is set (production), verifies the X-Webhook-Secret
 * header matches. In dev, the secret is usually unset so the check is skipped.
 */
export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    // ponytail: content-length check before parsing body
    const rawLength = req.headers.get("content-length")
    const contentLength = parseInt(rawLength ?? "0", 10)
    if (!isNaN(contentLength) && contentLength > 1_048_576) {
      return new NextResponse("Payload too large", { status: 413 })
    }

    // ── Webhook secret verification ──────────────────────────────
    if (AUTH0_WEBHOOK_SECRET) {
      const headerSecret = req.headers.get("x-webhook-secret");
      if (!headerSecret || headerSecret !== AUTH0_WEBHOOK_SECRET) {
        logger.warn("[auth0-webhook] Rejected request — invalid or missing webhook secret");
        return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });
      }
    }

    const body = await req.json() as {
      sub?: string
      email?: string
      name?: string
      auth0_roles?: string[]
    }

    const { sub, email, name, auth0_roles } = body;

    if (!sub || !email) {
      return NextResponse.json({ error: "sub and email are required" }, { status: 400 })
    }

    // ── Map Auth0 roles to app role ──────────────────────────────
    let resolvedRole = "hacker";
    if (auth0_roles && Array.isArray(auth0_roles) && auth0_roles.length > 0) {
      const mapped = mapAuth0Roles(auth0_roles);
      if (mapped) {
        resolvedRole = mapped;
        logger.info(`[auth0-webhook] Auth0 roles [${auth0_roles.join(", ")}] → mapped to "${resolvedRole}" for ${email}`);
      }
    }

    const db = createServiceClient()

    // Check if profile already exists (by auth0_user_id)
    const { data: existingProfile } = await db
      .from("profiles")
      .select("id, role")
      .eq("auth0_user_id", sub)
      .single()

    if (existingProfile) {
      // Build update payload
      const updateData: Record<string, unknown> = {
        email,
        full_name: name?.trim() || null,
      };

      // Only upgrade role if Auth0 roles are provided and have higher priority
      if (resolvedRole !== "hacker") {
        const currentPriority = ROLE_PRIORITY[existingProfile.role as string] || 0;
        const newPriority = ROLE_PRIORITY[resolvedRole] || 0;
        if (newPriority > currentPriority) {
          updateData.role = resolvedRole;
          logger.info(`[auth0-webhook] Upgrading ${email} role: ${existingProfile.role} → ${resolvedRole}`);
        }
      }

      await db
        .from("profiles")
        .update(updateData)
        .eq("id", existingProfile.id)

      posthogLog.info("Auth0 webhook: existing profile updated", {
        auth0_id: sub,
        email,
        role: resolvedRole,
        has_name: !!name,
      });
    } else {
      // Atomic BH-ID generation via Postgres RPC
      const { data: result, error: rpcError } = await db.rpc('create_profile_with_bh_id', {
        p_auth0_user_id: sub,
        p_email: email,
        p_full_name: name?.trim() || 'New Hacker',
        p_role: resolvedRole,
      })

      if (rpcError || !result) {
        logger.error("[auth0-webhook] RPC insert failed:", rpcError)
        return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
      }

      const bhId = (result as { bh_id: string }).bh_id

      await identifyServerUser(sub, { bh_id: bhId, role: resolvedRole })
      await captureServerEvent('user_signed_up', sub, { bh_id: bhId, role: resolvedRole })

      posthogLog.info("Auth0 webhook: new profile created", {
        auth0_id: sub,
        email,
        bh_id: bhId,
        role: resolvedRole,
        name: name?.trim(),
      });

      logger.info(`[auth0-webhook] Created profile BH-ID: ${bhId} for ${email} (role: ${resolvedRole})`)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    posthogLog.error("Auth0 webhook failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    logger.error("[auth0-webhook] Error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}, "bulk")
