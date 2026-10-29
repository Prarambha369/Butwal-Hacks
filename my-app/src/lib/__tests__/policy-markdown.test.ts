import { describe, it, expect } from "vitest";

import { classifyHref, parsePolicyMarkdown, rewriteLinks, slugify } from "@/lib/policy-markdown";

/**
 * The policy documents are the canonical text on the site, so the parser that
 * renders them is worth pinning down. It supports a deliberately small
 * markdown subset; these tests describe that subset.
 */
describe("parsePolicyMarkdown", () => {
  it("takes the level 1 heading as the title and drops it from the blocks", () => {
    const parsed = parsePolicyMarkdown("# Code of Conduct\n\nSome text.");
    expect(parsed.title).toBe("Code of Conduct");
    expect(parsed.blocks).toHaveLength(1);
    expect(parsed.blocks[0]).toEqual({ kind: "paragraph", text: "Some text." });
  });

  it("extracts the policy version as metadata", () => {
    const parsed = parsePolicyMarkdown("# Doc\n\nPolicy version: 2026-10-21\n\nBody.");
    expect(parsed.version).toBe("2026-10-21");
    expect(parsed.blocks).toHaveLength(1);
  });

  it("does not extract policy version as metadata when extractVersion is false", () => {
    const parsed = parsePolicyMarkdown("Policy version: 2026-10-21", { extractVersion: false });
    expect(parsed.version).toBeNull();
    expect(parsed.blocks).toHaveLength(1);
    expect(parsed.blocks[0]).toEqual({ kind: "paragraph", text: "Policy version: 2026-10-21" });
  });

  it("keeps level 2 and level 3 headings with slugified ids", () => {
    const parsed = parsePolicyMarkdown("## Reporting something\n\n### Who handles it\n");
    expect(parsed.blocks[0]).toEqual({
      kind: "heading",
      level: 2,
      id: "reporting-something",
      text: "Reporting something",
    });
    expect(parsed.blocks[1]).toEqual({
      kind: "heading",
      level: 3,
      id: "who-handles-it",
      text: "Who handles it",
    });
  });

  it("joins consecutive lines of a paragraph", () => {
    const parsed = parsePolicyMarkdown("One line.\nStill the same paragraph.\n\nNew paragraph.");
    expect(parsed.blocks).toHaveLength(2);
    expect(parsed.blocks[0]).toEqual({
      kind: "paragraph",
      text: "One line. Still the same paragraph.",
    });
  });

  it("parses unordered and ordered lists", () => {
    const parsed = parsePolicyMarkdown("- one\n- two\n\n1. first\n2. second\n");
    expect(parsed.blocks[0]).toEqual({ kind: "list", ordered: false, items: ["one", "two"] });
    expect(parsed.blocks[1]).toEqual({ kind: "list", ordered: true, items: ["first", "second"] });
  });

  it("parses a table with a header row", () => {
    const parsed = parsePolicyMarkdown(
      "| Policy | Covers |\n| --- | --- |\n| CoC | Behaviour |\n",
    );
    expect(parsed.blocks[0]).toEqual({
      kind: "table",
      header: ["Policy", "Covers"],
      rows: [["CoC", "Behaviour"]],
    });
  });

  it("parses a blockquote", () => {
    const parsed = parsePolicyMarkdown("> Handle it discreetly.\n");
    expect(parsed.blocks[0]).toEqual({ kind: "quote", text: "Handle it discreetly." });
  });

  it("parses a horizontal rule", () => {
    const parsed = parsePolicyMarkdown("---\n");
    expect(parsed.blocks[0]).toEqual({ kind: "rule" });
  });

  it("rewrites link targets through the resolver", () => {
    const parsed = parsePolicyMarkdown(
      "See the [Code of Conduct](../CODE_OF_CONDUCT.md) for details.",
      (href) => (href === "../CODE_OF_CONDUCT.md" ? "/policies/code-of-conduct" : href),
    );
    expect(parsed.blocks[0]).toEqual({
      kind: "paragraph",
      text: "See the [Code of Conduct](/policies/code-of-conduct) for details.",
    });
  });

  it("rewrites links inside list items and table cells", () => {
    const parsed = parsePolicyMarkdown(
      "- [Rules](RULES.md)\n\n| Doc | Link |\n| --- | --- |\n| X | [Y](Y.md) |\n",
      (href) => `/resolved/${href}`,
    );
    expect(parsed.blocks[0]).toEqual({
      kind: "list",
      ordered: false,
      items: ["[Rules](/resolved/RULES.md)"],
    });
    expect(parsed.blocks[1]).toEqual({
      kind: "table",
      header: ["Doc", "Link"],
      rows: [["X", "[Y](/resolved/Y.md)"]],
    });
  });
});

describe("rewriteLinks", () => {
  it("leaves plain text alone", () => {
    expect(rewriteLinks("no links here", () => "/x")).toBe("no links here");
  });

  it("keeps the link text intact", () => {
    expect(rewriteLinks("[**bold**](a.md)", () => "/b")).toBe("[**bold**](/b)");
  });
});

describe("classifyHref", () => {
  it("treats a single-slash target as an internal route", () => {
    expect(classifyHref("/policies/code-of-conduct")).toEqual({
      kind: "internal",
      href: "/policies/code-of-conduct",
    });
  });

  it("does not treat protocol-relative targets as internal", () => {
    expect(classifyHref("//evil.example/phish")).toEqual({ kind: "unsafe" });
  });

  it("does not treat slash-backslash targets as internal", () => {
    expect(classifyHref("/\\\\evil.example/phish")).toEqual({ kind: "unsafe" });
  });

  it("allows in-page anchors", () => {
    expect(classifyHref("#reporting")).toEqual({ kind: "anchor", href: "#reporting" });
  });

  it("allows http, https and mailto", () => {
    expect(classifyHref("https://butwalhacks.com").kind).toBe("external");
    expect(classifyHref("http://butwalhacks.com").kind).toBe("external");
    expect(classifyHref("mailto:hello@butwalhacks.com").kind).toBe("external");
  });

  it("rejects script and data schemes", () => {
    expect(classifyHref("javascript:alert(1)")).toEqual({ kind: "unsafe" });
    expect(classifyHref("JavaScript:alert(1)")).toEqual({ kind: "unsafe" });
    expect(classifyHref("data:text/html;base64,PHNjcmlwdD4=")).toEqual({ kind: "unsafe" });
    expect(classifyHref("")).toEqual({ kind: "unsafe" });
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("What this is")).toBe("what-this-is");
  });

  it("strips punctuation", () => {
    expect(slugify("Reporting & escalation")).toBe("reporting-escalation");
  });

  it("drops inline code markers", () => {
    expect(slugify("The `code` path")).toBe("the-code-path");
  });
});
