/**
 * Google Gemini embedding client.
 *
 * Groq (our only other AI provider) offers no embedding endpoint, so the RAG
 * pipeline needed a second provider. Gemini's free tier covers embeddings with
 * no card required, which is why it was chosen over HuggingFace (which now
 * bills inference) or a self-hosted model (too heavy for the deploy target).
 *
 * Model note: Gemini embedding models emit 768-dim vectors, not the 384 the
 * original MiniLM-era schema assumed. The knowledge base is built at 768 to
 * match — see the migration that creates `knowledge_embeddings`.
 *
 * `models/gemini-embedding-001` superseded `models/text-embedding-004`, which
 * Google shut down on 2026-01-14. The request shape is unchanged, but a single
 * `embedContent` call returns one `embedding` object (not an `embeddings`
 * array — that is `batchEmbedContents`), and the vector lives in `.values`.
 *
 * Everything here fails loudly rather than returning empty vectors: a silent
 * zero-vector would make every similarity search meaningless (a zero vector has
 * a well-defined but useless cosine distance to everything).
 */

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

/** Single source of truth — import instead of hardcoding, so a model swap is one line. */
export const GEMINI_EMBEDDING_MODEL = "models/gemini-embedding-001";

/** Output dimensionality. Must match `knowledge_embeddings.embedding VECTOR(768)`. */
export const EMBEDDING_DIMENSIONS = 768;

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 400;

/**
 * Per-attempt ceiling. The chat route blocks on this call, so a hung socket
 * must not be able to hold the request open; the caller's signal (if any) is
 * combined with the timeout rather than replaced.
 */
const REQUEST_TIMEOUT_MS = 8_000;

/**
 * Reads the Gemini key from the environment.
 *
 * Uses GOOGLE_API_KEY first (the name Google's own docs use, and what a
 * contributor is most likely to have set), falling back to GEMINI_API_KEY.
 */
export function geminiApiKey(): string | null {
  return process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || null;
}

/** Backoff with jitter, mirroring groq-client so retry behaviour is consistent. */
function backoffMs(attempt: number): number {
  const delay = BASE_DELAY_MS * Math.pow(2, attempt);
  const jitter = delay * 0.25;
  return Math.round(delay - Math.random() * jitter);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface GeminiEmbeddingResponse {
  /** `embedContent` returns a single embedding; `batchEmbedContents` returns an array. */
  embedding?: { values: number[] };
  error?: { message?: string };
}

/**
 * Embeds a single text chunk. Callers embed serially, one chunk at a time —
 * the seed script loops over its chunks with this function and passes each
 * result straight to the vector literal it writes to PostgREST.
 */
export async function embedText(text: string, signal?: AbortSignal): Promise<number[]> {
  const key = geminiApiKey();
  if (!key) {
    throw new Error("Gemini embedding not configured — set GOOGLE_API_KEY or GEMINI_API_KEY");
  }

  const trimmed = text.slice(0, 8000); // Gemini caps input per request
  let lastError = "";

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    if (signal?.aborted) throw new Error("Embedding aborted");

    // Combine the caller's cancellation with a hard per-attempt timeout so
    // neither a caller abort nor a stalled socket can pin the request open.
    const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;

    try {
      const res = await fetch(`${GEMINI_BASE}/${GEMINI_EMBEDDING_MODEL}:embedContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key,
        },
        body: JSON.stringify({
          model: GEMINI_EMBEDDING_MODEL,
          content: { parts: [{ text: trimmed }] },
          outputDimensionality: EMBEDDING_DIMENSIONS,
        }),
        signal: requestSignal,
      });

      if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        // 4xx other than 429 will not improve on retry — fail immediately.
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          throw new Error(`Gemini embedding rejected (${res.status}): ${body}`);
        }
        lastError = `Gemini embedding ${res.status}: ${body}`;
        await sleep(backoffMs(attempt));
        continue;
      }

      const json = (await res.json()) as GeminiEmbeddingResponse;
      const values = json.embedding?.values;
      if (!Array.isArray(values) || values.length !== EMBEDDING_DIMENSIONS) {
        throw new Error(
          `Gemini returned ${values?.length ?? 0} dims, expected ${EMBEDDING_DIMENSIONS}`,
        );
      }
      return values;
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("Gemini embedding rejected")) throw err;
      lastError = err instanceof Error ? err.message : String(err);
      if (signal?.aborted) throw err;
      await sleep(backoffMs(attempt));
    }
  }

  throw new Error(`Gemini embedding failed after ${MAX_RETRIES} attempts: ${lastError}`);
}

