import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limiter";
import crypto from "crypto";

/**
 * API key management for Butwal Hacks developers.
 *
 * GET  /api/v1/api-keys  — list all keys for the authenticated user
 * POST /api/v1/api-keys  — create a new API key
 * DELETE /api/v1/api-keys — revoke an API key
 */

const KEY_PREFIX = "bh_";

function generateApiKey(): string {
  const raw = crypto.randomBytes(32).toString("hex");
  return `${KEY_PREFIX}${raw}`;
}

function prefixFromKey(key: string): string {
  return key.length > 8 ? `${key.slice(0, 8)}...` : key;
}

// ─── GET: List keys ────────────────────────────────────────────
export async function GET() {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth0_user_id", session.user.sub)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { data: keys, error } = await supabase
      .from("api_keys")
      .select("id, prefix, name, created_at, last_used_at, is_active")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ keys: keys ?? [] }, {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  } catch (err) {
    logger.error("[api-keys] GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// ─── POST: Create key ──────────────────────────────────────────
export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json() as { name?: string };

    if (!name || typeof name !== "string" || name.trim().length < 1) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (name.length > 64) {
      return NextResponse.json({ error: "Name too long (max 64 chars)" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth0_user_id", session.user.sub)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check key limit (max 5 per user)
    const { count } = await supabase
      .from("api_keys")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", profile.id)
      .eq("is_active", true);

    if (count && count >= 5) {
      return NextResponse.json(
        { error: "Maximum 5 active API keys allowed. Revoke an existing key first." },
        { status: 429 },
      );
    }

    const rawKey = generateApiKey();
    const hashedKey = crypto.createHash("sha256").update(rawKey).digest("hex");

    const { error } = await supabase.from("api_keys").insert({
      profile_id: profile.id,
      name: name.trim(),
      key_hash: hashedKey,
      prefix: prefixFromKey(rawKey),
      is_active: true,
    });

    if (error) throw error;

    logger.info(`[api-keys] Created new key for profile ${profile.id}`);

    return NextResponse.json({ key: rawKey, name: name.trim() });
  } catch (err) {
    logger.error("[api-keys] POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}, "user_action");

// ─── DELETE: Revoke key ─────────────────────────────────────────
export const DELETE = withRateLimit(async (req: NextRequest) => {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json() as { id?: string };

    if (!id) {
      return NextResponse.json({ error: "Key ID is required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth0_user_id", session.user.sub)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Ensure the key belongs to the current user
    const { error } = await supabase
      .from("api_keys")
      .update({ is_active: false })
      .eq("id", id)
      .eq("profile_id", profile.id);

    if (error) {
      logger.error("[api-keys] DELETE error:", error);
      return NextResponse.json({ error: "Failed to revoke key" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("[api-keys] DELETE error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}, "user_action");
