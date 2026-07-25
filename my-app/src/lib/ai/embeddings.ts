/**
 * AI Embedding Service — generates vector embeddings and searches content
 * via Supabase pgvector for RAG (Retrieval-Augmented Generation).
 *
 * Embeddings are generated via Hugging Face's Inference API using
 * sentence-transformers/all-MiniLM-L6-v2 (384 dimensions).
 * HF_API_TOKEN is required (free from https://huggingface.co/settings/tokens).
 *
 * ── Architecture ────────────────────────────────────────────────────
 * User Question → embed() → vector query → match_knowledge() → top chunks
 *   → inject as context → LLM generates answer
 *
 * The seed script (scripts/seed-embeddings.ts) populates the
 * knowledge_embeddings table from src/lib/content.ts.
 */

import { createServiceClient } from "@/utils/supabase";

const HF_ROUTER_URL =
  "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2";

const HF_FALLBACK_URL =
  "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2";

const EMBED_TIMEOUT_MS = 10_000;
const DEFAULT_MATCH_COUNT = 5;
const DEFAULT_MATCH_THRESHOLD = 0.5;

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

// ─── Embedding Generation ──────────────────────────────────────────

/**
 * Generate a 384-dimensional embedding vector for the given text.
 * Uses the Hugging Face Inference API.
 *
 * Tries the router endpoint first. On any failure (network error or
 * non-ok status), falls back to the direct api-inference endpoint.
 * Only throws after both attempts fail.
 *
 * Requires HF_API_TOKEN env var (free from https://huggingface.co/settings/tokens).
 *
 * Handles:
 * - Cold-start model loading (via wait_for_model option)
 * - Timeout via AbortSignal
 * - Router → fallback chain
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const token = process.env.HF_API_TOKEN;
  if (!token) {
    throw new Error(
      "HF_API_TOKEN not configured. Set HF_API_TOKEN in your .env.local file. Get a free token at https://huggingface.co/settings/tokens"
    );
  }

  const urls = [HF_ROUTER_URL, HF_FALLBACK_URL];
  let lastError: Error | null = null;

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(EMBED_TIMEOUT_MS),
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: text,
          options: { wait_for_model: true },
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(
          `Hugging Face API error ${res.status}: ${body.slice(0, 200)}`
        );
      }

      const result = await res.json();

      // The API returns [[float, float, ...]] — a nested array with one row
      if (!Array.isArray(result) || result.length === 0 || !Array.isArray(result[0])) {
        throw new Error("Unexpected embedding response format");
      }

      return result[0] as number[];
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const attemptLabel = url === HF_ROUTER_URL ? "router, trying fallback" : "fallback, giving up";
      console.warn(`[embedding] ${attemptLabel}: ${lastError.message}`);
    }
  }

  // Both attempts failed
  throw lastError ?? new Error("Embedding generation failed: all endpoints unreachable");
}

// ─── Content Search ────────────────────────────────────────────────

/**
 * Search the knowledge base for content similar to the query text.
 * Returns up to `limit` results sorted by cosine similarity.
 */
export async function searchContent(
  query: string,
  options?: {
    limit?: number;
    threshold?: number;
  }
): Promise<SearchMatch[]> {
  const limit = options?.limit ?? DEFAULT_MATCH_COUNT;
  const threshold = options?.threshold ?? DEFAULT_MATCH_THRESHOLD;

  const embedding = await generateEmbedding(query);
  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc("match_knowledge", {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: limit,
  });

  if (error) {
    throw new Error(`Vector search failed: ${error.message}`);
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    content: row.content as string,
    metadata: row.metadata as Record<string, unknown>,
    similarity: row.similarity as number,
  }));
}

// ─── Content Seeding ───────────────────────────────────────────────

/**
 * Seed content items into the knowledge_embeddings table.
 * Generates embeddings for each item and upserts them.
 *
 * Dedup logic (by priority):
 *   1. Look up existing row by (slug, type).
 *   2. If found AND content_hash matches → skip (content unchanged).
 *   3. If found AND content_hash differs  → update embedding (content modified).
 *   4. If not found → insert new row.
 *
 * This ensures modified content (e.g. an updated initiative description)
 * gets re-embedded even though slug+type haven't changed.
 */
export async function seedEmbeddings(items: ContentItem[]): Promise<{
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
}> {
  const supabase = createServiceClient();
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of items) {
    try {
      // Look up existing row by (slug, type)
      const { data: existing } = await supabase
        .from("knowledge_embeddings")
        .select("id, content_hash")
        .eq("metadata->>slug", item.metadata.slug)
        .eq("metadata->>type", item.metadata.type)
        .maybeSingle();

      if (existing) {
        // If content hash matches, skip entirely
        if (existing.content_hash === item.contentHash) {
          skipped++;
          continue;
        }

        // Content changed — regenerate embedding and update
        const embedding = await generateEmbedding(item.content);
        const { error } = await supabase
          .from("knowledge_embeddings")
          .update({
            content: item.content,
            content_hash: item.contentHash,
            metadata: item.metadata,
            embedding,
          })
          .eq("id", existing.id);

        if (error) {
          console.error(`[seed] Failed to update ${item.metadata.type}/${item.metadata.slug}:`, error.message);
          failed++;
        } else {
          updated++;
        }
        continue;
      }

      // New item — insert
      const embedding = await generateEmbedding(item.content);
      const { error } = await supabase.from("knowledge_embeddings").insert({
        content: item.content,
        content_hash: item.contentHash,
        metadata: item.metadata,
        embedding,
      });

      if (error) {
        console.error(`[seed] Failed to insert ${item.metadata.type}/${item.metadata.slug}:`, error.message);
        failed++;
      } else {
        inserted++;
      }
    } catch (err) {
      console.error(
        `[seed] Error processing ${item.metadata.type}/${item.metadata.slug}:`,
        err instanceof Error ? err.message : String(err)
      );
      failed++;
    }
  }

  return { inserted, updated, skipped, failed };
}
