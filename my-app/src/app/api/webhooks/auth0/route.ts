import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/utils/supabase"
import { logger } from "@/lib/logger"
import { withRateLimit } from "@/lib/rate-limiter"

const AUTH0_WEBHOOK_SECRET = process.env.AUTH0_WEBHOOK_SECRET ?? "";

/** Maps Auth0 role names to app-internal role values.
 *  Assigned in Auth0 Dashboard → User Management → Roles. */
const AUTH0_ROLE_MAP: Record<string, string> = {
  "Hacker": "hacker",
  "Organizer": "organizer",
  "Maintainer": "maintainer",
  "Sponsors": "sponsor",
  "Lead": "lead",
};

/** Role precedence (index 0 = highest). Used to prevent downgrades. */
const ROLE_RANK = ["maintainer", "organizer", "sponsor", "lead", "hacker"];

/**
 * Maps Auth0 roles to the corresponding application role.
 *
 * @param auth0Roles - Auth0 role names to resolve
 * @returns The first recognized application role, or `null` when none are recognized
 */
function mapAuth0Roles(auth0Roles: string[]): string | null {
  const mapped = auth0Roles
    .map((r) => AUTH0_ROLE_MAP[r])
    .filter((r): r is string => !!r);
  if (mapped.length === 0) return null;
  // Pick the role with the highest precedence (lowest ROLE_RANK index)
  let best = mapped[0];
  let bestRank = ROLE_RANK.indexOf(best);
  for (let i = 1; i < mapped.length; i++) {
    const rank = ROLE_RANK.indexOf(mapped[i]);
    if (rank !== -1 && (bestRank === -1 || rank < bestRank)) {
      best = mapped[i];
      bestRank = rank;
    }
  }
  return best;
}

/**
 * POST /api/webhooks/auth0
 *
 * Called by Auth0 Action (Post-Login) to sync user to Supabase profiles.
 */
export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    // ponytail: content-length check before parsing body
    const rawLength = req.headers.get("content-length")
    const contentLength = parseInt(rawLength ?? "0", 10)
    if (!isNaN(contentLength) && contentLength > 1_048_576) {
      return new NextResponse("Payload too large", { status: 413 })
    }

    // ── Webhook secret verification (fail-closed) ─────────────────
    if (!AUTH0_WEBHOOK_SECRET) {
      logger.error("[auth0-webhook] AUTH0_WEBHOOK_SECRET not configured - rejecting all requests");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const headerSecret = req.headers.get("x-webhook-secret");
    if (!headerSecret || headerSecret !== AUTH0_WEBHOOK_SECRET) {
      logger.warn("[auth0-webhook] Rejected request - invalid or missing webhook secret");
      return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });
    }

    const { sub, email, name, auth0_roles } = await req.json() as {
      sub?: string
      email?: string
      name?: string
      auth0_roles?: string[]
    }

    if (!sub || !email) {
      return NextResponse.json({ error: "sub and email are required" }, { status: 400 })
    }

    // ── Map Auth0 roles to app role ──────────────────────────────
    const resolvedRole = mapAuth0Roles(auth0_roles ?? []) || "hacker";

    const db = createServiceClient()

    // Check if profile already exists (by auth0_user_id)
    const { data: existingProfile } = await db
      .from("profiles")
      .select("id, role")
      .eq("auth0_user_id", sub)
      .single()

    if (existingProfile) {
      const update: Record<string, unknown> = { email, full_name: name?.trim() || null };

      if (resolvedRole !== existingProfile.role) {
        // Unknown/invalid existing roles are treated as lowest precedence so a
        // valid resolvedRole can always correct them (indexOf would return -1).
        const oldRankRaw = ROLE_RANK.indexOf(existingProfile.role ?? "hacker");
        const oldRank = oldRankRaw === -1 ? ROLE_RANK.length : oldRankRaw;
        const newRank = ROLE_RANK.indexOf(resolvedRole);
        if (newRank !== -1 && newRank < oldRank) {
          update.role = resolvedRole;
          logger.info(`[auth0-webhook] Upgrading sub=${sub} role: ${existingProfile.role} -> ${resolvedRole}`);
        }
      }

      await db.from("profiles").update(update).eq("id", existingProfile.id)

      logger.info("Auth0 webhook: existing profile updated", {
        auth0_id: sub,
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

      logger.info("Auth0 webhook: new profile created", {
        auth0_id: sub,
        bh_id: bhId,
        role: resolvedRole,
      });

      logger.info(`[auth0-webhook] Created profile BH-ID: ${bhId} for sub=${sub} (role: ${resolvedRole})`)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error("Auth0 webhook failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    logger.error("[auth0-webhook] Error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}, "bulk")
