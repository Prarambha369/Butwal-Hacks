/**
 * Reads the canonical policy markdown off disk and parses it.
 *
 * Server-only: it touches the filesystem, so it must never be imported from a
 * client component. The registry (`policy-registry.ts`) is the safe, pure
 * half.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { POLICIES, REPO_URL, type PolicySlug } from "./policy-registry";
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
  if (/^(https?:)?\/\//.test(href) || href.startsWith("/") || href.startsWith("#")) {
    return href;
  }

  const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), href));
  const policy = POLICIES.find((p) => p.file === resolved);
  if (policy) return `/policies/${policy.slug}`;

  return `${REPO_URL}/blob/main/${resolved}`;
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
  return parsePolicyMarkdown(source, (href) => resolvePolicyHref(href, meta.file));
}

/**
 * The policy index. It is the same file that lives in the repository as
 * `policies/README.md`, so the site and the repo never disagree about what
 * the policy set is.
 */
export function loadPolicyIndex(): ParsedPolicy | null {
  const file = "policies/README.md";
  const absolute = path.join(/*turbopackIgnore: true*/ REPO_ROOT, file);
  if (!existsSync(/*turbopackIgnore: true*/ absolute)) return null;

  const source = readFileSync(/*turbopackIgnore: true*/ absolute, "utf8");
  return parsePolicyMarkdown(source, (href) => resolvePolicyHref(href, file));
}
