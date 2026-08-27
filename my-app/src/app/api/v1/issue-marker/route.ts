import { NextRequest, NextResponse } from "next/server"
import { auth0 } from "@/lib/auth0"
import { createServiceClient } from "@/utils/supabase"
import { logger } from "@/lib/logger"
import { withRateLimit } from "@/lib/rate-limiter"
import { ghostMarkerNotificationHtml } from "@/lib/ghost-marker-email"
import { signTrustMarker } from "@/lib/crypto-sign"
import { bustCache } from "@/lib/cache"
import { z } from "zod"

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL ?? ""

// ponytail: single POST endpoint. Ghost profile creation + email are side effects
// in the same handler. If email volume grows, move to a background queue.

const IssueMarkerSchema = z.object({
  email: z.string().min(1).transform((v) => v.trim().toLowerCase()),
  title: z.string().min(1).max(200).transform((v) => v.trim()),
  description: z.string().max(2000).transform((v) => v.trim()).nullable().default(null),
  type: z.string().default("achievement"),
});

export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    const session = await auth0.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.sub
    const supabase = createServiceClient()

    // ── Require organizer or maintainer role ───────────────────────
    const { data: issuerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("auth0_user_id", userId)
      .single();

    if (!issuerProfile || (issuerProfile.role !== "organizer" && issuerProfile.role !== "maintainer")) {
      return NextResponse.json({ error: "Forbidden — organizer or maintainer role required" }, { status: 403 });
    }

    const raw = await req.json()
    const parsed = IssueMarkerSchema.safeParse(raw)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request: email and title are required" }, { status: 400 })
    }

    const { email: normalizedEmail, title: safeTitle, description: safeDescription, type } = parsed.data
    // ponytail: Resolve profile UUID for issuer_id FK
    const { data: issuer } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth0_user_id", userId)
      .single();

    // Check if the target email already has a profile
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("id, bh_id, full_name, auth0_user_id")
      .eq("email", normalizedEmail)
      .maybeSingle()

    if (targetProfile) {
      // ── Known user: issue marker directly ──────────────
      const { data: marker, error } = await supabase
        .from("trust_markers")
        .insert({
          profile_id: targetProfile.id,
          issuer_id: issuer?.id ?? userId,
          title: safeTitle,
          description: safeDescription,
          type: type || "achievement",
          is_claimed: true,
        })
        .select("id, created_at")
        .single()

      if (error || !marker) {
        logger.error("[issue-marker] insert error:", error)
        return NextResponse.json({ error: "Failed to issue marker" }, { status: 500 })
      }

      // ── Sign with Ed25519 ────────────────────────────
      const signature = signTrustMarker({
        id: marker.id,
        profile_id: targetProfile.id,
        issuer_id: issuer?.id ?? userId,
        title: safeTitle,
        type: type || "achievement",
        created_at: marker.created_at,
      })

      if (signature) {
        await supabase
          .from("trust_markers")
          .update({ crypto_signature: signature })
          .eq("id", marker.id)
      }

      // Bust Redis cache for the recipient's profile
      await bustCache(`profile:bh_id:${targetProfile.bh_id}`);

      logger.info('Marker issued to known user', {
        recipient_email: normalizedEmail,
        marker_title: safeTitle,
        marker_type: type || 'achievement',
        issuer_id: userId,
        signed: !!signature,
      });

      // ── Discord notification ──────────────────────────────
      if (DISCORD_WEBHOOK_URL) {
        try {
          await fetch(DISCORD_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              embeds: [{
                title: "🏅 Trust Marker Issued",
                description: `**${safeTitle}**\nIssued to \`${normalizedEmail}\` (known user)`,
                color: 0x6744b4,
                fields: [
                  { name: "Type", value: type || "achievement", inline: true },
                  { name: "Marker ID", value: marker.id.slice(0, 8), inline: true },
                ],
                timestamp: new Date().toISOString(),
              }],
            }),
            signal: AbortSignal.timeout(5000),
          });
        } catch (err) {
          logger.warn("[issue-marker] Discord notification failed:", err);
        }
      }

      return NextResponse.json({
        ok: true,
        ghost: false,
        profile: targetProfile.auth0_user_id,
        signed: !!signature,
      })
    }

    // ── Ghost profile: create unclaimed marker with claim token ──
    const tokenBytes = new Uint8Array(32)
    crypto.getRandomValues(tokenBytes)
    const claimToken = Array.from(tokenBytes, (b) => b.toString(16).padStart(2, "0")).join("")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: marker, error: markerError } = await supabase
      .from("trust_markers")
      .insert({
        issuer_id: issuer?.id ?? userId,
        claimant_email: normalizedEmail,
        title: safeTitle,
        description: safeDescription,
        type: type || "achievement",
        is_claimed: false,
        claim_token: claimToken,
        claim_expires_at: expiresAt,
      }).select("id, created_at")
      .single()

    if (markerError || !marker) {
      logger.error("[issue-marker] ghost insert error:", markerError)
      return NextResponse.json({ error: "Failed to create ghost marker" }, { status: 500 })
    }

      // ── Sign ghost marker with Ed25519 ──────────────
      const signature = signTrustMarker({
        id: marker.id,
        profile_id: null,
        issuer_id: issuer?.id ?? userId,
        title: safeTitle,
        type: type || "achievement",
        created_at: marker.created_at,
      })

      if (signature) {
        await supabase
          .from("trust_markers")
          .update({ crypto_signature: signature })
          .eq("id", marker.id)
      }

      // Track the claim token
    await supabase.from("claim_tokens").insert({
      token: claimToken,
      email: normalizedEmail,
      trust_marker_id: marker.id,
      expires_at: expiresAt,
    })

    // Send email notification if Resend is configured
    if (process.env.RESEND_API_KEY) {
      const claimUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://butwalhacks.com"}/claim/${claimToken}`
      // Get issuer name for the email
      const { data: issuer } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("auth0_user_id", userId)
        .single()

      // ponytail: 10s timeout — background notification email. Generous window for Resend + HTML rendering.
      const res = await fetch("https://api.resend.com/emails", {
        signal: AbortSignal.timeout(10_000),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "notifications@mail.butwalhacks.com",
          to: [normalizedEmail],
          subject: `You've received a Trust Marker from Butwal Hacks`,
          html: ghostMarkerNotificationHtml(
            normalizedEmail,
            issuer?.full_name || "An organizer",
            safeTitle,
            safeDescription,
            claimUrl,
          ),
        }),
      })

      if (!res.ok) {
        logger.warn("[issue-marker] email send failed:", await res.text())
      }
    } else {
      logger.info("[issue-marker] no RESEND_API_KEY — skipped email for", normalizedEmail)
    }

    logger.info(`[issue-marker] Created ghost marker ${marker.id} for ${normalizedEmail}`)

    logger.info('Ghost marker issued', {
      marker_id: marker.id,
      recipient_email: normalizedEmail,
      marker_title: safeTitle,
      marker_type: type || 'achievement',
      issuer_id: userId,
      expires_at: expiresAt,
      signed: !!signature,
    });

    // ── Discord notification ──────────────────────────────
    if (DISCORD_WEBHOOK_URL) {
      try {
        await fetch(DISCORD_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            embeds: [{
              title: "👻 Ghost Marker Issued",
              description: `**${safeTitle}**\nIssued to \`${normalizedEmail}\` (unclaimed — claim link sent)`,
              color: 0x9B59B6,
              fields: [
                { name: "Type", value: type || "achievement", inline: true },
                { name: "Marker ID", value: marker.id.slice(0, 8), inline: true },
              ],
              timestamp: new Date().toISOString(),
            }],
          }),
          signal: AbortSignal.timeout(5000),
        });
      } catch (err) {
        logger.warn("[issue-marker] Discord notification failed:", err);
      }
    }

    return NextResponse.json({
      ok: true,
      ghost: true,
      marker_id: marker.id,
      expires_at: expiresAt,
      signed: !!signature,
    })
  } catch (err) {
    logger.error('Issue marker failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    logger.error("[issue-marker] unexpected error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}, "sensitive")
