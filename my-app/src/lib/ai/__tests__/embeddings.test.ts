import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mock Supabase service client ───────────────────────────────────
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();
const mockInsert = vi.fn();
const mockUpdateEq = vi.fn();
const mockUpdate = vi.fn();
const mockRpc = vi.fn();

const mockSupabase = {
  from: mockFrom,
  rpc: mockRpc,
};

vi.mock("@/utils/supabase/service", () => ({
  createServiceClient: vi.fn(() => mockSupabase),
}));

// ── Mock global.fetch ──────────────────────────────────────────────
const originalFetch = globalThis.fetch;

// Embedding service (imported after mocks are set up)
let generateEmbedding: (text: string) => Promise<number[]>;
let searchContent: (query: string, options?: { limit?: number; threshold?: number }) => Promise<any[]>;
let seedEmbeddings: (items: any[]) => Promise<{ inserted: number; updated: number; skipped: number; failed: number }>;

// ── Helpers ────────────────────────────────────────────────────────
function mockFetchSuccess(body: unknown) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

function mockFetchError(status: number, body: string) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    text: () => Promise.resolve(body),
    json: () => Promise.reject(new Error("Not JSON")),
  });
}

function mockFetchNetworkError() {
  globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
}

// ── Setup ─────────────────────────────────────────────────────────
beforeEach(async () => {
  vi.resetAllMocks();
  // Set HF_API_TOKEN for tests that need it
  process.env.HF_API_TOKEN = "hf_test_token";

  // Reset Supabase mock chain defaults (each test overrides as needed)
  mockEq.mockReturnThis();
  mockUpdateEq.mockResolvedValue({ data: null, error: null });
  mockSelect.mockReturnThis();
  mockFrom.mockReturnThis();
  mockFrom.mockImplementation(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    eq: mockEq,
    maybeSingle: mockMaybeSingle,
  }));
  mockSelect.mockImplementation(() => ({
    eq: mockEq,
    maybeSingle: mockMaybeSingle,
  }));

  mockUpdate.mockImplementation(() => ({
    eq: mockUpdateEq,
  }));
  mockEq.mockImplementation(() => ({
    eq: mockEq,
    maybeSingle: mockMaybeSingle,
  }));
  mockMaybeSingle.mockResolvedValue({ data: null, error: null });
  mockInsert.mockResolvedValue({ data: null, error: null });
  mockRpc.mockResolvedValue({ data: [], error: null });

  // Dynamic import so mocks are in place
  const mod = await import("@/lib/ai/embeddings");
  generateEmbedding = mod.generateEmbedding;
  searchContent = mod.searchContent;
  seedEmbeddings = mod.seedEmbeddings;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.HF_API_TOKEN;
});

// ─────────────────────────────────────────────────────────────────────
// generateEmbedding
// ─────────────────────────────────────────────────────────────────────
describe("generateEmbedding", () => {
  const MOCK_VECTOR = Array.from({ length: 384 }, (_, i) => i / 384);

  it("returns a 384-dimensional vector on success", async () => {
    mockFetchSuccess([MOCK_VECTOR]);

    const result = await generateEmbedding("Butwal Hacks community");
    expect(result).toHaveLength(384);
    expect(result).toEqual(MOCK_VECTOR);
  });

  it("throws if HF_API_TOKEN is not set", async () => {
    delete process.env.HF_API_TOKEN;

    await expect(generateEmbedding("test")).rejects.toThrow(
      "HF_API_TOKEN not configured"
    );
  });

  it("throws on non-ok API response", async () => {
    mockFetchError(503, "Model is loading");

    await expect(generateEmbedding("test")).rejects.toThrow(
      "Hugging Face API error 503"
    );
  });

  it("throws on unexpected response format (not an array)", async () => {
    mockFetchSuccess({ not: "an array" });

    await expect(generateEmbedding("test")).rejects.toThrow(
      "Unexpected embedding response format"
    );
  });

  it("throws on empty response array", async () => {
    mockFetchSuccess([]);

    await expect(generateEmbedding("test")).rejects.toThrow(
      "Unexpected embedding response format"
    );
  });

  it("throws when response inner element is not an array", async () => {
    mockFetchSuccess(["not-an-array"]);

    await expect(generateEmbedding("test")).rejects.toThrow(
      "Unexpected embedding response format"
    );
  });

  it("sends the correct request body and headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([MOCK_VECTOR]),
    });
    globalThis.fetch = fetchMock;

    await generateEmbedding("test input");

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("router.huggingface.co");
    expect(options.method).toBe("POST");
    expect(options.headers).toMatchObject({
      Authorization: "Bearer hf_test_token",
      "Content-Type": "application/json",
    });

    const body = JSON.parse(options.body as string);
    expect(body.inputs).toBe("test input");
    expect(body.options?.wait_for_model).toBe(true);
  });

  it("re-throws network errors", async () => {
    mockFetchNetworkError();

    await expect(generateEmbedding("test")).rejects.toThrow("fetch failed");
  });
});

// ─────────────────────────────────────────────────────────────────────
// searchContent
// ─────────────────────────────────────────────────────────────────────
describe("searchContent", () => {
  const MOCK_VECTOR = Array.from({ length: 384 }, (_, i) => i / 384);

  it("returns mapped search results on success", async () => {
    mockFetchSuccess([MOCK_VECTOR]);

    mockRpc.mockResolvedValue({
      data: [
        { id: "1", content: "Butwal Hacks is a nonprofit", metadata: { type: "initiative" }, similarity: 0.92 },
        { id: "2", content: "Chapters are school-level", metadata: { type: "chapter" }, similarity: 0.85 },
      ],
      error: null,
    });

    const results = await searchContent("tell me about Butwal Hacks", {
      limit: 2,
      threshold: 0.5,
    });

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      id: "1",
      content: "Butwal Hacks is a nonprofit",
      metadata: { type: "initiative" },
      similarity: 0.92,
    });
    expect(results[1].id).toBe("2");
  });

  it("returns empty array when no matches found", async () => {
    mockFetchSuccess([MOCK_VECTOR]);
    mockRpc.mockResolvedValue({ data: [], error: null });

    const results = await searchContent("something obscure");
    expect(results).toEqual([]);
  });

  it("uses default limit (5) and threshold (0.5) when options omitted", async () => {
    mockFetchSuccess([MOCK_VECTOR]);
    mockRpc.mockResolvedValue({ data: [], error: null });

    await searchContent("test");

    expect(mockRpc).toHaveBeenCalledWith("match_knowledge", {
      query_embedding: MOCK_VECTOR,
      match_threshold: 0.5,
      match_count: 5,
    });
  });

  it("passes custom options to the RPC call", async () => {
    mockFetchSuccess([MOCK_VECTOR]);
    mockRpc.mockResolvedValue({ data: [], error: null });

    await searchContent("test", { limit: 3, threshold: 0.7 });

    expect(mockRpc).toHaveBeenCalledWith("match_knowledge", {
      query_embedding: MOCK_VECTOR,
      match_threshold: 0.7,
      match_count: 3,
    });
  });

  it("throws when RPC returns an error", async () => {
    mockFetchSuccess([MOCK_VECTOR]);
    mockRpc.mockResolvedValue({ data: null, error: { message: "relation does not exist" } });

    await expect(searchContent("test")).rejects.toThrow(
      "Vector search failed: relation does not exist"
    );
  });

  it("throws when generateEmbedding fails (no token)", async () => {
    delete process.env.HF_API_TOKEN;

    await expect(searchContent("test")).rejects.toThrow(
      "HF_API_TOKEN not configured"
    );
  });
});

// ─────────────────────────────────────────────────────────────────────
// seedEmbeddings
// ─────────────────────────────────────────────────────────────────────
describe("seedEmbeddings", () => {
  const MOCK_VECTOR = Array.from({ length: 384 }, (_, i) => i / 384);
  const CONTENT_HASH = "abc123def456";
  const sampleItem = {
    content: "Butwal Hacks is a nonprofit tech community.",
    contentHash: CONTENT_HASH,
    metadata: {
      type: "initiative" as const,
      slug: "hackathon",
      title: "Hackathon",
      tags: ["hackathon", "building"],
      source: "src/lib/content.ts",
    },
  };

  const sampleItems = [sampleItem];

  it("inserts new items successfully", async () => {
    mockFetchSuccess([MOCK_VECTOR]);
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockInsert.mockResolvedValue({ data: null, error: null });

    const result = await seedEmbeddings(sampleItems);

    expect(result.inserted).toBe(1);
    expect(result.failed).toBe(0);

    // Should have checked for existing
    expect(mockFrom).toHaveBeenCalledWith("knowledge_embeddings");
    expect(mockInsert).toHaveBeenCalledWith({
      content: sampleItem.content,
      content_hash: CONTENT_HASH,
      metadata: sampleItem.metadata,
      embedding: MOCK_VECTOR,
    });
  });

  it("skips items with matching content_hash (content unchanged)", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: "existing-id", content_hash: CONTENT_HASH }, error: null });

    const result = await seedEmbeddings(sampleItems);

    expect(result.skipped).toBe(1);
    expect(result.inserted).toBe(0);
    expect(result.updated).toBe(0);
    expect(result.failed).toBe(0);
    // Should NOT have called insert or update
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("updates items with different content_hash (content modified)", async () => {
    mockFetchSuccess([MOCK_VECTOR]);
    // Existing row has a different hash than the sample item
    mockMaybeSingle.mockResolvedValue({
      data: { id: "existing-id", content_hash: "old-hash-different" },
      error: null,
    });

    const result = await seedEmbeddings(sampleItems);

    expect(result.updated).toBe(1);
    expect(result.inserted).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.failed).toBe(0);
    // Should have called update, not insert
    expect(mockUpdate).toHaveBeenCalledWith({
      content: sampleItem.content,
      content_hash: CONTENT_HASH,
      metadata: sampleItem.metadata,
      embedding: MOCK_VECTOR,
    });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("counts insert errors as failed", async () => {
    mockFetchSuccess([MOCK_VECTOR]);
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockInsert.mockResolvedValue({ data: null, error: { message: "duplicate key" } });

    const result = await seedEmbeddings(sampleItems);

    expect(result.inserted).toBe(0);
    expect(result.failed).toBe(1);
  });

  it("counts embedding errors as failed", async () => {
    mockFetchNetworkError();
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await seedEmbeddings(sampleItems);

    expect(result.inserted).toBe(0);
    expect(result.failed).toBe(1);
  });

  it("processes multiple items with mix of insert/skip/update", async () => {
    const items = [
      sampleItem,
      {
        ...sampleItem,
        contentHash: CONTENT_HASH,
        metadata: { ...sampleItem.metadata, slug: "gamejam", type: "initiative" as const, title: "GameJam" },
      },
      {
        ...sampleItem,
        contentHash: CONTENT_HASH,
        metadata: { ...sampleItem.metadata, slug: "chapter-one", type: "chapter" as const, title: "Chapter One" },
      },
    ];

    // All three need embedding generated
    mockFetchSuccess([MOCK_VECTOR]);

    // Item 1: existing with same hash → skip
    // Item 2: new → insert
    // Item 3: existing with different hash → update
    mockMaybeSingle
      .mockResolvedValueOnce({ data: { id: "skip-id", content_hash: CONTENT_HASH }, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: { id: "update-id", content_hash: "different-hash" }, error: null });

    mockInsert.mockResolvedValue({ data: null, error: null });

    const result = await seedEmbeddings(items);

    expect(result.inserted).toBe(1);
    expect(result.updated).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.failed).toBe(0);
  });

  it("handles the case of empty items array", async () => {
    const result = await seedEmbeddings([]);
    expect(result.inserted).toBe(0);
    expect(result.updated).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.failed).toBe(0);
  });
});
