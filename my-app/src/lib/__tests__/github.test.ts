import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Import pure functions directly (no mocking needed for these)
import { parseGitHubUrl, formatCount } from "@/lib/github";

// ── Mock global.fetch ──────────────────────────────────────────────
const originalFetch = globalThis.fetch;

type MockedResponse = {
  ok: boolean;
  status: number;
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
  headers?: { get: (name: string) => string | null };
};

function mockFetch(responses: MockedResponse[]): void {
  let callIndex = 0;
  globalThis.fetch = vi.fn().mockImplementation(() => {
    const resp = responses[callIndex];
    if (resp === undefined) {
      return Promise.reject(new Error("No more mock responses"));
    }
    callIndex++;
    return Promise.resolve({
      ok: resp.ok,
      status: resp.status,
      json: resp.json ?? (() => Promise.reject(new Error("Not JSON"))),
      text: resp.text ?? (() => Promise.resolve("")),
      headers: resp.headers ?? { get: () => null },
    });
  });
}

import type { RepoMeta } from "@/lib/github";

// ── Module-level mock for fetchRepoMeta (dynamically imported) ─────
let fetchRepoMeta: (url: string) => Promise<RepoMeta | null>;

beforeEach(async () => {
  vi.resetAllMocks();
  // Dynamic import so global.fetch mock is in place
  const mod = await import("@/lib/github");
  fetchRepoMeta = mod.fetchRepoMeta;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

// ─────────────────────────────────────────────────────────────────────
// parseGitHubUrl
// ─────────────────────────────────────────────────────────────────────
describe("parseGitHubUrl", () => {
  it("parses a standard GitHub URL", () => {
    const result = parseGitHubUrl("https://github.com/owner/repo");
    expect(result).toEqual({ owner: "owner", repo: "repo" });
  });

  it("parses a URL with .git suffix and strips it", () => {
    const result = parseGitHubUrl("https://github.com/owner/repo.git");
    expect(result).toEqual({ owner: "owner", repo: "repo" });
  });

  it("parses a URL with trailing slash", () => {
    const result = parseGitHubUrl("https://github.com/owner/repo/");
    expect(result).toEqual({ owner: "owner", repo: "repo" });
  });

  it("returns null for non-github.com domains", () => {
    const result = parseGitHubUrl("https://gitlab.com/owner/repo");
    expect(result).toBeNull();
  });

  it("returns null for invalid URLs", () => {
    const result = parseGitHubUrl("not-a-url");
    expect(result).toBeNull();
  });

  it("returns null for URL with fewer than 2 path segments", () => {
    const result = parseGitHubUrl("https://github.com/only-owner");
    expect(result).toBeNull();
  });

  it("returns null for empty string", () => {
    const result = parseGitHubUrl("");
    expect(result).toBeNull();
  });

  it("parses deep subdirectory URLs — only owner and first segment", () => {
    const result = parseGitHubUrl("https://github.com/owner/repo/subdir");
    expect(result).toEqual({ owner: "owner", repo: "repo" });
  });
});

// ─────────────────────────────────────────────────────────────────────
// formatCount
// ─────────────────────────────────────────────────────────────────────
describe("formatCount", () => {
  it("returns '0' for zero", () => {
    expect(formatCount(0)).toBe("0");
  });

  it("returns plain number for values under 1000", () => {
    expect(formatCount(1)).toBe("1");
    expect(formatCount(42)).toBe("42");
    expect(formatCount(999)).toBe("999");
  });

  it("returns '1k' for exactly 1000", () => {
    expect(formatCount(1000)).toBe("1k");
  });

  it("returns '1.5k' for 1500", () => {
    expect(formatCount(1500)).toBe("1.5k");
  });

  it("strips trailing .0 for exact thousands", () => {
    expect(formatCount(2000)).toBe("2k");
    expect(formatCount(10000)).toBe("10k");
    expect(formatCount(100000)).toBe("100k");
  });

  it("preserves one decimal for non-round thousands", () => {
    expect(formatCount(1234)).toBe("1.2k");
    expect(formatCount(2500)).toBe("2.5k");
    expect(formatCount(9999)).toBe("10k");
  });
});

// ─────────────────────────────────────────────────────────────────────
// fetchRepoMeta
// ─────────────────────────────────────────────────────────────────────
describe("fetchRepoMeta", () => {
  const VALID_URL = "https://github.com/butwalhacks/eduforge";
  const REPO_API_RESPONSE = {
    stargazers_count: 42,
    forks_count: 7,
    pushed_at: "2026-07-01T00:00:00Z",
    topics: ["education", "opensource"],
    language: "TypeScript",
  };
  const README_CONTENT = btoa("# EduForge\n\nA platform for education.\n\n## Features\n\n- Open source\n- Free to use");

  it("returns full RepoMeta on successful API responses", async () => {
    mockFetch([
      // fetchRepoData — GET /repos/owner/repo
      { ok: true, status: 200, json: () => Promise.resolve(REPO_API_RESPONSE) },
      // fetchCommitCount — GET /repos/owner/repo/commits
      {
        ok: true, status: 200,
        json: () => Promise.resolve([]),
        headers: { get: () => '<https://api.github.com/repos/owner/repo/commits?per_page=1&page=2>; rel="next", <https://api.github.com/repos/owner/repo/commits?per_page=1&page=150>; rel="last"' },
      },
      // fetchReadmePreview — GET /repos/owner/repo/readme
      {
        ok: true, status: 200,
        json: () => Promise.resolve({ content: README_CONTENT }),
      },
    ]);

    const result = await fetchRepoMeta(VALID_URL);

    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      stargazers_count: 42,
      forks_count: 7,
      commit_count: 150,
      readme_preview: expect.stringContaining("EduForge"),
      pushed_at: "2026-07-01T00:00:00Z",
      topics: ["education", "opensource"],
      language: "TypeScript",
    });
  });

  it("returns null for invalid GitHub URL", async () => {
    const result = await fetchRepoMeta("not-a-url");
    expect(result).toBeNull();
    // parseGitHubUrl returns null before any fetch call is made
  });

  it("returns null when fetchRepoData fails (non-ok status)", async () => {
    mockFetch([
      { ok: false, status: 404, text: () => Promise.resolve("Not Found") },
    ]);

    const result = await fetchRepoMeta(VALID_URL);
    expect(result).toBeNull();
  });

  it("returns null when fetchRepoData throws (network error)", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("Network error"));

    const result = await fetchRepoMeta(VALID_URL);
    expect(result).toBeNull();
  });

  it("returns meta with commit_count=0 when commit endpoint fails", async () => {
    mockFetch([
      // fetchRepoData succeeds
      { ok: true, status: 200, json: () => Promise.resolve(REPO_API_RESPONSE) },
      // fetchCommitCount fails (404)
      { ok: false, status: 404, text: () => Promise.resolve("Not Found") },
      // fetchReadmePreview succeeds
      {
        ok: true, status: 200,
        json: () => Promise.resolve({ content: README_CONTENT }),
      },
    ]);

    const result = await fetchRepoMeta(VALID_URL);

    expect(result).not.toBeNull();
    expect(result!.commit_count).toBe(0);
    expect(result!.stargazers_count).toBe(42);
  });

  it("returns meta with readme_preview=null when readme fetch fails", async () => {
    mockFetch([
      // fetchRepoData succeeds
      { ok: true, status: 200, json: () => Promise.resolve(REPO_API_RESPONSE) },
      // fetchCommitCount succeeds
      {
        ok: true, status: 200,
        json: () => Promise.resolve([]),
        headers: { get: () => '<https://api.github.com/repos/owner/repo/commits?per_page=1&page=1>; rel="last"' },
      },
      // fetchReadmePreview fails (404 — no README)
      { ok: false, status: 404, text: () => Promise.resolve("Not Found") },
    ]);

    const result = await fetchRepoMeta(VALID_URL);

    expect(result).not.toBeNull();
    expect(result!.readme_preview).toBeNull();
    expect(result!.stargazers_count).toBe(42);
  });

  it("deduces commit_count=1 when Link header is absent and 1 commit returned", async () => {
    mockFetch([
      { ok: true, status: 200, json: () => Promise.resolve(REPO_API_RESPONSE) },
      // No Link header, body has 1 commit
      {
        ok: true, status: 200,
        json: () => Promise.resolve([{ sha: "abc123" }]),
        headers: { get: () => null },
      },
      {
        ok: true, status: 200,
        json: () => Promise.resolve({ content: README_CONTENT }),
      },
    ]);

    const result = await fetchRepoMeta(VALID_URL);

    expect(result).not.toBeNull();
    expect(result!.commit_count).toBe(1);
  });
});
