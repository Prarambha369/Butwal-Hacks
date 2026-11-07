/**
 * Cloudinary structured metadata encoding for signed uploads.
 *
 * The upload API does not accept JSON for `metadata`. It takes a
 * `external_id=value|external_id=value` string, and `=` and `|` inside a value
 * must be backslash-escaped — the same encoding the Node SDK applies to the
 * `metadata` upload option (`encode_context` in `cloudinary/lib/utils`).
 *
 * This is not cosmetic. Sending `JSON.stringify(metadata)` instead splits the
 * payload at every `|`, so an Auth0 `sub` such as `auth0|<hex>` cut the string
 * in half and Cloudinary answered "Metadata External IDs do not exist" for the
 * two fragments, failing every avatar upload. Pinned by
 * `__tests__/cloudinary-metadata.test.ts`.
 */
export function encodeCloudinaryMetadata(entries: Record<string, string>): string {
  return Object.entries(entries)
    .map(([externalId, value]) => `${externalId}=${escapeMetadataValue(value)}`)
    .join("|")
}

/**
 * Keep only the entries Cloudinary will accept.
 *
 * A field that is not defined in the product environment makes the upload API
 * reject the whole asset, so unknown external IDs are dropped before signing.
 * Metadata is attribution; an asset must never fail to upload over it.
 */
export function pickDefinedMetadata(
  entries: Record<string, string>,
  definedIds: ReadonlySet<string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(entries).filter(([externalId]) => definedIds.has(externalId)),
  )
}

function escapeMetadataValue(value: string): string {
  return value.replace(/([=|])/g, "\\$1")
}
