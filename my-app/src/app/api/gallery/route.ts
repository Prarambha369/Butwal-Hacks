import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { fetchGalleryPage } from "@/lib/public-reads/gallery";
import { withPublicCors } from "@/lib/cors";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limiter";

/**
 * GET /api/gallery?offset=N&event=Title
 *
 * One page of approved gallery media, for the grid's infinite scroll and
 * event filter (lib/gallery-client.ts). Public data, no session: the same
 * rows the gallery page renders. Any origin may read it, so the static
 * marketing site can call it cross-origin. fetchGalleryPage clamps the
 * offset and fixes the page size, so this cannot pull the whole table.
 */
const querySchema = z.object({
  offset: z.coerce.number().int().min(0).default(0),
  event: z.string().trim().min(1).max(200).optional(),
});

export const GET = withPublicCors(
  withRateLimit(async (request: NextRequest) => {
    const params = request.nextUrl.searchParams;
    const parsed = querySchema.safeParse({
      offset: params.get("offset") ?? undefined,
      event: params.get("event") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    try {
      const page = await fetchGalleryPage(parsed.data.offset, parsed.data.event);
      return NextResponse.json(page, {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
      });
    } catch (error) {
      logger.error("[api/gallery] page read failed", error);
      return NextResponse.json({ error: "Could not load the gallery" }, { status: 500 });
    }
  }, "bulk"),
);
