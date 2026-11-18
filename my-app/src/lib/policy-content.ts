/**
 * Reads the canonical policy markdown off disk and parses it.
 *
 * Server-only: it touches the filesystem, so it must never be imported from a
 * client component. The registry (`policy-registry.ts`) is the safe, pure
 * half.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  POLICIES,
  REPO_URL,
  unpublishedPolicyRedirect,
  type PolicyMeta,
  type PolicySlug,
} from "./policy-registry";
import { parsePolicyMarkdown, type ParsedPolicy } from "./policy-markdown";

/**
 * Find the repository root.
 *
 * The app lives in `my-app/` inside a workspace, so the policies directory is
 * one level up. Rather than hard-coding `..` (which breaks if the app is
 * built from a different directory), walk up until a directory has both a
 * `policies/` directory and a `package.json`.
 */
function findRepoRoot(): string {
  let dir = process.cwd();
  for (let depth = 0; depth < 6; depth += 1) {
    if (existsSync(path.join(dir, "policies")) && existsSync(path.join(dir, "package.json"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

const REPO_ROOT = findRepoRoot();

/**
 * Map a markdown link target onto something usable on the site.
 *
 * - Absolute site paths and external URLs pass through untouched.
 * - Relative links are resolved against the document they appear in, so
 *   `../CODE_OF_CONDUCT.md` inside `policies/HACKATHON_RULES.md` lands on the
 *   code of conduct page rather than a 404.
 * - A link to a policy file becomes that policy's page. Anything else becomes
 *   a link into the repository, which is where those documents live.
 */
export function resolvePolicyHref(href: string, fromFile: string): string {
  const target = resolveTarget(href, fromFile);
  if (target.kind === "passthrough") return href;
  if (target.kind === "index") return "/policies";
  if (target.kind === "policy") {
    const { policy, fragment } = target;
    if (policy.published) return `/policies/${policy.slug}${fragment}`;
    // Unpublished: never link the document itself. Text links to it are
    // removed in prepareSource; this is the fallback for any that remain.
    return unpublishedPolicyRedirect(policy);
  }
  return `${REPO_URL}/blob/main/${target.resolved}${target.fragment}`;
}

type ResolvedTarget =
  | { kind: "passthrough" }
  | { kind: "index" }
  | { kind: "policy"; policy: PolicyMeta; fragment: string }
  | { kind: "repo"; resolved: string; fragment: string };

/** The policy file a resolved path names. Tolerates paths from before the
 * Code of Conduct moved under `.github/` (`CODE_OF_CONDUCT.md`,
 * `.github/policies/X.md`) by matching on the trailing path. */
function findPolicy(resolved: string): PolicyMeta | undefined {
  return (
    POLICIES.find((p) => p.file === resolved) ??
    POLICIES.find((p) => resolved.endsWith(`/${p.file}`) || p.file.endsWith(`/${resolved}`))
  );
}

function resolveTarget(href: string, fromFile: string): ResolvedTarget {
  if (/^(https?:)?\/\//.test(href) || /^[a-z]+:/i.test(href) || href.startsWith("/") || href.startsWith("#")) {
    return { kind: "passthrough" };
  }

  // Split off a `#fragment` first: `PRIVACY_POLICY.md#retention` must still
  // match the policy file, and keep its anchor on the resulting URL.
  const hashIndex = href.indexOf("#");
  const target = hashIndex === -1 ? href : href.slice(0, hashIndex);
  const fragment = hashIndex === -1 ? "" : href.slice(hashIndex);

  const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), target));
  if (resolved === "policies/README.md") return { kind: "index" };
  const policy = findPolicy(resolved);
  if (policy) return { kind: "policy", policy, fragment };
  return { kind: "repo", resolved, fragment };
}

/** Readable names for the non-policy repository files the documents cite. */
const REPO_FILE_TITLES: Record<string, string> = {
  "SECURITY.md": "Security Policy",
  "CONTRIBUTING.md": "Contributor Guide",
  "AGENTS.md": "Contributor Guide",
  "README.md": "Project README",
};

/** True when link text is just a file path (`PRIVACY_POLICY.md`, `../x.md`). */
function isFileNameText(text: string): boolean {
  return /^[\w./-]+\.md(#[\w-]+)?$/i.test(text.trim());
}

const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/**
 * Prepare a policy's markdown for the site before it is parsed.
 *
 * - A link whose text is a bare file name gets the document's title instead,
 *   so readers see "Privacy Policy", not `PRIVACY_POLICY.md`.
 * - A link to an unpublished policy is not shown as a link: it becomes the
 *   document's title as plain text, or a link to its `redirectTo` page (the
 *   terms and cookie summaries).
 * - A list item whose only purpose is pointing at an unpublished policy (the
 *   "See also" lists) is dropped, so the site does not list documents that
 *   are still under review.
 */
export function prepareSource(source: string, fromFile: string): string {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const kept = lines.filter((line) => {
    const item = /^\s*[-*]\s+\[[^\]]+\]\(([^)\s]+)\)/.exec(line);
    if (!item) return true;
    const target = resolveTarget(item[1], fromFile);
    return !(target.kind === "policy" && !target.policy.published && !target.policy.redirectTo);
  });

  return kept
    .join("\n")
    .replace(LINK, (whole, text: string, href: string) => {
      const target = resolveTarget(href, fromFile);
      const named = isFileNameText(text);
      if (target.kind === "passthrough") return whole;
      if (target.kind === "index") return `[${named ? "Policies" : text}](${href})`;
      if (target.kind === "policy") {
        const { policy } = target;
        const label = named ? policy.title : text;
        if (policy.published) return `[${label}](${href})`;
        if (policy.redirectTo) return `[${label}](${policy.redirectTo})`;
        return label;
      }
      if (!named) return whole;
      const base = path.posix.basename(target.resolved);
      return `[${REPO_FILE_TITLES[base] ?? base.replace(/\.md$/i, "").replace(/[_-]+/g, " ")}](${href})`;
    });
}

/**
 * Read and parse one policy by slug. Returns null if it cannot be read.
 *
 * The `turbopackIgnore` comments are deliberate. The policy pages are
 * prerendered at build time (`force-static` plus `generateStaticParams`), so
 * these reads happen during the build and never at runtime. Without the
 * opt-out, Turbopack's static analysis sees a filesystem path it cannot
 * scope and traces the entire repository into the server bundle — which is
 * both slow and a way to accidentally ship source files.
 */
export function loadPolicy(slug: PolicySlug): ParsedPolicy | null {
  const meta = POLICIES.find((p) => p.slug === slug);
  if (!meta) return null;

  const absolute = path.join(/*turbopackIgnore: true*/ REPO_ROOT, meta.file);
  if (!existsSync(/*turbopackIgnore: true*/ absolute)) return null;

  const source = readFileSync(/*turbopackIgnore: true*/ absolute, "utf8");
  return parsePolicyMarkdown(prepareSource(source, meta.file), (href) =>
    resolvePolicyHref(href, meta.file),
  );
}
