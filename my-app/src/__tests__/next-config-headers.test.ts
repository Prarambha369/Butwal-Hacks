import { describe, expect, it } from "vitest";

// Regression guard for #25. next.config headers() takes precedence over
// vercel.json for overlapping sources, so a header declared only in
// vercel.json is silently dropped. Keep every security header here, and keep
// the catch-all first: later rules win for duplicate keys, so a /widget rule
// placed before the catch-all gets its frame-ancestors overridden to 'none'.
type Rule = { source: string; headers: { key: string; value: string }[] };

const REQUIRED = [
  "Strict-Transport-Security",
  "X-Content-Type-Options",
  "Referrer-Policy",
  "Content-Security-Policy",
  "Permissions-Policy",
];

async function loadHeaders(): Promise<Rule[]> {
  const mod = (await import("../../next.config")) as {
    default: { headers: () => Promise<Rule[]> };
  };
  return mod.default.headers();
}

describe("next.config headers()", () => {
  it("applies every security header to both the catch-all and /widget", async () => {
    const rules = await loadHeaders();
    const catchAll = rules.find((r) => r.source === "/:path*");
    const widget = rules.find((r) => r.source === "/widget/:path*");

    expect(catchAll, "catch-all rule must exist").toBeDefined();
    expect(widget, "/widget rule must exist").toBeDefined();

    const targets: [string, Rule][] = [
      ["catch-all", catchAll as Rule],
      ["/widget", widget as Rule],
    ];
    for (const [name, rule] of targets) {
      const keys = rule.headers.map((h: { key: string }) => h.key);
      for (const required of REQUIRED) {
        expect(keys, `${name} must send ${required}`).toContain(required);
      }
    }
  });

  it("orders the catch-all before /widget so the widget can be embedded", async () => {
    const order = (await loadHeaders()).map((r: Rule) => r.source);
    // Later rules win for duplicate keys, so /widget has to come second.
    expect(order.indexOf("/:path*") < order.indexOf("/widget/:path*")).toBe(
      true,
    );
  });

  it("locks /widget to frame-ancestors * and everything else to 'none'", async () => {
    const rules = await loadHeaders();
    const csp = (source: string) =>
      rules
        .find((r: Rule) => r.source === source)!
        .headers.find((h: { key: string }) => h.key === "Content-Security-Policy")!
        .value;

    expect(csp("/widget/:path*")).toContain("frame-ancestors *;");
    expect(csp("/:path*")).toContain("frame-ancestors 'none';");
  });

  it("no longer leaves security headers to vercel.json", async () => {
    const { readFile } = await import("node:fs/promises");
    const raw = await readFile(
      new URL("../../../vercel.json", import.meta.url),
      "utf8",
    );
    const vercel = JSON.parse(raw) as { headers?: unknown[] };
    // vercel.json headers are shadowed by next.config for overlapping sources.
    expect(vercel.headers).toBeUndefined();
  });
});
