import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/utils/supabase"
import { logger } from "@/lib/logger"
import { withRateLimit } from "@/lib/rate-limiter"
import { verifyWebhookSignature } from "@/lib/webhook-signature"
import { z } from "zod"

const AUTH0_WEBHOOK_SECRET = process.env.AUTH0_WEBHOOK_SECRET ?? "";

// Post-Login Action payload. Only `sub` is required; a GitHub login with a
// private address has no email. `email_verified` gates claiming a ghost row
// (migration 149); an Action that does not send it gets no claim.
const webhookBodySchema = z.object({
  sub: z.string().optional(),
  email: z.string().max(320).nullish(),
  name: z.string().max(200).nullish(),
  auth0_roles: z.array(z.string()).optional(),
  email_verified: z.boolean().optional(),
});

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

    // ── Webhook authentication (fail-closed) ───────────────────────
    if (!AUTH0_WEBHOOK_SECRET) {
      logger.error("[auth0-webhook] AUTH0_WEBHOOK_SECRET not configured - rejecting all requests");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // The body is read once and HMAC-covered — HMAC must be computed over the
    // exact bytes the caller signed, not a reserialised parse.
    const rawBody = await req.text()
    if (Buffer.byteLength(rawBody, "utf8") > 1_048_576) {
      return new NextResponse("Payload too large", { status: 413 })
    }

    const headerSignature = req.headers.get("x-webhook-signature")
    const headerTimestamp = req.headers.get("x-webhook-timestamp")
    const hmacOk = verifyWebhookSignature({
      rawBody,
      signature: headerSignature,
      timestamp: headerTimestamp,
      secret: AUTH0_WEBHOOK_SECRET,
    });

    if (!hmacOk) {
      // ── Legacy shared-secret path (deprecated) ───────────────────
      // The Auth0 Action now signs the request; this branch exists so a
      // deployment window where the Action is HMAC but the route is not
      // (or vice versa) never breaks profile sync. Remove it once the HMAC
      // action is confirmed deployed and every environment redeployed.
      const headerSecret = req.headers.get("x-webhook-secret") ?? ""
      // SECURITY: constant-time comparison prevents timing attacks on webhook secret
      const expectedBuf = Buffer.from(AUTH0_WEBHOOK_SECRET, "utf8")
      const receivedBuf = Buffer.from(headerSecret, "utf8")
      if (
        !headerSecret ||
        expectedBuf.length !== receivedBuf.length ||
        !crypto.timingSafeEqual(expectedBuf, receivedBuf)
      ) {
        logger.warn("[auth0-webhook] Rejected request - invalid or missing webhook authentication")
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 })
      }
      logger.warn("[auth0-webhook] Accepted legacy static x-webhook-secret (deprecated; use HMAC)")
    }

    // ── Parse the (now trusted) raw body ────────────────────────────
    let json: unknown;
    try {
      json = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = webhookBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const { sub, email, name, auth0_roles, email_verified } = parsed.data

    // Email is optional: a GitHub login whose address is private arrives
    // without one. Rejecting it used to leave the user with no profile, and
    // the first server action then minted an email-less "New Hacker" row.
    if (!sub) {
      return NextResponse.json({ error: "sub is required" }, { status: 400 })
    }
    const normalizedEmail = typeof email === "string" && email.includes("@") ? email.trim().toLowerCase() : null
    // Auth0 sets `name` to the email address for database signups. That is
    // not a name; never store it as one.
    const cleanName = name?.trim() && !name.includes("@") ? name.trim() : null

    // ── Map Auth0 roles to app role ──────────────────────────────
    const resolvedRole = mapAuth0Roles(auth0_roles ?? []) || "hacker";

    const db = createServiceClient()

    // Check if profile already exists (by auth0_user_id)
    const { data: existingProfile } = await db
      .from("profiles")
      .select("id, role, email, full_name")
      .eq("auth0_user_id", sub)
      .single()

      if (existingProfile) {
        // Lower-cased on write, not just on read. Bulk roster matching filters
        // on this column and PostgREST's `= ANY` on text is case-sensitive, so a
        // stored "Asha@Example.com" would never match a lowercased roster row
        // and the organizer would be told "no profile" for someone who is
        // registered. Email local parts are case-insensitive per RFC 5321.
        const update: Record<string, unknown> = {};
        // An address Auth0 reports as unverified is not written over a stored one.
        if (normalizedEmail && email_verified !== false && normalizedEmail !== existingProfile.email) {
          update.email = normalizedEmail;
        }
        // Only fill a placeholder name. Overwriting on every login reset any
        // name the member had edited in their profile back to Auth0's value.
        const currentName = (existingProfile.full_name ?? "").trim();
        if (cleanName && (!currentName || currentName === "New Hacker" || currentName.includes("@"))) {
          update.full_name = cleanName;
        }

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

      if (Object.keys(update).length > 0) {
        const { error: updateError } = await db.from("profiles").update(update).eq("id", existingProfile.id)
        if (updateError?.code === "23505" && "email" in update) {
          // The address already belongs to another profile (same person,
          // different login method, not yet linked). Don't let that one
          // column sink the role/name sync; keep the rest and flag it.
          logger.warn("[auth0-webhook] email already on another profile; possible duplicate account", { auth0_id: sub })
          delete update.email
          if (Object.keys(update).length > 0) {
            await db.from("profiles").update(update).eq("id", existingProfile.id)
          }
        } else if (updateError) {
          logger.error("[auth0-webhook] profile update failed:", updateError)
        }
      }

      logger.info("Auth0 webhook: existing profile updated", {
        auth0_id: sub,
        role: resolvedRole,
        has_name: !!name,
      });
    } else {
        // Atomic BH-ID generation via Postgres RPC.
        // p_email is lower-cased for the same reason as the update branch: bulk
        // roster matching filters on this column and PostgREST's `= ANY` on text
        // is case-sensitive, so a mixed-case new profile would never match.
        // The fix on the update branch alone left every *new* profile still
        // writing mixed case.
        const { data: result, error: rpcError } = await db.rpc('create_profile_with_bh_id', {
          p_auth0_user_id: sub,
          p_email: normalizedEmail,
          p_full_name: cleanName || 'New Hacker',
          p_role: resolvedRole,
          // Ghost-row claims need a verified address (migration 149).
          p_email_verified: email_verified === true,
        })

      if (rpcError?.code === "23505") {
        // Same email, different Auth0 identity: this is a second login method
        // for an existing member. Creating a parallel profile is exactly the
        // duplicate-account bug, so don't. The member links the identity from
        // their dashboard (Settings → Linked accounts) instead.
        logger.warn("[auth0-webhook] email already on another profile; not creating a duplicate", { auth0_id: sub })
        return NextResponse.json({ success: true, duplicate_email: true })
      }
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
