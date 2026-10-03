import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { roleRedirect } from "@/lib/role-gate";

/**
 * Role guards on the dashboard layouts.
 *
 * The maintainer and organizer layouts were converted to `roleRedirect`, which
 * fails closed. The hacker layout kept the older inline form:
 *
 *   if (profile?.role && profile.role !== "hacker" && ...)
 *
 * `profile?.role` is `undefined` when the profile row is missing, the condition
 * is falsy, the guard is skipped, and the dashboard renders. That is the exact
 * fail-open bug `role-gate.ts` documents as the reason it exists -- so the
 * guard existed, was correct, was applied to two of three layouts, and the
 * third kept the bug it was written to remove.
 *
 * Layouts are async server components that call `auth0.getSession()`, so they
 * cannot be rendered meaningfully in a unit test. These assertions are
 * therefore source-level. That is a real limit and worth being explicit about:
 * they prove the guard is written in the fail-closed shape, not that the
 * deployed page behaves correctly for a live session.
 */

const APP = process.cwd();

const LAYOUTS = [
  {
    role: "hacker",
    guard: "roleRedirect",
    file: "src/app/(main)/dashboard/hacker/layout.tsx",
  },
  {
    role: "organizer",
    guard: "organizerRedirect",
    file: "src/app/(main)/dashboard/organizer/layout.tsx",
  },
  {
    role: "maintainer",
    guard: "maintainerRedirect",
    file: "src/app/(main)/dashboard/maintainer/layout.tsx",
  },
  {
    // Never covered by this guard before it gained its own predicate.
    role: "portal",
    guard: "portalRedirect",
    file: "src/app/(main)/portal/layout.tsx",
  },
];

const read = (file: string) => readFileSync(resolve(APP, file), "utf8");

describe("dashboard layout role guards", () => {
  it.each(LAYOUTS)("$role layout gates with $guard", ({ file, guard }) => {
    const src = read(file);
    expect(src).toContain(`${guard}(`);
  });

  it.each(LAYOUTS)("$role layout does not gate on role truthiness", ({ file }) => {
    // The fail-open shape. Any `profile?.role &&` combined with a role
    // comparison means an unknown role is treated as allowed.
    const src = read(file);
    expect(src).not.toMatch(/if\s*\(\s*profile\?\.role\s*&&/);
  });

  it.each(LAYOUTS)("$role layout redirects on the blocked path", ({ file }) => {
    const src = read(file);
    // A gate that computes `blocked` must actually act on it, or the guard is
    // dead code that reads as protection. The predicate name varies per layout
    // (roleRedirect / organizerRedirect / maintainerRedirect / portalRedirect)
    // but the shape must not.
    expect(src).toMatch(/const blocked = \w+Redirect\([\s\S]{0,200}redirect\(blocked\)/);
  });

  it.each(LAYOUTS)("$role layout imports its guard from the shared module", ({ file, guard }) => {
    // Guards drift when they are inlined per layout. Each one must come from the
    // single shared source of truth, not a local copy.
    const src = read(file);
    expect(src).toMatch(new RegExp(`import[^;]*\\{[^}]*${guard}[^}]*\\}[^;]*from "@/lib/\\S+"`));
  });
});

describe("the hacker allowlist, now that it is fail-closed", () => {
  // Preserved deliberately from the previous inline check, so converting to
  // roleRedirect changed the null case only -- not who can reach the page.
  const HACKER_ALLOWED = ["hacker", "lead", "maintainer"];

  it("still admits every role that previously worked", () => {
    for (const role of HACKER_ALLOWED) {
      expect(roleRedirect(role, HACKER_ALLOWED)).toBeNull();
    }
  });

  it("blocks an unknown role instead of admitting it", () => {
    // The behaviour change: previously this rendered the dashboard.
    expect(roleRedirect(undefined, HACKER_ALLOWED)).toBe("/dashboard/hacker");
    expect(roleRedirect(null, HACKER_ALLOWED)).toBe("/dashboard/hacker");
    expect(roleRedirect("", HACKER_ALLOWED)).toBe("/dashboard/hacker");
  });

  it("still sends a wrong role to its own dashboard", () => {
    expect(roleRedirect("organizer", HACKER_ALLOWED)).toBe("/dashboard/organizer");
    expect(roleRedirect("sponsor", HACKER_ALLOWED)).toBe("/dashboard/sponsor");
  });
});