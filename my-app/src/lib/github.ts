/**
 * GitHub Deep Sync helpers.
 *
 * Fetches repo metadata (stars, forks, commit count, README) from the GitHub
 * public API. Used by the sync and deep-sync endpoints to enrich project
 * entries with real-time GitHub stats for the Hacker ID profile.
 */

import { logger } from "@/lib/logger";

const GITHUB_API_BASE = "https://api.github.com";

export interface RepoMeta {
  /** Number of stargazers */
  stargazers_count: number;
  /** Number of forks */
  forks_count: number;
  /** Total commit count on default branch (deeper API call) */
  commit_count: number;
  /** First 200 chars of README, stripped of HTML/markdown markers */
  readme_preview: string | null;
  /** ISO date string of last push */
  pushed_at: string | null;
  /** Repository topics */
  topics: string[];
  /** Primary language */
  language: string | null;
}

/**
 * Parse a GitHub URL like https://github.com/owner/repo into { owner, repo }.
 * Returns null for invalid or non-github.com URLs.
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url);
    if (u.hostname !== "github.com") return null;
    const parts = u.pathname.replace(/^\//, "").replace(/\.git$/, "").split("/");
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1] };
  } catch {
    return null;
  }
}

/**
 * Fetch the full repository metadata from the GitHub public API.
 * Works for public repos without authentication.
 */
async function fetchRepoData(owner: string, repo: string): Promise<{
  stargazers_count: number;
  forks_count: number;
  pushed_at: string;
  topics: string[];
  language: string | null;
} | null> {
  try {
    const res = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
      signal: AbortSignal.timeout(5_000),
      headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "ButwalHacks/1.0" },
    });

    if (!res.ok) {
      logger.warn("[github] fetchRepoData failed:", res.status, `${owner}/${repo}`);
      return null;
    }

    const data = await res.json();
    return {
      stargazers_count: data.stargazers_count ?? 0,
      forks_count: data.forks_count ?? 0,
      pushed_at: data.pushed_at ?? null,
      topics: data.topics ?? [],
      language: data.language ?? null,
    };
  } catch (err) {
    logger.warn("[github] fetchRepoData error:", err);
    return null;
  }
}

/**
 * Fetch the commit count for the default branch.
 * Uses the commits endpoint with per_page=1 and reads the Link header for the last page.
 */
async function fetchCommitCount(owner: string, repo: string): Promise<number> {
  try {
    const res = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?per_page=1&page=1`,
      {
        signal: AbortSignal.timeout(5_000),
        headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "ButwalHacks/1.0" },
      },
    );

    if (!res.ok) return 0;

    // Parse the Link header to find the last page number
    const linkHeader = res.headers.get("link") ?? "";
    const lastMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
    if (lastMatch) {
      return parseInt(lastMatch[1], 10);
    }

    // If there's no Link header, count the returned items
    const body = await res.json();
    return Array.isArray(body) ? body.length : 0;
  } catch (err) {
    logger.warn("[github] fetchCommitCount error:", err);
    return 0;
  }
}

/**
 * Fetch and extract a README preview (first 200 chars of decoded content).
 */
async function fetchReadmePreview(owner: string, repo: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/readme`,
      {
        signal: AbortSignal.timeout(5_000),
        headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "ButwalHacks/1.0" },
      },
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.content) return null;

    // Content is base64-encoded
    const decoded = Buffer.from(data.content, "base64").toString("utf-8");
    // Strip markdown headers, links, images for a clean preview
    const cleaned = decoded
      .replace(/!\[.*?\]\(.*?\)/g, "")    // images
      .replace(/\[([^\]]+)\]\(.*?\)/g, "$1") // links
      .replace(/^#+\s*/gm, "")            // headers
      .replace(/\*{1,3}/g, "")            // bold/italic markers
      .replace(/`{1,3}/g, "")             // code markers
      .trim();

    return cleaned.slice(0, 200) + (cleaned.length > 200 ? "..." : "");
  } catch (err) {
    logger.warn("[github] fetchReadmePreview error:", err);
    return null;
  }
}

/**
 * Format a numeric count for display.
 * Shows "1.5k" for 1500, "2k" for 2000, plain number under 1000.
 */
export function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

/**
 * Fetch all available GitHub metadata for a repository URL.
 * Returns null if the URL is invalid or the repo is unreachable.
 *
 * @note Uses Buffer (Node.js) internally. Server-only — do not import
 *       into client components.
 */
export async function fetchRepoMeta(githubUrl: string): Promise<RepoMeta | null> {
  const parsed = parseGitHubUrl(githubUrl);
  if (!parsed) return null;

  const [repoData, commitCount, readmePreview] = await Promise.all([
    fetchRepoData(parsed.owner, parsed.repo),
    fetchCommitCount(parsed.owner, parsed.repo),
    fetchReadmePreview(parsed.owner, parsed.repo),
  ]);

  if (!repoData) return null;

  return {
    stargazers_count: repoData.stargazers_count,
    forks_count: repoData.forks_count,
    commit_count: commitCount,
    readme_preview: readmePreview,
    pushed_at: repoData.pushed_at,
    topics: repoData.topics,
    language: repoData.language,
  };
}
