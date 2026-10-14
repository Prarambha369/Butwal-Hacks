"use server";

import { logger } from "@/lib/logger"
import { createServiceClient } from "@/utils/supabase";
import { sanitizeString } from "@/lib/validation";
import { sendSlackEmail } from "@/lib/slack-email";

interface SubmitFeedbackInput {
  category: "bug" | "feature" | "improvement" | "other";
  message: string;
  auth0_id?: string;
}

// ponytail: simple in-memory rate limit — resets on server restart.
// Fine for an MVP; replace with Upstash Redis for scale (Phase 2).
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

// Test-only: clear the rate limit map (must be async for server action)
export async function __clearRateLimitMap(): Promise<void> {
  rateLimitMap.clear();
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

// Retry configuration for DB operations
const DB_RETRY_MAX = 3;
const DB_RETRY_BASE_DELAY_MS = 200;

async function withRetry<T>(fn: () => Promise<T>, retries = DB_RETRY_MAX): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    const delay = DB_RETRY_BASE_DELAY_MS * (DB_RETRY_MAX - retries + 1);
    await new Promise((r) => setTimeout(r, delay));
    return withRetry(fn, retries - 1);
  }
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production";
}

export async function submitFeedback(input: SubmitFeedbackInput) {
  try {
    const message = sanitizeString(input.message, 2000);
    if (message.length < 3) {
      return { success: false, error: "Message must be at least 3 characters." };
    }

    // Rate limit by IP (via auth0_id if available, otherwise IP is handled by Supabase RLS)
    // ponytail: use auth0_id as rate limit key for authenticated users,
    // anonymous users share a global counter (coarse but prevents spam)
    const rateLimitKey = input.auth0_id || "anonymous";
    if (!checkRateLimit(rateLimitKey)) {
      return {
        success: false,
        error: "Too many requests. Please wait a minute before sending more feedback.",
      };
    }

    const supabase = createServiceClient();
    let dbError: unknown = null;

    try {
      await withRetry(async () => {
        const { error } = await supabase
          .from("feedback")
          .insert({
            category: input.category,
            message,
            // ponytail: store auth0_id if provided for user attribution
            ...(input.auth0_id ? { auth0_user_id: input.auth0_id } : {}),
          });
        if (error) throw error;
      });
    } catch (error) {
      dbError = error;
      logger.error("[feedback] DB insert failed after retries, falling back to Slack mirror:", error);
    }

    // Slack mirror runs regardless of the DB outcome: the channel email
    // auto-posts whatever lands there (e.g. #feedback-from-site), so the
    // team still receives the message when the database is unreachable.
    // A failed email never fails the submission.
    // Only send to Slack in production to avoid polluting the channel with dev noise.
    let mirrored = false;
    if (isProduction()) {
      mirrored = await sendSlackEmail({
        from: "feedback@mail.butwalhacks.com",
        subject: `Feedback [${input.category}] on Butwal Hacks`,
        text: [
          "NEW SITE FEEDBACK",
          `Category:  ${input.category}`,
          `From:      ${input.auth0_id ?? "anonymous"}`,
          `Time:      ${new Date().toISOString()}`,
          `Stored:    ${dbError ? "no (db unreachable)" : "yes"}`,
          "",
          message,
        ].join("\n"),
      });
    }

    if (dbError && !mirrored) throw dbError;

    return { success: true };
  } catch (error) {
    logger.error("[feedback] Error submitting feedback:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit feedback.",
    };
  }
}
