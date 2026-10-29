import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Shared Mocks ───────────────────────────────────────────────────────────
// No real database: the service client is a mock, per the repo testing rule.

vi.mock("@/utils/supabase", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/actions/admin", () => ({
  requireMaintainer: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { createServiceClient } from "@/utils/supabase";
import { getPublishedPost, getPublishedPosts } from "@/lib/actions/blog";

const mockedCreateServiceClient = createServiceClient as ReturnType<typeof vi.fn>;

// Track the columns string passed to select without threading it through
// the chain closure awkwardly.
let lastColumns = "";

/**
 * Uniform chainable query-builder mock. Every builder method returns the mock
 * itself; only awaiting with a known terminal step resolves the given result,
 * so both the `.single()` path and the `.order()` list path work without a
 * real database.
 */
function mockDb(result: { data: unknown; error: unknown }) {
  const single = vi.fn().mockResolvedValue(result);
  const db: Record<string, unknown> = {};
  const chain = (...methods: string[]) => {
    for (const m of methods) {
      db[m] = vi.fn((...args: unknown[]) => {
        if (m === "select") lastColumns = String(args[0]);
        return db;
      });
    }
  };
  chain("from", "select", "eq", "order", "limit", "not");
  db.single = single;
  db.then = undefined; // not a thenable: `await db` resolves to db itself
  mockedCreateServiceClient.mockReturnValue(db as unknown as ReturnType<typeof createServiceClient>);
  return db as {
    single: ReturnType<typeof vi.fn>;
  } & Record<string, ReturnType<typeof vi.fn>>;
}

beforeEach(() => {
  lastColumns = "";
  mockedCreateServiceClient.mockReset();
});

describe("blog actions — updated_at passthrough", () => {
  it("selects updated_at and maps it to updatedAt on the published post", async () => {
    mockDb({
      data: {
        id: "row-1",
        slug: "a-post",
        title: "A post",
        excerpt: "An excerpt",
        body: ["Para one."],
        tags: ["meta"],
        cover_image: null,
        is_published: true,
        published_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-02-15T10:30:00+00:00",
      },
      error: null,
    });

    const post = await getPublishedPost("a-post");

    // Migration 137 added updated_at (set_updated_at trigger); the detail page
    // feeds it to blogPostingJsonLd as dateModified, so it must survive the
    // row→post mapping.
    expect(lastColumns).toContain("updated_at");
    expect(post).not.toBeNull();
    expect(post!.slug).toBe("a-post");
    expect(post!.publishedAt).toBe("2026-01-01");
    expect(post!.updatedAt).toBe("2026-02-15T10:30:00+00:00");
  });

  it("keeps updatedAt undefined when the column is null", async () => {
    mockDb({
      data: {
        id: "row-2",
        slug: "another",
        title: "Another",
        excerpt: "",
        body: [],
        tags: [],
        cover_image: null,
        is_published: true,
        published_at: "2026-01-01T00:00:00Z",
        updated_at: null,
      },
      error: null,
    });

    const post = await getPublishedPost("another");
    expect(post).not.toBeNull();
    expect(post!.updatedAt).toBeUndefined();
  });

  it("returns static fallback posts without updatedAt", async () => {
    mockDb({ data: null, error: { message: "no row" } });
    const posts = await getPublishedPosts();
    // Static seed posts carry no update date: their markup keeps the
    // dateModified fallback in blogPostingJsonLd.
    for (const post of posts) {
      expect(post.updatedAt).toBeUndefined();
    }
  });
});
