/**
 * PostHog LLM observability — captures Groq API calls for monitoring.
 *
 * ponytail: thin wrapper around posthog.capture() for LLM-specific events.
 * No extra deps — uses the existing posthog-js client.
 */

import posthog from "posthog-js";

export interface LLMCallEvent {
  model: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  success: boolean;
  error?: string;
  feature: string; // "bh-bot" | "pitch-generator" | "certificate-ocr" | "team-matching"
}

/** Capture an LLM call for PostHog AI observability. */
export function captureLLMCall(event: LLMCallEvent) {
  if (!posthog.__loaded) return;

  posthog.capture("llm_call", {
    $set_once: { ai_model: event.model },
    model: event.model,
    input_tokens: event.input_tokens,
    output_tokens: event.output_tokens,
    total_tokens: event.input_tokens + event.output_tokens,
    latency_ms: event.latency_ms,
    success: event.success,
    error: event.error,
    feature: event.feature,
    // PostHog AI observability uses these properties
    $llm_model: event.model,
    $llm_input_tokens: event.input_tokens,
    $llm_output_tokens: event.output_tokens,
    $llm_latency_ms: event.latency_ms,
    $llm_success: event.success,
  });
}
