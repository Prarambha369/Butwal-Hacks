import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * `llms.txt` is the one file AI answer engines are told to read, and the
 * convention's canonical path is `/llms.txt`. Some hosts also look under
 * `/.well-known/`, so both are published.
 *
 * The alias is a copy rather than a route handler on purpose: a route would
 * have to read the file at request time, and a static copy cannot break
 * serving. The cost is that the two can drift, which is what the first test
 * here is for. If this ever fails, copy the file again -- do not delete the
 * alias to make the test pass.
 */

const root = join(process.cwd(), "public");

describe("llms.txt", () => {
  it("the /.well-known/ alias is byte-identical to the canonical file", () => {
    const canonical = readFileSync(join(root, "llms.txt"), "utf8");
    const alias = readFileSync(join(root, ".well-known", "llms.txt"), "utf8");
    expect(alias).toBe(canonical);
  });

  it("the canonical file exists and is not a stub", () => {
    const canonical = readFileSync(join(root, "llms.txt"), "utf8");
    expect(canonical.length).toBeGreaterThan(500);
    expect(canonical.startsWith("# ")).toBe(true);
  });

  it("every internal link in it resolves to a real route", () => {
    const canonical = readFileSync(join(root, "llms.txt"), "utf8");
    // The file claims "every link below is a real, crawlable page". Check the
    // root-relative ones against the app router so that claim stays true.
    const paths = [...canonical.matchAll(/\]\((\/[a-z0-9\/-]*)\)/g)].map(
      (m) => m[1],
    );
    expect(paths.length).toBeGreaterThan(0);

    const missing = paths.filter((p) => {
      const route =
        join(process.cwd(), "src", "app", p) === join(process.cwd(), "src", "app")
          ? join(process.cwd(), "src", "app", p, "page.tsx")
          : join(process.cwd(), "src", "app", "(main)", p, "page.tsx");
      try {
        readFileSync(route);
        return false;
      } catch {
        return true;
      }
    });

    expect(missing).toEqual([]);
  });
});
