import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { submitTestimonial } from "@/lib/actions/events";
import { auth0 } from "@/lib/auth0";
import { corsPreflight, withCors } from "@/lib/cors";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limiter";

/**
 * POST /api/testimonials — a signed-in member's testimonial from /explore.
 *
 * A route rather than a server action so the static marketing site can post
 * it cross-origin with the shared session cookie (lib/cors.ts). It lands as
 * `pending` and stays invisible until a maintainer approves it.
 */
const bodySchema = z.object({
  quote: z.string().trim().min(10).max(2000),
  rating: z.number().int().min(1).max(5).nullable().optional(),
});

export const OPTIONS = corsPreflight;

export const POST = withCors(
  withRateLimit(async (request: NextRequest) => {
    const session = await auth0.getSession().catch(() => null);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please write 10 to 2000 characters, with a rating from 1 to 5." },
        { status: 400 },
      );
    }
    try {
      const result = await submitTestimonial(parsed.data);
      if (!result.success) {
        return NextResponse.json({ error: "Could not save your testimonial." }, { status: 400 });
      }
      return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
      logger.error("[api/testimonials] submit failed", error);
      return NextResponse.json({ error: "Could not save your testimonial." }, { status: 500 });
    }
  }),
);
