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
 * Outcome of a social-avatar import.
 *
 * `error` is safe to show a user: every string here is written for them.
 */
export type SocialAvatarResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

const fail = (error: string): SocialAvatarResult => ({ ok: false, error });

const TOO_SLOW = "That photo took too long to download. Try uploading one instead.";

/**
 * Copy a social-login avatar into our Cloudinary account.
 *
 * Auth0's `picture` claim cannot be stored directly: Google's URLs are signed
 * and expire within hours, and LinkedIn's reject requests without a referer.
 * So the bytes are fetched once here and the returned Cloudinary URL is what we
 * persist. See lib/social-avatar.ts for why the incoming URL is treated as
 * hostile.
 *
 * Expected failures are RETURNED, not thrown. Next.js redacts the message of an
 * error thrown across a Server Action boundary in production, so a thrown
 * "That image is too large." reaches the browser as an opaque digest and the
 * user is told nothing useful. Only a genuine auth failure throws, because that
 * is a bug rather than a condition to explain.
 *
 * @param pictureUrl - the `picture` claim from the Auth0 session
 */
export async function importSocialAvatar(pictureUrl: string): Promise<SocialAvatarResult> {
  const session = await auth0.getSession();
  if (!session?.user?.sub) throw new Error("Unauthorized");

  if (!pictureUrl || !isAllowedSocialAvatarUrl(pictureUrl)) {
    return fail("That image source is not supported.");
  }
  if (!configured()) {
    logger.error("[social-avatar] Cloudinary is not configured");
    return fail("Photo import is unavailable right now. Try uploading a photo instead.");
  }

  // SSRF guard: the host is allowlisted, but confirm the address it resolves
  // to is public so a rebound or hijacked DNS entry cannot reach the metadata
  // service or an internal network.
  const host = new URL(pictureUrl).hostname;
  let addresses: Array<{ address: string }>;
  try {
    addresses = await dns.lookup(host, { all: true });
  } catch {
    return fail("Could not reach that image source.");
  }
  if (addresses.length === 0 || addresses.some((a) => !isPublicAddress(a.address))) {
    logger.warn("[social-avatar] Refused a non-public address", { host });
    return fail("That image source is not allowed.");
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const timedOut = (err: unknown) =>
    controller.signal.aborted || (err instanceof Error && err.name === "AbortError");

  let bytes: Buffer;
  let contentType = "image/jpeg";
  // One try/finally owns the timer, so every early return below still clears
  // it. A pending timer keeps a serverless invocation alive past its work.
  try {
    let res: Response;
    try {
      res = await fetch(pictureUrl, {
        signal: controller.signal,
        // Some providers (LinkedIn) reject requests with no referer.
        headers: { Accept: "image/*" },
        redirect: "error",
      });
    } catch (err) {
      // A timeout is the common case here and deserves its own wording, rather
      // than being flattened into a generic download failure.
      if (timedOut(err)) return fail(TOO_SLOW);
      logger.warn("[social-avatar] Fetch failed", {
        host,
        reason: err instanceof Error ? err.message : String(err),
      });
      return fail("Could not download that photo.");
    }

    if (!res.ok) {
      logger.warn("[social-avatar] Image source returned an error", { host, status: res.status });
      return fail("That photo could not be downloaded. Try uploading one instead.");
    }

    // Provider photos are usually JPEG but can be PNG or WebP; Cloudinary
    // sniffs the data URI, so mislabelling them makes it guess wrong.
    const served = res.headers.get("content-type")?.split(";")[0].trim();
    if (served?.startsWith("image/")) contentType = served;
    const declared = Number(res.headers.get("content-length") ?? "0");
    if (declared && declared > MAX_BYTES) {
      return fail("That photo is too large. Try a smaller one.");
    }

    let buf: Buffer;
    try {
      buf = Buffer.from(await res.arrayBuffer());
    } catch (err) {
      // The timer can fire after the headers arrive, while the body is still
      // streaming. That is a timeout, not a corrupt download.
      if (timedOut(err)) return fail(TOO_SLOW);
      logger.error("[social-avatar] Could not read the downloaded image", {
        host,
        reason: err instanceof Error ? err.message : String(err),
      });
      return fail("Could not read that photo.");
    }
    if (buf.byteLength > MAX_BYTES) {
      return fail("That photo is too large. Try a smaller one.");
    }
    bytes = buf;
  } finally {
    clearTimeout(timer);
  }

  if (bytes.byteLength === 0) return fail("That photo was empty.");

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
  if (!url) return fail("Photo import did not complete. Try uploading one instead.");

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("auth0_user_id", session.user.sub);

  if (error) {
    logger.error("[social-avatar] Failed to persist the imported avatar", {
      auth0_user_id: session.user.sub,
    });
    return fail("Could not save that photo. Try uploading one instead.");
  }

  logger.info("[social-avatar] Imported a social avatar", {
    auth0_user_id: session.user.sub,
    source: host,
  });
  return { ok: true, url };
}
