import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/utils/supabase", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { createServiceClient } from "@/utils/supabase";
import {
  findMergeCandidates,
  githubAccountId,
  isMergeCandidate,
  linkedAuth0Subjects,
} from "../account-consolidation";

const mockedCreateServiceClient = createServiceClient as ReturnType<typeof vi.fn>;

// ─── Mock database ──────────────────────────────────────────────────────────

interface QueryResponse {
  data: Record<string, unknown>[] | null;
  error: { code: string; message: string } | null;
}

/**
 * Chainable PostgREST stand-in: every filter method records its call and
 * returns the same thenable builder, which resolves to the next queued
 * response when awaited.
 */
function makeDb(responses: QueryResponse[]) {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const builder: Record<string, unknown> = {};

  for (const method of ["select", "eq", "neq", "order", "contains", "in"]) {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    };
  }

  builder.then = (resolve: (value: QueryResponse) => void) => {
    resolve(responses.shift() ?? { data: [], error: null });
  };

  return { db: { from: vi.fn(() => builder) }, calls };
}

function useDb(responses: QueryResponse[]) {
  const { db, calls } = makeDb(responses);
  mockedCreateServiceClient.mockReturnValue(
    db as unknown as ReturnType<typeof createServiceClient>
  );
  return calls;
}

const GITHUB_ID = "12345678";

const profileRow = (overrides: Record<string, unknown> = {}) => ({
  id: "profile-source",
  email: "same@example.com",
  slug_id: "abc123",
  role: "hacker",
  full_name: "Source Name",
  github_username: "mutable-login",
  linked_accounts: [{ provider: "github", user_id: GITHUB_ID, email: null, name: null, linked_at: "2026-01-01T00:00:00.000Z" }],
  created_at: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

beforeEach(() => {
  mockedCreateServiceClient.mockReset();
});

// ─── githubAccountId ────────────────────────────────────────────────────────

describe("githubAccountId", () => {
  it("returns the stable numeric id from a linked GitHub identity", () => {
    expect(githubAccountId([{ provider: "github", user_id: GITHUB_ID }])).toBe(GITHUB_ID);
  });

  it("ignores non-GitHub providers", () => {
    expect(
      githubAccountId([
        { provider: "linkedin", user_id: "abc" },
        { provider: "google-oauth2", user_id: "google-123" },
      ])
    ).toBeNull();
  });

  it("returns null for missing, malformed, or empty identities", () => {
    expect(githubAccountId(null)).toBeNull();
    expect(githubAccountId(undefined)).toBeNull();
    expect(githubAccountId("github")).toBeNull();
    expect(githubAccountId([null, 42, { provider: "github", user_id: "   " }])).toBeNull();
  });

  it("trims whitespace around the stored id", () => {
    expect(githubAccountId([{ provider: "github", user_id: ` ${GITHUB_ID} ` }])).toBe(GITHUB_ID);
  });
});

// ─── linkedAuth0Subjects ────────────────────────────────────────────────────

describe("linkedAuth0Subjects", () => {
  it("reconstructs the composite subject for every linked identity", () => {
    expect(
      linkedAuth0Subjects([
        { provider: "linkedin", user_id: "aYfV5ZyXcC" },
        { provider: "google-oauth2", user_id: "109415547175432507265" },
      ])
    ).toEqual(["linkedin|aYfV5ZyXcC", "google-oauth2|109415547175432507265"]);
  });

  it("skips malformed entries and empty ids", () => {
    expect(linkedAuth0Subjects([null, 42, { provider: "github" }, { provider: "github", user_id: "  " }])).toEqual([]);
  });

  it("returns an empty list for missing or non-array input", () => {
    expect(linkedAuth0Subjects(null)).toEqual([]);
    expect(linkedAuth0Subjects("github|123")).toEqual([]);
  });
});

// ─── findMergeCandidates ────────────────────────────────────────────────────

describe("findMergeCandidates", () => {
  it("matches on the stable GitHub account id, not the mutable username", async () => {
    const calls = useDb([{ data: [profileRow()], error: null }]);

    const candidates = await findMergeCandidates("profile-target", null, GITHUB_ID);

    const contains = calls.find((c) => c.method === "contains");
    expect(contains?.args).toEqual([
      "linked_accounts",
      [{ provider: "github", user_id: GITHUB_ID }],
    ]);
    expect(calls.some((c) => c.method === "eq" && c.args[0] === "github_username")).toBe(false);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].match_reason).toBe("same-github");
  });

  it("does not flag a same-username profile with a different account id as a GitHub match", async () => {
    useDb([
      {
        data: [
          profileRow({
            id: "profile-other",
            linked_accounts: [{ provider: "github", user_id: "99999999" }],
          }),
        ],
        error: null,
      },
    ]);

    const candidates = await findMergeCandidates("profile-target", null, GITHUB_ID);

    expect(candidates).toHaveLength(1);
    expect(candidates[0].match_reason).toBe("manual");
  });

  it("queries email and GitHub id, deduping rows returned by both", async () => {
    const calls = useDb([
      { data: [profileRow()], error: null },
      { data: [profileRow()], error: null },
    ]);

    const candidates = await findMergeCandidates("profile-target", "same@example.com", GITHUB_ID);

    expect(calls.some((c) => c.method === "eq" && c.args[0] === "email")).toBe(true);
    expect(calls.some((c) => c.method === "contains")).toBe(true);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].match_reason).toBe("same-email");
  });

  it("runs no query when there is no identifier to match on", async () => {
    const calls = useDb([]);

    const candidates = await findMergeCandidates("profile-target", null, null);

    expect(calls).toHaveLength(0);
    expect(candidates).toEqual([]);
  });

  it("logs and skips a failed query instead of throwing", async () => {
    useDb([{ data: null, error: { code: "42703", message: "column does not exist" } }]);

    await expect(findMergeCandidates("profile-target", "same@example.com", null)).resolves.toEqual([]);
  });

  it("excludes suspended profiles and the current profile at query level", async () => {
    const calls = useDb([{ data: [], error: null }]);

    await findMergeCandidates("profile-target", "same@example.com", null);

    expect(calls.some((c) => c.method === "eq" && c.args[0] === "is_suspended" && c.args[1] === false)).toBe(true);
    expect(calls.some((c) => c.method === "neq" && c.args[0] === "id" && c.args[1] === "profile-target")).toBe(true);
  });

  it("matches a profile still attached to a linked identity's former subject", async () => {
    const calls = useDb([
      { data: [profileRow({ id: "profile-former", auth0_user_id: "linkedin|aYfV5ZyXcC", linked_accounts: [] })], error: null },
    ]);

    const candidates = await findMergeCandidates("profile-target", null, null, [
      "linkedin|aYfV5ZyXcC",
    ]);

    expect(calls.some((c) => c.method === "in" && c.args[0] === "auth0_user_id")).toBe(true);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].match_reason).toBe("linked-identity");
  });

  it("runs no linked-identity query when the profile has none linked", async () => {
    const calls = useDb([]);

    await findMergeCandidates("profile-target", null, null, []);

    expect(calls).toHaveLength(0);
  });
});

// ─── isMergeCandidate ───────────────────────────────────────────────────────

describe("isMergeCandidate", () => {
  it("accepts a profile returned by the candidate query", async () => {
    useDb([{ data: [profileRow()], error: null }]);

    await expect(
      isMergeCandidate("profile-target", null, GITHUB_ID, "profile-source")
    ).resolves.toBe(true);
  });

  it("rejects a profile that is not a candidate", async () => {
    useDb([{ data: [profileRow({ id: "someone-else" })], error: null }]);

    await expect(
      isMergeCandidate("profile-target", null, GITHUB_ID, "profile-source")
    ).resolves.toBe(false);
  });

  it("rejects a profile merging into itself without querying", async () => {
    const calls = useDb([]);

    await expect(
      isMergeCandidate("profile-target", null, GITHUB_ID, "profile-target")
    ).resolves.toBe(false);
    expect(calls).toHaveLength(0);
  });
});
