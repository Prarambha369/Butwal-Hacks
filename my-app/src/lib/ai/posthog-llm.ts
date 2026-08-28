/**
 * LLM observability — captures Groq API calls for monitoring.
 *
 * ponytail: server-safe — no browser-only posthog-js.
 * Logs to console; posthog-provider.tsx handles client-side capture.
 */

export interface LLMCallEvent {
  model: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  success: boolean;
  error?: string;
  feature: string; // "bh-bot" | "pitch-generator" | "certificate-ocr" | "team-matching"
}

/** Log an LLM call. Server-safe, no external SDKs. */
export function captureLLMCall(event: LLMCallEvent) {
  if (process.env.NODE_ENV === "development") {
    console.info("[llm]", JSON.stringify(event));
  }
}
