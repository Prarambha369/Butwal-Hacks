/**
 * AI Embedding Service — currently DISABLED (Groq-only mode).
 *
 * The stack's only AI provider is Groq, which offers chat completions but
 * no embedding endpoint — so there is no way to generate vectors. The RAG
 * path (pgvector + match_knowledge) is preserved in schema and code for a
 * future provider, but every entry point below fails fast with a clear
 * message instead of calling a dead third party.
 *
 * Chat impact: none. The BH Bot checks isRagEnabled() and goes straight
 * to its base prompt. Previously this burned a 10s HF timeout per message.
 *
 * To re-enable RAG: plug an embedding provider into generateEmbedding()
 * (must return 384-dim vectors to match knowledge_embeddings) and flip
 * isRagEnabled() to true.
 */


export const RAG_DISABLED_MESSAGE =
  "Vector search is disabled (Groq-only mode — no embedding provider configured)";

/** Feature flag: vector RAG is off until an embedding provider exists. */
export function isRagEnabled(): boolean {
  return false;
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

// ─── Embedding Generation ──────────────────────────────────────────

/**
 * Disabled. Throws always — there is no embedding endpoint to call.
 * Kept (instead of deleted) so callers fail loudly, not silently.
 */
export async function generateEmbedding(_text: string): Promise<number[]> {
  throw new Error(RAG_DISABLED_MESSAGE);
}

// ─── Content Search ────────────────────────────────────────────────

/**
 * Disabled. The chat route checks isRagEnabled() first and never calls this;
 * direct callers get a loud error instead of an empty result set.
 */
export async function searchContent(
  _query: string,
  _options?: {
    limit?: number;
    threshold?: number;
  }
): Promise<SearchMatch[]> {
  throw new Error(RAG_DISABLED_MESSAGE);
}

// ─── Content Seeding ───────────────────────────────────────────────

/**
 * Disabled. The seed script reports this message instead of burning
 * per-item timeouts against a removed provider.
 */
export async function seedEmbeddings(_items: ContentItem[]): Promise<{
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
}> {
  throw new Error(`${RAG_DISABLED_MESSAGE}. Seeding skipped.`);
}
