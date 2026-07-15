import { createSign, createVerify } from "crypto"
import { logger } from "@/lib/logger"

/**
 * Ed25519 signing & verification for Trust Markers.
 *
 * Uses Node.js built-in crypto (no external deps).
 * Keys are PEM-encoded Ed25519 keys stored as env vars:
 *   TRUST_MARKER_PRIVATE_KEY — PKCS#8 PEM (line breaks as \n)
 *   TRUST_MARKER_PUBLIC_KEY  — SPKI PEM  (line breaks as \n)
 *
 * Generate with:
 *   node -e "
 *     const { generateKeyPairSync } = require('crypto');
 *     const { privateKey, publicKey } = generateKeyPairSync('ed25519', {
 *       privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
 *       publicKeyEncoding:  { type: 'spki', format: 'pem' }
 *     });
 *     console.log('TRUST_MARKER_PRIVATE_KEY=' + privateKey.replace(/\\n/g, '\\\\n'));
 *     console.log('TRUST_MARKER_PUBLIC_KEY=' + publicKey.replace(/\\n/g, '\\\\n'));
 *   "
 */

/**
 * Build a canonical signing payload from marker fields.
 * This deterministic string lets anyone verify the signature independently.
 */
export function markerSigningPayload(marker: {
  id: string
  profile_id?: string | null
  issuer_id: string
  title: string
  type: string
  created_at: string
}): string {
  return [
    marker.id,
    marker.profile_id ?? "",
    marker.issuer_id,
    marker.title,
    marker.type,
    marker.created_at,
  ].join("|")
}

/**
 * Sign a trust marker payload using the Ed25519 private key.
 * Returns a base64-encoded signature.
 *
 * Gracefully returns null if no private key is configured (no crash).
 */
export function signPayload(payload: string): string | null {
  const privateKey = process.env.TRUST_MARKER_PRIVATE_KEY
  if (!privateKey) {
    logger.warn("[crypto] TRUST_MARKER_PRIVATE_KEY not set — skipping signature")
    return null
  }

  try {
    const sign = createSign("ed25519")
    sign.update(payload, "utf-8")
    return sign.sign(privateKey, "base64")
  } catch (error) {
    logger.error("[crypto] signing failed:", error)
    return null
  }
}

/**
 * Verify a trust marker signature against the public key.
 * Returns true if the signature is valid, false otherwise.
 */
export function verifySignature(payload: string, signature: string): boolean {
  const publicKey = process.env.TRUST_MARKER_PUBLIC_KEY
  if (!publicKey) {
    logger.warn("[crypto] TRUST_MARKER_PUBLIC_KEY not set — skipping verification")
    return false
  }

  try {
    const verify = createVerify("ed25519")
    verify.update(payload, "utf-8")
    return verify.verify(publicKey, signature, "base64")
  } catch (error) {
    logger.error("[crypto] verification failed:", error)
    return false
  }
}

/**
 * Concisely sign a marker (convenience wrapper).
 *
 * Builds the signing payload from the marker record, signs it,
 * and returns the signature. Returns null on failure or missing key.
 */
export function signTrustMarker(marker: {
  id: string
  profile_id?: string | null
  issuer_id: string
  title: string
  type: string
  created_at: string
}): string | null {
  const payload = markerSigningPayload(marker)
  return signPayload(payload)
}
