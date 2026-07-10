import { NextResponse } from "next/server"

/**
 * Open Badges 3.0 — Issuer Profile
 *
 * Serves Butwal Hacks as a verifiable badge issuer.
 * Referenced by every assertion as the `issuer` property.
 * Cache-friendly: static data, never changes.
 */
export async function GET() {
  const issuer = {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json",
    ],
    id: "https://butwalhacks.com/api/badges/issuer",
    type: ["Profile"],
    name: "Butwal Hacks",
    url: "https://butwalhacks.com",
    email: "hello@butwalhacks.com",
    description:
      "A nonprofit youth technology initiative in Butwal, Nepal, issuing verified achievement credentials for hackathons, workshops, and community contributions.",
    image: {
      id: "https://butwalhacks.com/logo.png",
      type: "Image",
    },
  }

  return NextResponse.json(issuer, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  })
}
