/**
 * A very small markdown parser, scoped to the subset our policy documents use.
 *
 * Why not a dependency: the policy set is the one place in this app where the
 * text must not drift from the file on disk. A renderer we control means the
 * site shows the same bytes as the repository, with no version skew between a
 * library and the markdown it parses.
 *
 * Supported: ATX headings (level 1-3), paragraphs, unordered and ordered
 * lists, tables, blockquotes, horizontal rules, and the inline forms
 * `**bold**`, `*italic*`, `_italic_`, `` `code` `` and `[text](href)`.
 *
 * Everything else — nested lists, images, HTML, reference links — is not
 * supported on purpose. A document that uses it should be rewritten rather
 * than silently rendered wrong.
 */

export type PolicyBlock =
  | { kind: "heading"; level: 2 | 3; id: string; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "table"; header: string[]; rows: string[][] }
  | { kind: "quote"; text: string }
  | { kind: "rule" };

export interface ParsedPolicy {
  /** The level 1 heading, if the document has one. */
  title: string | null;
  /** The `Policy version:` line, if the document declares one. */
  version: string | null;
  blocks: PolicyBlock[];
}

/** Turn a heading into an anchor id. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

const TABLE_SEPARATOR = /^\|?[\s:-]*-[\s|:-]*\|?$/;

function splitTableRow(line: string): string[] {
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableSeparator(line: string): boolean {
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((cell) => TABLE_SEPARATOR.test(cell));
}

/**
 * Parse a policy document.
 *
 * `resolveHref` is applied to every link target as the document is parsed,
 * so relative markdown links (`../CODE_OF_CONDUCT.md`) become site routes
 * without the renderer needing to know where the file lives.
 */
export function parsePolicyMarkdown(
  source: string,
  resolveHrefOrOptions: ((href: string) => string) | ((href: string) => string) & { extractVersion?: boolean } | { resolveHref?: (href: string) => string; extractVersion?: boolean } = (href) => href,
): ParsedPolicy {
  let resolveHref: (href: string) => string = (href) => href;
  let extractVersion = true;
  if (typeof resolveHrefOrOptions === "function") {
    resolveHref = resolveHrefOrOptions;
    if ("extractVersion" in resolveHrefOrOptions && typeof (resolveHrefOrOptions as any).extractVersion === "boolean") {
      extractVersion = (resolveHrefOrOptions as any).extractVersion;
    }
  } else if (resolveHrefOrOptions && typeof resolveHrefOrOptions === "object") {
    if (typeof (resolveHrefOrOptions as any).resolveHref === "function") {
      resolveHref = (resolveHrefOrOptions as any).resolveHref;
    }
    if (typeof (resolveHrefOrOptions as any).extractVersion === "boolean") {
      extractVersion = (resolveHrefOrOptions as any).extractVersion;
    }
  }
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: PolicyBlock[] = [];
  let title: string | null = null;
  let version: string | null = null;

  let index = 0;

  const flushParagraph = (buffer: string[]) => {
    const text = buffer.join(" ").trim();
    buffer.length = 0;
    if (!text) return;
    blocks.push({ kind: "paragraph", text: rewriteLinks(text, resolveHref) });
  };

  const paragraph: string[] = [];

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      flushParagraph(paragraph);
      index += 1;
      continue;
    }

    // Policy version declaration — metadata, not content. The line may carry
    // markdown decoration (`**Policy version: X**`, `> Policy version: X`),
    // so strip it before matching.
    if (extractVersion) {
      const versionMatch = /^Policy version:\s*(.+)$/i.exec(
        line.trim().replace(/^[>*#\s]+/, "").replace(/[*_`]+$/, "").trim(),
      );
      if (versionMatch) {
        flushParagraph(paragraph);
        version = versionMatch[1].trim();
        index += 1;
        continue;
      }
    }

    const headingMatch = /^(#{1,3})\s+(.*)$/.exec(line);
    if (headingMatch) {
      flushParagraph(paragraph);
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      if (level === 1) {
        title = text;
      } else {
        blocks.push({
          kind: "heading",
          level: level === 2 ? 2 : 3,
          id: slugify(text),
          text: rewriteLinks(text, resolveHref),
        });
      }
      index += 1;
      continue;
    }

    if (/^(---|\*\*\*|___)\s*$/.test(line.trim())) {
      flushParagraph(paragraph);
      blocks.push({ kind: "rule" });
      index += 1;
      continue;
    }

    if (line.trim().startsWith("> ")) {
      flushParagraph(paragraph);
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("> ")) {
        quoteLines.push(lines[index].trim().slice(2));
        index += 1;
      }
      blocks.push({
        kind: "quote",
        text: rewriteLinks(quoteLines.join(" ").trim(), resolveHref),
      });
      continue;
    }

    // Table: a pipe row followed by a separator row.
    if (line.trim().startsWith("|") && isTableSeparator(lines[index + 1] ?? "")) {
      flushParagraph(paragraph);
      const header = splitTableRow(line).map((cell) => rewriteLinks(cell, resolveHref));
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        rows.push(splitTableRow(lines[index]).map((cell) => rewriteLinks(cell, resolveHref)));
        index += 1;
      }
      blocks.push({ kind: "table", header, rows });
      continue;
    }

    // Lists: consecutive "- " or "1. " lines.
    const unordered = /^\s*[-*]\s+(.*)$/;
    const ordered = /^\s*\d+\.\s+(.*)$/;
    if (unordered.test(line) || ordered.test(line)) {
      flushParagraph(paragraph);
      const isOrdered = ordered.test(line);
      const pattern = isOrdered ? ordered : unordered;
      const items: string[] = [];
      while (index < lines.length) {
        const match = pattern.exec(lines[index]);
        if (!match) break;
        items.push(rewriteLinks(match[1].trim(), resolveHref));
        index += 1;
      }
      blocks.push({ kind: "list", ordered: isOrdered, items });
      continue;
    }

    paragraph.push(line.trim());
    index += 1;
  }

  flushParagraph(paragraph);

  return { title, version, blocks };
}

/**
 * Rewrite markdown link targets inside a text run.
 *
 * Only the target is touched — the link text is left alone, because it may
 * itself contain markdown (a bold word inside a link).
 */
export function rewriteLinks(text: string, resolveHref: (href: string) => string): string {
  return text.replace(/\[([^\]]*)\]\(([^)\s]+)\)/g, (_match, label: string, href: string) => {
    return `[${label}](${resolveHref(href)})`;
  });
}

/** How a rendered markdown link target should be treated. */
export type LinkTarget =
  | { kind: "internal"; href: string }
  | { kind: "anchor"; href: string }
  | { kind: "external"; href: string }
  | { kind: "unsafe" };

/**
 * Decide whether a link target is safe to turn into an `href`.
 *
 * Policy documents are trusted, but the same renderer draws MrBallu's replies,
 * which are model output. Allowing `javascript:`, `data:`, or any other scheme
 * through would let a crafted answer execute or exfiltrate, so the allowlist is
 * explicit: site routes (`/` only, never protocol-relative `//`), in-page
 * anchors (`#`), and the two web schemes plus `mailto:`. Everything else is
 * reported as `unsafe` and the renderer falls back to showing just the label.
 */
export function classifyHref(href: string): LinkTarget {
  const target = href.trim();
  if (!target) return { kind: "unsafe" };

  // `//host/path` is protocol-relative and points off-site, so it must not be
  // mistaken for an internal route. A backslash after the leading slash is
  // also treated as an escape into an off-site/Windows-style target.
  if (
    target.startsWith("/") &&
    target.length > 1 &&
    target[1] !== "/" &&
    target[1] !== "\\"
  ) {
    return { kind: "internal", href: target };
  }
  if (target === "/") {
    return { kind: "internal", href: target };
  }
  if (target.startsWith("#")) {
    return { kind: "anchor", href: target };
  }
  if (/^(?:https?:|mailto:)/i.test(target)) {
    return { kind: "external", href: target };
  }
  return { kind: "unsafe" };
}
