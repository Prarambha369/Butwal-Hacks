import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Link-integrity guard for the AI-crawler entry points.
 *
 * `llms.txt` opens by claiming "Every link below is a real, crawlable page."
 * That claim was false when the file first landed: it linked `/partors`
 * (typo, 404) and `/initiatives` (308 to `/events#initiatives`). Both were
 * caught by resolving every path against the live site before merging.
 *
 * These tests pin the claim by resolving each referenced path against the
 * filesystem instead of the network, so the suite stays offline and a typo
 * cannot come back.
 */
const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const APP = join(ROOT, "src/app");

/** Route groups like (main) are layout-only and not part of the URL. */
function stripGroups(p: string): string {
  return p
    .split("/")
    .filter((seg) => !(seg.startsWith("(") && seg.endsWith(")")))
    .join("/");
}

/**
 * Next.js serves these as URL paths from a plain file of the same name, not
 * from a page directory: `app/sitemap.ts` -> `/sitemap.xml`.
 */
const METADATA_ROUTES: Record<string, string> = {
  "sitemap.ts": "/sitemap.xml",
  "sitemap.js": "/sitemap.xml",
  "robots.ts": "/robots.txt",
  "robots.js": "/robots.txt",
  "manifest.ts": "/manifest.webmanifest",
  "manifest.js": "/manifest.webmanifest",
};

function routes(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    const entries = readdirSync(dir, { withFileTypes: true });
    const names = entries.map((e) => e.name);

    // Always recurse: route groups like (main) have no page.tsx of their own
    // but contain the pages. Only the leaf needs to exist to be a route.
    if (names.includes("page.tsx")) {
      const rel = stripGroups(relative(APP, dir)).split(/[\\/]/).join("/");
      // Dynamic segments become a wildcard so [slug] matches a literal path.
      out.push("/" + rel.replace(/\[\.\.\.[^\]]+\]|\[[^\]]+\]/g, "*"));
    }
    if (names.includes("route.ts")) {
      const rel = stripGroups(relative(APP, dir)).split(/[\\/]/).join("/");
      out.push("/" + rel);
    }
    for (const n of names) {
      if (n in METADATA_ROUTES) out.push(METADATA_ROUTES[n]);
    }
    for (const e of entries) {
      if (e.isDirectory() && !e.name.startsWith("_")) walk(join(dir, e.name));
    }
  };
  walk(APP);

  // Anything in public/ is served verbatim.
  const pub = join(ROOT, "public");
  if (existsSync(pub)) for (const f of readdirSync(pub)) out.push("/" + f);

  return out.map((r) => r.replace(/\/\*+$/, "") || "/");
}

/** Paths a file references: markdown links plus inline-code paths. */
function referencedPaths(src: string): string[] {
  const out = new Set<string>();
  for (const m of src.matchAll(/\]\((\/[^)\s]*)\)/g)) out.add(m[1]);
  for (const m of src.matchAll(/`(\/[^`\s]*)`/g)) out.add(m[1]);
  return [...out].map((p) => p.split("#")[0]).filter(Boolean);
}

const FILES = ["public/llms.txt", "public/llms-full.txt"];

function read(name: string): string {
  return readFileSync(join(ROOT, name), "utf8");
}

describe("llms.txt", () => {
  const known = routes();

  it("ships both entry points", () => {
    for (const f of FILES) expect(existsSync(join(ROOT, f)), f).toBe(true);
  });

  it("follows the llms.txt convention", () => {
    const src = read("public/llms.txt");
    expect(src, "must open with a single H1").toMatch(/^# .+/);
    expect(src, "needs a blockquote summary").toMatch(/^> .+/m);
  });

  it.each(FILES)("%s references only real routes", (file) => {
    const paths = referencedPaths(read(file));
    expect(paths.length, "should reference pages").toBeGreaterThan(3);

    const broken = paths.filter(
      (p) => !known.includes(p) && !known.some((k) => k !== "/" && p.startsWith(`${k}/`)),
    );
    expect(broken, `every path in ${file} must exist as a page route`).toEqual([]);
  });

  it("never repeats the /partors typo", () => {
    for (const f of FILES) {
      expect(read(f), f).not.toContain("/partors");
    }
  });

  it("links the partners page correctly", () => {
    expect(read("public/llms.txt")).toContain("](/partners)");
  });
});
