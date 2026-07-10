import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

/**
 * Open Badges 3.0 — Badge Assertion
 *
 * Returns a verifiable credential for a specific trust_marker.
 * URL format: https://butwalhacks.com/api/badges/assertions/{markerId}
 *
 * This endpoint is referenced as the `id` in the OB3 JSON-LD and
 * can be imported into LinkedIn, Mozilla Backpack, or any OB3 wallet.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ markerId: string }> },
) {
  const { markerId } = await params
  const supabase = await createClient()

  const { data: marker, error } = await supabase
    .from("trust_markers")
    .select("*, profiles!trust_markers_profile_id_fkey(full_name, bh_id)")
    .eq("id", markerId)
    .single()

  if (error || !marker) {
    return NextResponse.json(
      { error: "Trust marker not found" },
      { status: 404, headers: { "Access-Control-Allow-Origin": "*" } },
    )
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://butwalhacks.com"

  const assertion = {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
    ],
    id: `${siteUrl}/api/badges/assertions/${marker.id}`,
    type: ["VerifiableCredential", "OpenBadgeCredential"],
    issuer: {
      id: `${siteUrl}/api/badges/issuer`,
      type: ["Profile"],
      name: "Butwal Hacks",
      url: siteUrl,
    },
    credentialSubject: {
      id: `${siteUrl}/p/${marker.profiles?.bh_id ?? ""}`,
      type: ["AchievementSubject"],
      name: marker.profiles?.full_name ?? "Unknown",
      achievement: {
        id: `${siteUrl}/api/badges/achievements/${marker.type}`,
        type: ["Achievement"],
        name: marker.title,
        description: marker.description ?? "",
        criteria: {
          narrative:
            marker.type === "verification"
              ? "Verified by a Butwal Hacks organizer based on demonstrated skills and community contributions."
              : marker.type === "participation"
                ? "Awarded for active participation in a Butwal Hacks event."
                : marker.type === "special_recognition"
                  ? "Special recognition from Butwal Hacks organizers for outstanding contribution."
                  : "Earned through verified activity within the Butwal Hacks community.",
        },
      },
    },
    validFrom: marker.created_at,
    ...(marker.is_revoked
      ? {
          validUntil: marker.revocation_reason
            ? new Date().toISOString()
            : undefined,
          credentialStatus: {
            id: `${siteUrl}/api/badges/revocation/${marker.id}`,
            type: "RevocationList2021Status",
          },
        }
      : {}),
    credentialSchema: {
      id: "https://purl.imsglobal.org/spec/ob/v3p0/schema/json/ob.json",
      type: "JsonSchema",
    },
  }

  return NextResponse.json(assertion, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/ld+json",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
