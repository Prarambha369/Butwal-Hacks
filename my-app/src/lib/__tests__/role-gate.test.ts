import { describe, expect, it } from "vitest";
import { roleRedirect } from "@/lib/role-gate";

/**
 * Every privileged dashboard layout guards with `roleRedirect`.
 *
 * The regression these tests exist for: the guards used to be a truthiness
 * test, `if (profile?.role && profile.role !== "maintainer")`. A null profile
 * made `profile?.role` undefined -- falsy -- so the entire check was skipped
 * and the privileged dashboard rendered.
 *
 * Reachable when the `profiles` bootstrap in `dashboard/layout.tsx` fails:
 * the atomic `create_profile_with_bh_id` RPC errors *and* the `insert`
 * fallback errors. That leaves the layout as the only remaining gate, and it
 * opened.
 */
describe("roleRedirect", () => {
  describe("a known role", () => {
    it("allows a role on the list", () => {
      expect(roleRedirect("maintainer", ["maintainer"])).toBeNull();
    });

    it("allows any role on a multi-role list", () => {
      const allowed = ["organizer", "maintainer"];
      expect(roleRedirect("organizer", allowed)).toBeNull();
      expect(roleRedirect("maintainer", allowed)).toBeNull();
    });

    it("sends a wrong role to its own dashboard", () => {
      expect(roleRedirect("hacker", ["maintainer"])).toBe("/dashboard/hacker");
      expect(roleRedirect("organizer", ["maintainer"])).toBe("/dashboard/organizer");
    });

    it("sends a wrong role to its own dashboard on a multi-role list", () => {
      expect(roleRedirect("hacker", ["sponsor", "maintainer"])).toBe("/dashboard/hacker");
    });
  });

  describe("an unknown role -- the case that used to bypass", () => {
    const allowed = ["maintainer", "organizer", "sponsor"];

    it.each([
      ["undefined", undefined],
      ["null", null],
      ["empty string", ""],
    ])("blocks %s instead of skipping the guard", (_label, role) => {
      const result = roleRedirect(role, allowed);
      expect(result, "must not return null").not.toBeNull();
      expect(result).toBe("/dashboard/hacker");
    });

    it("never produces /dashboard/undefined", () => {
      for (const role of [undefined, null, ""]) {
        expect(roleRedirect(role, allowed)).not.toContain("undefined");
      }
    });

    it("lands on the one dashboard that cannot fail closed against itself", () => {
      // /dashboard/hacker is the bootstrap landing page, so redirecting there
      // cannot loop. Guard against a future edit pointing at a gated route.
      expect(roleRedirect(undefined, allowed)).toBe("/dashboard/hacker");
    });
  });

  it("blocks when the allow-list is empty", () => {
    expect(roleRedirect("maintainer", [])).toBe("/dashboard/maintainer");
    expect(roleRedirect(undefined, [])).toBe("/dashboard/hacker");
  });

  it("matches the allow-list exactly, not by prefix", () => {
    expect(roleRedirect("maintainer-intern", ["maintainer"])).toBe("/dashboard/maintainer-intern");
  });
});
