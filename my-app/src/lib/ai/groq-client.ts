/**
 * Groq AI Client — shared utility for making Groq API calls.
 *
 * Consolidates API key validation, request construction, error handling,
 * response parsing, and retry logic so individual route handlers don't
 * duplicate this code.
 *
 * Retry policy (exponential backoff with jitter):
 *   - Max 3 retries on transient failures (5xx, 429 rate limits, network errors)
 *   - No retry on 4xx client errors (400, 401, 422, etc.)
 *   - Backoff: 1s, 2s, 4s with +-25% jitter
 *   - Total retry budget capped at 80% of caller's timeout
 */

const GROQ_API_BASE = "https://api.groq.com/openai/v1/chat/completions";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqOptions {
  model?: string;
  messages: GroqMessage[];
  maxTokens?: number;
  temperature?: number;
  /** Per-call timeout (not total). default 15s. */
  timeout?: number;
}

export interface GroqResult {
  content: string;
  model: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

/**
 * Exponential backoff with +-25% jitter.
 * Returns milliseconds to wait before the next retry.
 */
function backoffMs(attempt: number): number {
  const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1); // 1s, 2s, 4s
  const jitter = delay * 0.25; // +-25%
  return Math.round(delay - jitter + Math.random() * jitter * 2);
}

/**
 * Returns true for HTTP status codes that are safe to retry.
 */
function isRetryableStatus(status: number): boolean {
  if (status >= 500) return true;  // Server errors
  if (status === 429) return true; // Rate limited
  return false;
}

/**
 * Returns true for fetch errors that are safe to retry (network blips).
 */
function isRetryableError(err: unknown): boolean {
  // fetch throws TypeError for network failures, DNS issues
  if (err instanceof TypeError) return true;
  // DOMException covers AbortError (manual abort) and TimeoutError (AbortSignal.timeout)
  if (err instanceof DOMException) return true;
  return false;
}

/**
 * Call Groq's chat completions API with automatic retry.
 * Throws if GROQ_API_KEY is not configured or the API returns an unrecoverable error.
 */
export async function callGroq(options: GroqOptions): Promise<GroqResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured. Set it in your .env.local file.");
  }

  const perCallTimeout = options.timeout ?? 15_000;
  // Keep 20% of the timeout as buffer for retry logic overhead
  const retryBudgetMs = Math.floor(perCallTimeout * 0.8);
  const deadline = Date.now() + retryBudgetMs;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    // Check deadline before each attempt
    if (Date.now() >= deadline) {
      break;
    }

    // Shrink per-call timeout as we approach the deadline
    const remaining = deadline - Date.now();
    const callTimeout = Math.min(perCallTimeout, Math.max(1_000, remaining));

    try {
      const res = await fetch(GROQ_API_BASE, {
        signal: AbortSignal.timeout(callTimeout),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: options.model ?? "llama-3.3-70b-versatile",
          messages: options.messages,
          max_tokens: options.maxTokens ?? 500,
          temperature: options.temperature ?? 0.7,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const content: string = json.choices?.[0]?.message?.content?.trim() ?? "";

        if (!content) {
          throw new Error("Empty response from Groq");
        }

        return {
          content,
          model: json.model ?? options.model ?? "unknown",
          usage: json.usage ?? undefined,
        };
      }

      // Non-ok response — check if retryable
      if (isRetryableStatus(res.status) && attempt <= MAX_RETRIES) {
        const errorText = await res.text();
        lastError = new Error(`Groq API returned ${res.status}: ${errorText.slice(0, 200)}`);

        const waitMs = backoffMs(attempt);
        if (Date.now() + waitMs < deadline) {
          await sleep(waitMs);
          continue;
        }
        break;
      }

      // Non-retryable status — fail immediately
      const errorText = await res.text();
      throw new Error(`Groq API returned ${res.status}: ${errorText.slice(0, 200)}`);

    } catch (err) {
      // Network / timeout errors are retryable
      if (isRetryableError(err) && attempt <= MAX_RETRIES) {
        lastError = err instanceof Error ? err : new Error(String(err));

        const waitMs = backoffMs(attempt);
        if (Date.now() + waitMs < deadline) {
          await sleep(waitMs);
          continue;
        }
        break;
      }

      // Non-retryable fetch error — rethrow
      throw err;
    }
  }

  // All retries exhausted
  throw lastError ?? new Error("Groq API request failed after retries");
}

/** Promise-based sleep helper. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
