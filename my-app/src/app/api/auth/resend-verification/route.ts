import { NextResponse, type NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";
import { sendVerificationEmail } from "@/lib/auth0-management";
import { withRateLimit } from "@/lib/rate-limiter";
import { logger } from "@/lib/logger";

/**
 * POST /api/auth/resend-verification
 *
 * Resends the Auth0 email-verification link to the signed-in user.
 * Rate-limited (sensitive tier) so the button can't be used to spam inboxes.
 */
export const POST = withRateLimit(async (_request: NextRequest) => {
  try {
    const session = await auth0.getSession();
    if (!session?.user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.email_verified === true) {
      return NextResponse.json({ alreadyVerified: true });
    }

    await sendVerificationEmail(session.user.sub);
    return NextResponse.json({ sent: true });
  } catch (err) {
    logger.error("[resend-verification] Failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Could not resend the verification email. Please try again later." },
      { status: 500 }
    );
  }
}, "sensitive");
