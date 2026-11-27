import { NextResponse } from "next/server";
import { withPublicCors } from "@/lib/cors";
import { getPublicSiteContent } from "@/lib/public-reads/site-content";

/**
 * GET /api/site-content
 *
 * The public, maintainer-editable homepage strings (lib/site-content-keys.ts),
 * read once per page load by components/site-content.tsx. Public by design:
 * the same strings anyone sees on the homepage, limited to EDITABLE_KEYS.
 *
 * The request is never inspected, so the route is cached (ISR) and costs no
 * function time per visit; any origin may read it, so the static marketing
 * site can call it cross-origin. setSiteContent revalidates "/", and the
 * 5-minute window bounds how long an edit takes to show here.
 */
export const revalidate = 300;

export const GET = withPublicCors(async () => NextResponse.json(await getPublicSiteContent()));
