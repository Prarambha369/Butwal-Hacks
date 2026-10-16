import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("@/utils/supabase", () => ({
  createServiceClient: vi.fn(),
}));

// The static index is already covered by src/lib/__tests__/search-index.test.ts.
// Here it is stubbed so the route's own merging, ranking and pagination logic is
// what gets exercised, not the real corpus.
const { mockSearchStatic, mockSuggestNearMisses, mockScoreText, SCORES } = vi.hoisted(
  () => ({
    mockSearchStatic: vi.fn(),
    mockSuggestNearMisses: vi.fn(),
    /** Deterministic stand-in for the real relevance curve, keyed by document text. */
    SCORES: {} as Record<string, number>,
    mockScoreText: vi.fn((_query: string, text: string) => SCORES[text] ?? 0),
  })
);

vi.mock("@/lib/search-index", () => ({
  scoreText: mockScoreText,
  searchStatic: mockSearchStatic,
  suggestNearMisses: mockSuggestNearMisses,
}));

import { createServiceClient } from "@/utils/supabase";
import type { StaticSearchDoc } from "@/lib/search-index";
import { POST } from "../route";

const mockedCreateServiceClient = createServiceClient as ReturnType<typeof vi.fn>;

/** Replaces the score table in place so `mockScoreText` keeps reading it. */
function setScores(scores: Record<string, number>) {
  for (const key of Object.keys(SCORES)) delete SCORES[key];
  Object.assign(SCORES, scores);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type Row = Record<string, unknown>;

type TableRows = Record<string, Row[] | null>;

/**
 * The route chains `.from().select().or().range()`, and PostgREST builders are
 * thenable. Each table gets its own builder so the three concurrent queries can
 * return different rows.
 */
function mockDb(tables: TableRows) {
  const from = vi.fn((table: string) => {
    const builder = {
      select: vi.fn(() => builder),
      or: vi.fn(() => builder),
      range: vi.fn(() => builder),
      then: (resolve: (v: { data: Row[] | null; error: unknown }) => unknown) =>
        Promise.resolve({ data: tables[table] ?? null, error: null }).then(resolve),
    };
    return builder;
  });
  mockedCreateServiceClient.mockReturnValue({ from });
  return from;
}

function request(body: unknown): NextRequest {
  return new NextRequest("https://www.butwalhacks.com/api/search", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

async function post(body: unknown) {
  const res = await POST(request(body));
  return { res, json: await res.json() };
}

function staticDoc(overrides: Partial<StaticSearchDoc> = {}): StaticSearchDoc {
  return {
    type: "blog",
    id: "post-1",
    title: "HackDay Recap",
    subtitle: "Blog",
    href: "/blog/hackday-recap",
    tags: ["hackday"],
    summary: "A recap of the sprint.",
    body: "Long form body text.",
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  setScores({});
  mockSearchStatic.mockReturnValue([]);
  mockSuggestNearMisses.mockReturnValue([]);
  mockDb({});
});

describe("POST /api/search", () => {
  it("returns an empty result set for a query shorter than two characters", async () => {
    const { res, json } = await post({ q: "a" });

    expect(res.status).toBe(200);
    expect(json).toEqual({ results: [], suggestions: [] });
    // Short queries must never reach the database.
    expect(mockedCreateServiceClient).not.toHaveBeenCalled();
  });

  it("returns an empty result set when the body is not valid JSON", async () => {
    const { res, json } = await post("not json at all");

    expect(res.status).toBe(200);
    expect(json).toEqual({ results: [], suggestions: [] });
    expect(mockedCreateServiceClient).not.toHaveBeenCalled();
  });

  it("rejects a query longer than 100 characters", async () => {
    const { json } = await post({ q: "x".repeat(101) });

    expect(json.results).toEqual([]);
    expect(mockedCreateServiceClient).not.toHaveBeenCalled();
  });

  it("trims surrounding whitespace before validating", async () => {
    mockDb({ profiles: [] });

    // Three real characters padded to nine; the padding must not push it over.
    const { res, json } = await post({ q: "  hack  " });

    expect(res.status).toBe(200);
    expect(mockedCreateServiceClient).toHaveBeenCalled();
    expect(json.results).toEqual([]);
  });

  it("defaults to page 1 and limit 8 and echoes them back", async () => {
    mockDb({ profiles: [] });

    const { json } = await post({ q: "hack" });

    expect(json.page).toBe(1);
    expect(json.limit).toBe(8);
  });

  it("coerces numeric strings for page and limit", async () => {
    mockDb({ profiles: [] });

    const { json } = await post({ q: "hack", page: "3", limit: "5" });

    expect(json.page).toBe(3);
    expect(json.limit).toBe(5);
  });

  it("translates page and limit into the database range window", async () => {
    const from = mockDb({ profiles: [] });

    await post({ q: "hack", page: "3", limit: "5" });

    // Page 3 at limit 5 starts at offset 10 and ends at offset 14.
    const builder = from.mock.results[0].value;
    expect(builder.range).toHaveBeenCalledWith(10, 14);
  });

  it("merges database and static sources into one ranked list", async () => {
    setScores({
      "Ada Lovelace BH-26-AAAA": 90,
      "Astro Pad": 70,
      "Launch Night": 50,
      "HackDay Recap hackday": 80,
    });
    mockDb({
      profiles: [{ id: "p1", full_name: "Ada Lovelace", bh_id: "BH-26-AAAA" }],
      projects: [{ id: "pr1", title: "Astro Pad" }],
      events: [{ id: "e1", slug: "launch-night", title: "Launch Night", start_date: "2026-02-01T00:00:00Z" }],
    });
    mockSearchStatic.mockReturnValue([staticDoc()]);

    const { json } = await post({ q: "hack" });

    expect(json.results.map((r: { title: string }) => r.title)).toEqual([
      "Ada Lovelace",
      "HackDay Recap",
      "Astro Pad",
      "Launch Night",
    ]);
  });

  it("shapes each source into the documented result row shape", async () => {
    setScores({
      "Ada Lovelace BH-26-AAAA": 90,
      "Astro Pad": 70,
      "Launch Night": 50,
    });
    mockDb({
      profiles: [{ id: "p1", full_name: "Ada Lovelace", bh_id: "BH-26-AAAA" }],
      projects: [{ id: "pr1", title: "Astro Pad" }],
      events: [{ id: "e1", slug: "launch-night", title: "Launch Night", start_date: null }],
    });

    const { json } = await post({ q: "hack" });
    const byType = Object.fromEntries(json.results.map((r: { type: string }) => [r.type, r]));

    expect(byType.profile).toMatchObject({
      type: "profile",
      id: "p1",
      title: "Ada Lovelace",
      subtitle: "BH-26-AAAA",
      href: "/p/BH-26-AAAA",
    });
    expect(byType.project).toMatchObject({
      type: "project",
      id: "pr1",
      subtitle: "Project",
      href: "/projects/pr1",
    });
    // A missing start_date falls back to the generic "Event" subtitle.
    expect(byType.event).toMatchObject({
      type: "event",
      subtitle: "Event",
      href: "/events/launch-night",
    });
  });

  it("falls back to the profile id when bh_id is absent", async () => {
    mockDb({ profiles: [{ id: "p9", full_name: "Grace Hopper", bh_id: null }] });

    const { json } = await post({ q: "grace" });

    expect(json.results[0].href).toBe("/p/p9");
  });

  it("labels a profile with no name rather than dropping the row", async () => {
    mockDb({ profiles: [{ id: "p8", full_name: null, bh_id: null }] });

    const { json } = await post({ q: "anon" });

    expect(json.results).toHaveLength(1);
    expect(json.results[0].title).toBe("Unnamed");
  });

  it("formats an event start date as a short human-readable subtitle", async () => {
    mockDb({
      events: [{ id: "e2", slug: "spring", title: "Spring", start_date: "2026-03-09T00:00:00Z" }],
    });

    const { json } = await post({ q: "spring" });

    expect(json.results[0].subtitle).toMatch(/Mar\s+9/);
  });

  it("forwards the requested limit to the static search", async () => {
    mockDb({});

    await post({ q: "hack", limit: "3" });

    expect(mockSearchStatic).toHaveBeenCalledWith("hack", 3);
  });

  it("reports hasMore when a source returned a full page", async () => {
    const full = Array.from({ length: 8 }, (_, i) => ({ id: `p${i}`, full_name: `Person ${i}`, bh_id: null }));
    mockDb({ profiles: full });

    const { json } = await post({ q: "person" });

    expect(json.hasMore).toBe(true);
  });

  it("reports hasMore false when every source is under the limit", async () => {
    mockDb({
      profiles: [{ id: "p1", full_name: "Ada", bh_id: null }],
      projects: [{ id: "pr1", title: "Pad" }],
      events: [{ id: "e1", slug: "s", title: "S", start_date: null }],
    });

    const { json } = await post({ q: "pad" });

    expect(json.hasMore).toBe(false);
  });

  it("offers did-you-mean suggestions only when nothing matched", async () => {
    mockDb({});
    mockSuggestNearMisses.mockReturnValue(["HackDay", "Hack Night"]);

    const { json } = await post({ q: "hackdayy" });

    expect(json.suggestions).toEqual(["HackDay", "Hack Night"]);
    expect(mockSuggestNearMisses).toHaveBeenCalledWith("hackdayy");
  });

  it("suppresses suggestions when results were found", async () => {
    mockDb({ projects: [{ id: "pr1", title: "HackDay" }] });

    const { json } = await post({ q: "hackday" });

    expect(json.results).toHaveLength(1);
    expect(json.suggestions).toEqual([]);
    expect(mockSuggestNearMisses).not.toHaveBeenCalled();
  });

  it("skips null result sets rather than throwing", async () => {
    mockDb({ profiles: null, projects: null, events: null });

    const { res, json } = await post({ q: "hack" });

    expect(res.status).toBe(200);
    expect(json.results).toEqual([]);
    expect(json.hasMore).toBe(false);
  });

  it("returns 500 when an unexpected error is thrown", async () => {
    mockedCreateServiceClient.mockImplementation(() => {
      throw new Error("supabase is down");
    });

    const { res, json } = await post({ q: "hack" });

    expect(res.status).toBe(500);
    // The error message must not leak to the client.
    expect(json).toEqual({ results: [], suggestions: [] });
  });

  it("never exposes a stack trace in the error body", async () => {
    mockedCreateServiceClient.mockImplementation(() => {
      throw new Error("connection string leaked here");
    });

    const { json } = await post({ q: "hack" });

    expect(JSON.stringify(json)).not.toContain("connection string");
  });

  // ── PostgREST filter injection ──────────────────────────────────────────
  // The query is interpolated into `.or("col.ilike.%q%,...")`, and comma,
  // parenthesis, dot and colon are that grammar's own delimiters. A term
  // carrying them could close one condition and append another, so the
  // character class is what keeps a user-supplied string a value rather than
  // a fragment of filter syntax.

  /** Records every `.or()` filter string the route builds. */
  function recordingDb() {
    const orCalls: string[] = [];
    const from = vi.fn(() => {
      const builder = {
        select: vi.fn(() => builder),
        or: vi.fn((filter: string) => {
          orCalls.push(filter);
          return builder;
        }),
        range: vi.fn(() => builder),
        then: (resolve: (v: { data: Row[] | null; error: unknown }) => unknown) =>
          Promise.resolve({ data: null, error: null }).then(resolve),
      };
      return builder;
    });
    mockedCreateServiceClient.mockReturnValue({ from });
    return orCalls;
  }

  const INJECTION_TERMS = [
    "hack,and",
    "hack),id.not.is.null",
    "hack.not.is.null,x",
    "hack:or",
    "hack,x.ilike.y",
    "a,b,c",
    "hack*",
    "hack(%",
  ];

  it("never lets a filter delimiter reach PostgREST", async () => {
    const orCalls = recordingDb();

    for (const term of INJECTION_TERMS) {
      orCalls.length = 0;
      await post({ q: term });

      for (const filter of orCalls) {
        // Each filter must be exactly `col.ilike.%term%`, or two of those --
        // never more, and never with injected grammar.
        const conditions = filter.split(",");
        expect(conditions.length).toBeLessThanOrEqual(2);
        for (const condition of conditions) {
          expect(condition).toMatch(/^[a-z_]+\.ilike\.%[^%]*%$/);
        }
      }
    }
  });

  it("still searches on a legitimate term containing spaces and punctuation", async () => {
    const orCalls = recordingDb();
    await post({ q: "jane-doe o'brien" });

    expect(orCalls.length).toBeGreaterThan(0);
    expect(orCalls[0]).toContain("%jane-doe o'brien%");
  });

  it("accepts a Devanagari name query", async () => {
    const orCalls = recordingDb();
    await post({ q: "\u0938\u0941\u0936\u093e\u0928" });

    expect(orCalls.length).toBeGreaterThan(0);
    expect(orCalls[0]).toContain("%\u0938\u0941\u0936\u093e\u0928%");
  });

  it("accepts an ampersand and plus, which are ordinary in project names", async () => {
    const orCalls = recordingDb();
    await post({ q: "R&D + AI" });

    expect(orCalls.length).toBeGreaterThan(0);
  });
});
