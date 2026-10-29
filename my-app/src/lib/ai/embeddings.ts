/**
 * AI Embedding Service — Gemini-backed vector retrieval for MrBallu.
 *
 * Groq (the chat provider) has no embedding endpoint, so retrieval needed a
 * second provider. Gemini's free tier covers embeddings with no card required,
 * which is why it was chosen. Vectors are 768-dim to match
 * `knowledge_embeddings.embedding VECTOR(768)`.
 *
 * Invariants worth keeping:
 * - `isRagEnabled()` is a config check, not a hardcoded false. It flips to true
 *   the moment a Gemini key exists, so environments without one keep the old
 *   behaviour (no retrieval) instead of erroring on every message.
 * - Every failure path is explicit. A retrieval error must never take the chat
 *   route down — callers catch and fall through to a no-context answer, which
 *   is why this module throws rather than returning an empty array (an empty
 *   array reads as "the knowledge base genuinely has nothing", which is a
 *   different, and misleading, signal).
 */

import { embedText } from "./gemini-embeddings";
import { createServiceClient } from "@/utils/supabase";
import { sanitizeContextChunk } from "./chat-guardrails";

/** Reported to callers when no Gemini key is configured. */
export const RAG_DISABLED_MESSAGE =
  "Vector search is disabled (no Gemini embedding key configured — set GEMINI_API_KEY)";

/** Feature flag: vector search is on iff an embedding key is present. */
export function isRagEnabled(): boolean {
  return Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
}

export interface SearchMatch {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

export interface ContentItem {
  content: string;
  contentHash: string; // SHA-256 of content — detects modifications for re-embedding
  metadata: {
    type: "initiative" | "event" | "blog" | "program" | "chapter" | "community";
    slug: string;
    title: string;
    tags: string[];
    source: string;
  };
}

// ─── Content Search ────────────────────────────────────────────────────

/**
 * Retrieve the chunks most similar to a query.
 *
 * `threshold` floors the cosine similarity so an unrelated question returns
 * nothing rather than a confidently-wrong nearest neighbour. Below ~0.35 a
 * 768-dim text embedding is essentially noise, so the default is set there
 * rather than at zero.
 */
export async function searchContent(
  query: string,
  options?: { limit?: number; threshold?: number },
): Promise<SearchMatch[]> {
  if (!isRagEnabled()) throw new Error(RAG_DISABLED_MESSAGE);

  const limit = Math.min(options?.limit ?? 4, 8);
  const threshold = options?.threshold ?? 0.35;

  const queryEmbedding = await embedText(query);

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("match_knowledge", {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
  });

  if (error) {
    throw new Error(`match_knowledge failed: ${error.message}`);
  }

  return (data ?? []).map((row: {
    id: string;
    content: string;
    metadata: Record<string, unknown>;
    similarity: number;
  }) => ({
    id: row.id,
    // Sanitised here rather than at the call site: every consumer wants the
    // same protection, and one that forgets is a prompt-injection hole.
    content: sanitizeContextChunk(row.content),
    metadata: row.metadata ?? {},
    similarity: Number(row.similarity),
  }));
}
