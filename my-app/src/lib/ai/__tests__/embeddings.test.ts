import { describe, it, expect, afterEach, vi } from "vitest";
import { isRagEnabled, searchContent, RAG_DISABLED_MESSAGE } from "@/lib/ai/embeddings";
import {
  EMBEDDING_DIMENSIONS,
  GEMINI_EMBEDDING_MODEL,
  embedText,
} from "@/lib/ai/gemini-embeddings";

// Gemini-backed mode: retrieval is on iff a Gemini key is present.
// Without one, every entry point fails fast with a clear message rather than
// silently returning an empty array — an empty array would read as "the
// knowledge base has nothing", which is a different (and misleading) signal.

const KEY_VARS = ["GEMINI_API_KEY", "GOOGLE_API_KEY"] as const;
const saved: Record<string, string | undefined> = {};

afterEach(() => {
  for (const name of KEY_VARS) {
    if (name in saved) {
      if (saved[name] === undefined) delete process.env[name];
      else process.env[name] = saved[name];
      delete saved[name];
    }
  }
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function clearKeys() {
  for (const name of KEY_VARS) {
    saved[name] = process.env[name];
    delete process.env[name];
  }
}

describe("isRagEnabled", () => {
  it("is false with no embedding key configured", () => {
    clearKeys();
    expect(isRagEnabled()).toBe(false);
  });

  it("is true when GEMINI_API_KEY is set", () => {
    clearKeys();
    process.env.GEMINI_API_KEY = "test-key";
    expect(isRagEnabled()).toBe(true);
  });

  it("is true when GOOGLE_API_KEY is set", () => {
    clearKeys();
    process.env.GOOGLE_API_KEY = "test-key";
    expect(isRagEnabled()).toBe(true);
  });
});

describe("searchContent", () => {
  it("throws the disabled message instead of returning empty results", async () => {
    clearKeys();
    await expect(searchContent("tell me about Butwal Hacks")).rejects.toThrow(
      RAG_DISABLED_MESSAGE
    );
  });
});

describe("embedText", () => {
  // `embedContent` returns `{ embedding: { values } }`. Reading
  // `embeddings[0].values` (the `batchEmbedContents` shape) yielded zero
  // dimensions and broke every retrieval, so this pins the single-item shape.
  const values = Array.from({ length: EMBEDDING_DIMENSIONS }, (_, i) => i / EMBEDDING_DIMENSIONS);

  it("reads the single embedding.values shape and returns the vector", async () => {
    clearKeys();
    process.env.GEMINI_API_KEY = "test-key";
    const fetchMock = vi.fn(async (_url: unknown) => ({
      ok: true,
      json: async () => ({ embedding: { values } }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(embedText("hello")).resolves.toEqual(values);
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      `${GEMINI_EMBEDDING_MODEL}:embedContent`,
    );
  });

  it("uses the current Gemini embedding model, not the shut-down one", () => {
    expect(GEMINI_EMBEDDING_MODEL).toBe("models/gemini-embedding-001");
  });
});
