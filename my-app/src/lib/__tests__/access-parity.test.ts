// @vitest-environment happy-dom

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  portalRedirect,
  organizerRedirect,
  maintainerRedirect,
  PORTAL_ROLES,
  MAINTENANCE_EMAIL_DOMAIN,
} from "@/lib/dashboard-access";

/**
 * Middleware and layouts must agree on who may enter a section.
 *
 * They are two independent gates on purpose — the proxy can be bypassed, and a
 * layout guard can be forgotten when a route is added. But independence only
 * helps if they agree, and they did not. `/portal/*` listed `organizer` in
 * `proxy-helpers.ts` while `portal/layout.tsx` allowed only sponsor and
 * maintainer, so an organizer passed the first gate and was bounced by the
 * second. The section was unreachable for everyone and nothing said so.
 *
 * Rather than string-match the two allowlists — brittle, and it could not read
 * the layout's two-branch form — each rule is a predicate in `dashboard-access`
 * that the layout calls, and the middleware list is asserted to match the roles
 * those predicates admit.
 *
 * Source-level where it has to be: the proxy and the async layouts read Auth0,
 * so they cannot be rendered here. These prove the lists agree, not that a live
 * session is admitted.
 */

const APP = process.cwd();
const read = (f: string) => readFileSync(resolve(APP, f), "utf8");

const STAFF = {
  role: "maintainer",
  email: `x@${MAINTENANCE_EMAIL_DOMAIN}`,
  emailVerified: true,
};

describe("the /portal middleware list matches what the predicate admits", () => {
  const proxy = read("src/proxy-helpers.ts");
  const at = proxy.indexOf('requireRole(request, pathname, ["sponsor"');
  const proxyLine = proxy.slice(at, proxy.indexOf("\n", at));
  const proxyRoles = [...proxyLine.match(/"([a-z]+)"/g) ?? []].map((r) =>
    r.replace(/"/g, ""),
  );

  it("lists exactly the roles portalRedirect can admit", () => {
    const admitted = new Set<string>();
    for (const role of ["sponsor", "maintainer", "organizer", "hacker", "lead"]) {
      // Staff-shaped subject, since maintainer admission depends on the domain.
      if (portalRedirect({ role, email: `x@${MAINTENANCE_EMAIL_DOMAIN}`, emailVerified: true }) === null) {
        admitted.add(role);
      }
    }
    expect([...admitted].sort()).toEqual([...PORTAL_ROLES].sort());
    expect(proxyRoles.sort()).toEqual([...PORTAL_ROLES].sort());
  });

  it("keeps organizers out of both layers", () => {
    // Organizers run events from /dashboard/organizer. Re-adding them to one
    // layer reintroduces the dead end this test exists to prevent.
    expect(proxyRoles).not.toContain("organizer");
    expect(
      portalRedirect({ role: "organizer", email: "o@x.com", emailVerified: true }),
    ).toBe("/dashboard/organizer");
  });

  it("does not admit an unverified staff address", () => {
    expect(portalRedirect({ ...STAFF, emailVerified: false })).not.toBeNull();
    expect(portalRedirect({ ...STAFF, email: "x@gmail.com" })).not.toBeNull();
  });
});

describe("privileged layouts close the role-only bypass", () => {
  // A profile carrying role='maintainer' on a non-staff address is refused by
  // /dashboard/maintainer. If the organizer and portal layouts allowed the role
  // on its own, that refusal was a speed bump: walk one door along and you are
  // in -- and the organizer section holds events and certificate templates.
  for (const file of [
    "src/app/(main)/dashboard/organizer/layout.tsx",
    "src/app/(main)/portal/layout.tsx",
  ]) {
    it(`${file.split("/").slice(-2).join("/")} applies the staff-email check`, () => {
      const src = read(file);
      expect(src).toMatch(/emailVerified/);
    });
  }

  it("the organizer layout passes `subject` through unmodified", () => {
    // Checking that a layout *calls* the predicate is not enough: it can be
    // called with a doctored argument and still look compliant. Passing a
    // rewritten role -- `subject.role === "maintainer" ? "organizer" : ...` --
    // launders a personal-address maintainer straight through the predicate.
    const src = read("src/app/(main)/dashboard/organizer/layout.tsx");
    expect(src).toMatch(/organizerRedirect\(\s*subject\s*,/);
    // No reassignment of the subject or its role before the call.
    expect(src).not.toMatch(/subject\.role\s*=(?!=)/);
    expect(src).not.toMatch(/role:\s*subject\.role\s*===/);
    expect(src).not.toMatch(/(const|let)\s+\w*role\w*\s*=\s*subject\.role/);
  });

  it("the portal layout passes `subject` through unmodified", () => {
    const src = read("src/app/(main)/portal/layout.tsx");
    expect(src).toMatch(/portalRedirect\(\{/);
    expect(src).not.toMatch(/subject\.role\s*=(?!=)/);
  });

  it("organizerRedirect refuses maintainer on a personal address", () => {
    expect(organizerRedirect({ ...STAFF, email: "x@gmail.com" }, [])).not.toBeNull();
    expect(organizerRedirect({ ...STAFF, emailVerified: false }, [])).not.toBeNull();
  });

  it("organizerRedirect admits a verified staff address", () => {
    expect(organizerRedirect(STAFF, [])).toBeNull();
  });
});

describe("no layout gates on role truthiness", () => {
  // The fail-open shape. `profile?.role && ...` skips the whole guard when the
  // profile row is missing, which is how the hacker dashboard rendered for an
  // unknown role.
  for (const file of [
    "src/app/(main)/dashboard/hacker/layout.tsx",
    "src/app/(main)/dashboard/organizer/layout.tsx",
    "src/app/(main)/dashboard/maintainer/layout.tsx",
  ]) {
    it(`${file.split("/").slice(-2).join("/")} has no truthiness gate`, () => {
      expect(read(file)).not.toMatch(/if\s*\(\s*profile\?\.role\s*&&/);
    });
  }
});

describe("each layout delegates to the shared predicates", () => {
  // Otherwise the module is advisory: a layout could keep its own inline rule
  // and drift again the moment someone edits it.
  const cases: [string, RegExp][] = [
    ["src/app/(main)/dashboard/maintainer/layout.tsx", /maintainerRedirect\(/],
    ["src/app/(main)/portal/layout.tsx", /portalRedirect\(/],
    ["src/app/(main)/dashboard/organizer/layout.tsx", /organizerRedirect\(/],
  ];
  for (const [file, pattern] of cases) {
    it(`${file.split("/").slice(-2).join("/")} calls the shared predicate`, () => {
      expect(read(file)).toMatch(pattern);
    });
  }
});

describe("maintainerRedirect is the single staff gate", () => {
  it("is reached by both privileged predicates", () => {
    // Guards against one of them growing its own divergent copy.
    expect(maintainerRedirect(STAFF)).toBeNull();
    expect(
      read("src/lib/dashboard-access.ts").match(/maintainerRedirect\(/g)?.length ?? 0,
    ).toBeGreaterThanOrEqual(3);
  });
});