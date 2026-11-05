import crypto from "crypto";

/** Replay-protection window for the webhook signature timestamp. */
export const WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS = 300;

export interface WebhookSignatureInput {
  /** Raw, unparsed request body — the HMAC covers these exact bytes. */
  rawBody: string;
  /** Hex-encoded HMAC-SHA256 digest from the `x-webhook-signature` header. */
  signature: string | null;
  /** Unix seconds from the `x-webhook-timestamp` header. */
  timestamp: string | null;
  /** Shared secret (the same AUTH0_WEBHOOK_SECRET used by the Action). */
  secret: string;
}

/**
 * Compute the expected HMAC for a raw body. Exported so the Auth0 Action and
 * the verification route can agree on the exact construction; do not reuse
 * this for anything other than a fixed shared-secret transport.
 */
export function signatureFor(timestamp: string, rawBody: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

/**
 * Verify an incoming webhook call, failing closed on any of:
 * - missing/malformed signature or timestamp
 * - a timestamp more than WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS from now (replay)
 * - a digest mismatch (constant-time comparison)
 */
export function verifyWebhookSignature({ rawBody, signature, timestamp, secret }: WebhookSignatureInput): boolean {
  if (!secret || !signature || !timestamp) return false;
  if (!/^\d+$/.test(timestamp)) return false;

  const issued = Number(timestamp);
  if (!Number.isFinite(issued) || issued <= 0) return false;
  const skew = Math.abs(Math.floor(Date.now() / 1000) - issued);
  if (skew > WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS) return false;

  if (!/^[0-9a-f]{64}$/i.test(signature)) return false;
  const expected = signatureFor(timestamp, rawBody, secret);
  const expectedBuf = Buffer.from(expected, "utf8");
  const receivedBuf = Buffer.from(signature.toLowerCase(), "utf8");
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}
