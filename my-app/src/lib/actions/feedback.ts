"use server";

import { logger } from "@/lib/logger"
import { createServiceClient } from "@/utils/supabase";
import { sanitizeString } from "@/lib/validation";

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
    const { error } = await supabase
      .from("feedback")
      .insert({
        category: input.category,
        message,
        // ponytail: store auth0_id if provided for user attribution
        ...(input.auth0_id ? { auth0_user_id: input.auth0_id } : {}),
      });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    logger.error("[feedback] Error submitting feedback:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit feedback.",
    };
  }
}
