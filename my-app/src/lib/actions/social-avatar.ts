'use server';

import dns from "dns/promises";
import { v2 as cloudinary } from "cloudinary";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";
import { logger } from "@/lib/logger";
import { isAllowedSocialAvatarUrl, isPublicAddress } from "@/lib/social-avatar";

/** Guard rails so a hostile or merely huge URL cannot exhaust the function. */
const MAX_BYTES = 5 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;

function configured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function ensureCloudinary() {
  if (!cloudinary.config().cloud_name) {
    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
      api_key: process.env.CLOUDINARY_API_KEY!,
      api_secret: process.env.CLOUDINARY_API_SECRET!,
      secure: true,
    });
  }
}

/**
 * Copy a social-login avatar into our Cloudinary account.
 *
 * Auth0's `picture` claim cannot be stored directly: Google's URLs are signed
 * and expire within hours, and LinkedIn's reject requests without a referer.
 * So the bytes are fetched once here and the returned Cloudinary URL is what we
 * persist. See lib/social-avatar.ts for why the incoming URL is treated as
 * hostile.
 *
 * @param pictureUrl - the `picture` claim from the Auth0 session
 * @returns the stored Cloudinary URL, or null when it could not be imported
 */
export async function importSocialAvatar(pictureUrl: string): Promise<string | null> {
  const session = await auth0.getSession();
  if (!session?.user?.sub) throw new Error("Unauthorized");

  if (!pictureUrl || !isAllowedSocialAvatarUrl(pictureUrl)) {
    throw new Error("That image source is not supported.");
  }
  if (!configured()) {
    logger.error("[social-avatar] Cloudinary is not configured");
    return null;
  }

  // SSRF guard: the host is allowlisted, but confirm the address it resolves
  // to is public so a rebound or hijacked DNS entry cannot reach the metadata
  // service or an internal network.
  const host = new URL(pictureUrl).hostname;
  let addresses: Array<{ address: string }>;
  try {
    addresses = await dns.lookup(host, { all: true });
  } catch {
    throw new Error("Could not reach that image source.");
  }
  if (addresses.length === 0 || addresses.some((a) => !isPublicAddress(a.address))) {
    logger.warn("[social-avatar] Refused a non-public address", { host });
    throw new Error("That image source is not allowed.");
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let bytes: Buffer;
  let contentType = "image/jpeg";
  try {
    const res = await fetch(pictureUrl, {
      signal: controller.signal,
      // Some providers (LinkedIn) reject requests with no referer.
      headers: { Accept: "image/*" },
      redirect: "error",
    });
    if (!res.ok) {
      throw new Error(`Image source returned ${res.status}.`);
    }
    // Provider photos are usually JPEG but can be PNG or WebP; Cloudinary
    // sniffs the data URI, so mislabelling them makes it guess wrong.
    const served = res.headers.get("content-type")?.split(";")[0].trim();
    if (served?.startsWith("image/")) contentType = served;
    const declared = Number(res.headers.get("content-length") ?? "0");
    if (declared && declared > MAX_BYTES) {
      throw new Error("That image is too large.");
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > MAX_BYTES) {
      throw new Error("That image is too large.");
    }
    bytes = buf;
  } catch (err) {
    logger.warn("[social-avatar] Fetch failed", {
      host,
      reason: err instanceof Error ? err.message : String(err),
    });
    throw new Error("Could not download that image.");
  } finally {
    clearTimeout(timer);
  }

  if (bytes.byteLength === 0) throw new Error("That image was empty.");

  ensureCloudinary();
  const uploaded = await cloudinary.uploader.upload(
    `data:${contentType};base64,${bytes.toString("base64")}`,
    {
      folder: "avatars/social",
      resource_type: "image",
      overwrite: false,
      // Avatars are square and cropped by the client dialog for manual
      // uploads; a social copy has no dialog, so normalise it here.
      transformation: [{ width: 512, height: 512, crop: "fill", gravity: "face" }],
      context: { alt: "Avatar imported from a social login" },
    }
  );

  const url = uploaded.secure_url ?? uploaded.url;
  if (!url) throw new Error("Cloudinary did not return a URL.");

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("auth0_user_id", session.user.sub);

  if (error) {
    logger.error("[social-avatar] Failed to persist the imported avatar", {
      auth0_user_id: session.user.sub,
    });
    throw new Error("Could not save the imported photo.");
  }

  logger.info("[social-avatar] Imported a social avatar", {
    auth0_user_id: session.user.sub,
    source: host,
  });
  return url;
}
