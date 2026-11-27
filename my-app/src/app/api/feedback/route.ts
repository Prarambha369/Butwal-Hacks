import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { submitFeedback } from "@/lib/actions/feedback";
import { auth0 } from "@/lib/auth0";
import { corsPreflight, withCors } from "@/lib/cors";
import { logger } from "@/lib/logger";
import { withRateLimit } from "@/lib/rate-limiter";

/**
 * POST /api/feedback — the "send us a message" box in the assistant panel.
 *
 * A route rather than a server action so the static marketing site can post
 * it cross-origin (lib/cors.ts). Anonymous feedback is allowed, as it always
 * was; when a session is present its user is recorded. The user id comes from
 * the session, never from the request body.
 */
const bodySchema = z.object({
  category: z.enum(["bug", "feature", "improvement", "other"]),
  message: z.string().trim().min(3).max(2000),
});

export const OPTIONS = corsPreflight;

export const POST = withCors(
  withRateLimit(async (request: NextRequest) => {
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Message must be 3 to 2000 characters." }, { status: 400 });
    }
    try {
      const session = await auth0.getSession().catch(() => null);
      const result = await submitFeedback({
        ...parsed.data,
        ...(session?.user?.sub ? { auth0_id: session.user.sub } : {}),
      });
      if (!result.success) {
        return NextResponse.json({ error: result.error ?? "Failed to send." }, { status: 400 });
      }
      return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
      logger.error("[api/feedback] submit failed", error);
      return NextResponse.json({ error: "Failed to send." }, { status: 500 });
    }
  }, "public_form"),
);
