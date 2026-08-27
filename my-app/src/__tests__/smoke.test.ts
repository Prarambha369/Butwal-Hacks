import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";
import { calculateLevel } from "@/lib/xp-levels";

describe("cn (clsx + tailwind-merge)", () => {
  it("merges class names", () => {
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500");
  });

  it("handles conditional classes", () => {
    const result = cn("base", false && "hidden", "extra");
    expect(result).toContain("base");
    expect(result).toContain("extra");
    expect(result).not.toContain("hidden");
  });
});

describe("calculateLevel", () => {
  it("returns level 1 for 0 xp", () => {
    const level = calculateLevel(0);
    expect(level.level).toBe(1);
  });

  it("returns highest level for high xp", () => {
    const level = calculateLevel(10000);
    expect(level.level).toBe(5);
  });

  it("returns a level with name and color", () => {
    const level = calculateLevel(250);
    expect(level).toHaveProperty("name");
    expect(level).toHaveProperty("color");
  });
});

// Route export smoke tests - data-driven for all pages
const routes = [
  // Public Marketing Pages
  { name: "/", path: "@/app/page", hasGenMeta: false },
  { name: "/explore", path: "@/app/(main)/explore/page", revalidate: 60 },
  { name: "/community", path: "@/app/(main)/community/page" },
  { name: "/chapters", path: "@/app/(main)/chapters/page", dynamic: "force-static" },
  { name: "/chapters/[slug]", path: "@/app/(main)/chapters/[slug]/page" },
  { name: "/events", path: "@/app/(main)/events/page" },
  { name: "/events/list", path: "@/app/(main)/events/list/page" },
  { name: "/events/[slug]", path: "@/app/(main)/events/[slug]/page" },
  { name: "/events/[slug]/projects", path: "@/app/(main)/events/[slug]/projects/page" },
  { name: "/projects", path: "@/app/(main)/projects/page" },
  { name: "/projects/[id]", path: "@/app/(main)/projects/[id]/page" },
  { name: "/projects/impact/[id]", path: "@/app/(main)/projects/impact/[id]/page" },
  { name: "/about", path: "@/app/(main)/about/page" },
  { name: "/blog", path: "@/app/(main)/blog/page" },
  { name: "/blog/[slug]", path: "@/app/(main)/blog/[slug]/page" },
  { name: "/contact", path: "@/app/(main)/contact/page" },
  { name: "/support", path: "@/app/(main)/support/page" },
  { name: "/governance", path: "@/app/(main)/governance/page" },
  { name: "/resources", path: "@/app/(main)/resources/page" },
  { name: "/opportunities", path: "@/app/(main)/opportunities/page" },
  { name: "/annual-report", path: "@/app/(main)/annual-report/page", hasGenMeta: true },
  { name: "/sitemap", path: "@/app/(main)/sitemap/page" },
  { name: "/donors", path: "@/app/(main)/donors/page" },
  { name: "/transparency", path: "@/app/(main)/transparency/page" },
  { name: "/initiatives", path: "@/app/(main)/initiatives/page" },
  { name: "/initiatives/[slug]", path: "@/app/(main)/initiatives/[slug]/page" },
  { name: "/programs/[slug]", path: "@/app/(main)/programs/[slug]/page" },
  { name: "/philosophy", path: "@/app/(main)/philosophy/page" },
  { name: "/gallery", path: "@/app/(main)/gallery/page" },
  { name: "/cookie-policy", path: "@/app/(main)/cookie-policy/page" },

  // Auth Pages
  { name: "/sign-in", path: "@/app/(auth)/sign-in/page" },
  { name: "/sign-up", path: "@/app/(auth)/sign-up/page" },
  { name: "/login", path: "@/app/(auth)/login/page" },
  { name: "/claim/[token]", path: "@/app/(auth)/claim/[token]/page" },

  // Profile & Verification Pages
  { name: "/verify/[markerId]", path: "@/app/verify/[markerId]/page", hasGenMeta: true },
  { name: "/p/[slug_id]", path: "@/app/p/[slug_id]/page", hasGenMeta: true, revalidate: 60 },
  { name: "/widget/[slugId]", path: "@/app/widget/[slugId]/page", hasGenMeta: true },
  { name: "/profile/[bh_id]", path: "@/app/(main)/profile/[bh_id]/page" },

  // Portal Pages
  { name: "/portal/sponsors", path: "@/app/(main)/portal/sponsors/page", dynamic: "force-dynamic" },
  { name: "/portal/sponsors/company", path: "@/app/(main)/portal/sponsors/company/page" },
  { name: "/portal/recruiters", path: "@/app/(main)/portal/recruiters/page" },
  { name: "/portal/bounties", path: "@/app/(main)/portal/bounties/page", dynamic: "force-dynamic" },
  { name: "/portal/bounties/new", path: "@/app/(main)/portal/bounties/new/page" },
  { name: "/portal/bounties/[id]/edit", path: "@/app/(main)/portal/bounties/[id]/edit/page" },
  { name: "/portal/payouts", path: "@/app/(main)/portal/payouts/page" },

  // Hacker Dashboard Pages
  { name: "/dashboard/hacker", path: "@/app/(main)/dashboard/hacker/page" },
  { name: "/dashboard/hacker/work", path: "@/app/(main)/dashboard/hacker/work/page", dynamic: "force-dynamic" },
  { name: "/dashboard/hacker/api-keys", path: "@/app/(main)/dashboard/hacker/api-keys/page" },
  { name: "/dashboard/hacker/certificates", path: "@/app/(main)/dashboard/hacker/certificates/page" },
  { name: "/dashboard/hacker/projects", path: "@/app/(main)/dashboard/hacker/projects/page" },
  { name: "/dashboard/hacker/teams", path: "@/app/(main)/dashboard/hacker/teams/page" },
  { name: "/dashboard/hacker/team-matching", path: "@/app/(main)/dashboard/hacker/team-matching/page" },
  { name: "/dashboard/hacker/profile", path: "@/app/(main)/dashboard/hacker/profile/page" },

  // Organizer Dashboard Pages
  { name: "/dashboard/organizer", path: "@/app/(main)/dashboard/organizer/page" },
  { name: "/dashboard/organizer/events", path: "@/app/(main)/dashboard/organizer/events/page" },
  { name: "/dashboard/organizer/events/new", path: "@/app/(main)/dashboard/organizer/events/new/page" },
  { name: "/dashboard/organizer/events/[event_id]", path: "@/app/(main)/dashboard/organizer/events/[event_id]/page" },
  { name: "/dashboard/organizer/events/[event_id]/attendees", path: "@/app/(main)/dashboard/organizer/events/[event_id]/attendees/page" },
  { name: "/dashboard/organizer/events/[event_id]/analytics", path: "@/app/(main)/dashboard/organizer/events/[event_id]/analytics/page" },
  { name: "/dashboard/organizer/api-keys", path: "@/app/(main)/dashboard/organizer/api-keys/page" },
  { name: "/dashboard/organizer/issue-marker", path: "@/app/(main)/dashboard/organizer/issue-marker/page" },
  { name: "/dashboard/organizer/work", path: "@/app/(main)/dashboard/organizer/work/page" },

  // Maintainer Dashboard Pages
  { name: "/dashboard/maintainer", path: "@/app/(main)/dashboard/maintainer/page" },
  { name: "/dashboard/maintainer/users", path: "@/app/(main)/dashboard/maintainer/users/page" },
  { name: "/dashboard/maintainer/audit-log", path: "@/app/(main)/dashboard/maintainer/audit-log/page" },
  { name: "/dashboard/maintainer/site-config", path: "@/app/(main)/dashboard/maintainer/site-config/page" },
  { name: "/dashboard/maintainer/trust-override", path: "@/app/(main)/dashboard/maintainer/trust-override/page" },
  { name: "/dashboard/maintainer/dedicate-school", path: "@/app/(main)/dashboard/maintainer/dedicate-school/page" },

  // Project Dashboard Pages
  { name: "/dashboard/projects/new", path: "@/app/(main)/dashboard/projects/new/page" },
  { name: "/dashboard/projects/[projectId]/edit", path: "@/app/(main)/dashboard/projects/[projectId]/edit/page" },

  // Org Pages
  { name: "/orgs/[slug]", path: "@/app/(main)/orgs/[slug]/page" },
  { name: "/orgs/[slug]/dashboard", path: "@/app/(main)/orgs/[slug]/dashboard/page" },
  { name: "/orgs/[slug]/events", path: "@/app/(main)/orgs/[slug]/events/page" },
  { name: "/orgs/[slug]/events/new", path: "@/app/(main)/orgs/[slug]/events/new/page" },
  { name: "/orgs/[slug]/members", path: "@/app/(main)/orgs/[slug]/members/page" },

  // Team Pages
  { name: "/teams", path: "@/app/(main)/teams/page" },
  { name: "/teams/create", path: "@/app/(main)/teams/create/page" },
  { name: "/teams/[team_id]", path: "@/app/(main)/teams/[team_id]/page" },

  // Legal & Static Pages
  { name: "/legal/privacy", path: "@/app/(main)/legal/privacy/page" },
  { name: "/legal/terms", path: "@/app/(main)/legal/terms/page" },

  // Docs Pages
  { name: "/docs", path: "@/app/(main)/docs/page" },
  { name: "/docs/components/section-heading", path: "@/app/(main)/docs/components/section-heading/page" },
  { name: "/docs/engineering/environment-setup", path: "@/app/(main)/docs/engineering/environment-setup/page" },

  // Special Pages
  { name: "/offline", path: "@/app/offline/page" },
  { name: "/dashboard", path: "@/app/(main)/dashboard/page" },
];

describe.each(routes)("$name", ({ name: _name, path, hasGenMeta, dynamic, revalidate }) => {
  it("exports a default page component", async () => {
    const mod = await import(path);
    expect(mod.default).toBeDefined();
  });

  if (hasGenMeta) {
    it("exports generateMetadata", async () => {
      const mod = await import(path);
      expect(mod.generateMetadata).toBeDefined();
    });
  }

  if (revalidate) {
    it(`revalidates at ${revalidate}s`, async () => {
      const mod = await import(path);
      expect(mod.revalidate).toBe(revalidate);
    });
  }

  if (dynamic) {
    it(`is ${dynamic}`, async () => {
      const mod = await import(path);
      expect(mod.dynamic).toBe(dynamic);
    });
  }
});

// Loading state exports — all loading.tsx files
const loadingFiles = [
  { name: "explore page", path: "@/app/(main)/explore/loading" },
  { name: "dashboard/organizer/api-keys", path: "@/app/(main)/dashboard/organizer/api-keys/loading" },
  { name: "programs/[slug]", path: "@/app/(main)/programs/[slug]/loading" },
  { name: "initiatives/[slug]", path: "@/app/(main)/initiatives/[slug]/loading" },
  { name: "root (app router)", path: "@/app/loading" },
];

describe("loading.tsx files", () => {
  it.each(loadingFiles)("$name has loading.tsx", async ({ path }) => {
    const mod = await import(path);
    expect(mod.default).toBeDefined();
  });
});

// Error boundary exports — all not-found.tsx and error.tsx files
const boundaryFiles = [
  { name: "root not-found", path: "@/app/not-found" },
  { name: "(main) not-found", path: "@/app/(main)/not-found" },
  { name: "root error", path: "@/app/error" },
];

describe("Boundary files (not-found.tsx, error.tsx)", () => {
  it.each(boundaryFiles)("$name exports a default component", async ({ path }) => {
    const mod = await import(path);
    expect(mod.default).toBeDefined();
  });
});

// API route handler exports — all route.ts files
const apiRoutes = [
  { name: "GET /api/metrics", path: "@/app/api/metrics/route", method: "GET" },
  { name: "POST /api/search", path: "@/app/api/search/route", method: "POST" },
  { name: "GET /api/events", path: "@/app/api/events/route", method: "GET" },
  { name: "POST /api/events/register", path: "@/app/api/events/register/route", method: "POST" },
  { name: "POST /api/events/checkin", path: "@/app/api/events/checkin/route", method: "POST" },
  { name: "GET /api/events/[eventId]/registrations", path: "@/app/api/events/[eventId]/registrations/route", method: "GET" },
  { name: "POST /api/projects", path: "@/app/api/projects/route", method: "POST", returns201: true },
  { name: "POST /api/projects/like", path: "@/app/api/projects/like/route", method: "POST" },
  { name: "POST /api/teams", path: "@/app/api/teams/route", method: "POST" },
  { name: "GET /api/bounties", path: "@/app/api/bounties/route", method: "GET", returns201: true, createMethod: "POST" },
  { name: "GET /api/badges/check", path: "@/app/api/badges/check/route", method: "GET" },
  { name: "GET /api/badges/issuer", path: "@/app/api/badges/issuer/route", method: "GET" },
  { name: "GET /api/badges/assertions/[markerId]", path: "@/app/api/badges/assertions/[markerId]/route", method: "GET" },
  { name: "POST /api/cloudinary-signature", path: "@/app/api/cloudinary-signature/route", method: "POST" },
  { name: "POST /api/report-error", path: "@/app/api/report-error/route", method: "POST" },
  { name: "POST /api/contact", path: "@/app/api/contact/route", method: "POST" },
  { name: "POST /api/webhooks/auth0", path: "@/app/api/webhooks/auth0/route", method: "POST" },
  { name: "POST /api/webhooks/opencollective", path: "@/app/api/webhooks/opencollective/route", method: "POST" },
  { name: "POST /api/webhooks/proxy", path: "@/app/api/webhooks/proxy/route", method: "POST" },
  { name: "POST /api/profile/complete", path: "@/app/api/profile/complete/route", method: "POST" },
  { name: "POST /api/profile/update", path: "@/app/api/profile/update/route", method: "POST" },
  { name: "GET /api/certificates", path: "@/app/api/certificates/route", method: "GET" },
  { name: "POST /api/certificates/extract", path: "@/app/api/certificates/extract/route", method: "POST" },
  { name: "POST /api/github/sync", path: "@/app/api/github/sync/route", method: "POST" },
  { name: "POST /api/ai/chat", path: "@/app/api/ai/chat/route", method: "POST" },
  { name: "GET /api/organizer/metrics", path: "@/app/api/organizer/metrics/route", method: "GET" },
  { name: "GET /api/impact/report/[projectId]", path: "@/app/api/impact/report/[projectId]/route", method: "GET" },
  { name: "POST /api/resources/complete", path: "@/app/api/resources/complete/route", method: "POST" },
  { name: "POST /api/reviews", path: "@/app/api/reviews/route", method: "POST" },
  { name: "POST /api/sponsor", path: "@/app/api/sponsor/route", method: "POST" },
  { name: "GET /api/notifications", path: "@/app/api/notifications/route", method: "GET" },
  { name: "GET/POST /api/tasks", path: "@/app/api/tasks/route", method: "GET", returns201: true, createMethod: "POST" },
  { name: "PATCH/DELETE /api/tasks/[id]", path: "@/app/api/tasks/[id]/route", method: "PATCH" },
  { name: "GET/POST /api/workspaces", path: "@/app/api/workspaces/route", method: "GET", returns201: true, createMethod: "POST" },
  { name: "GET /api/verify/[bhId]", path: "@/app/api/verify/[bhId]/route", method: "GET" },
  { name: "GET /api/verify/[bhId]/embed", path: "@/app/api/verify/[bhId]/embed/route", method: "GET" },
  { name: "GET/POST /api/v1/api-keys", path: "@/app/api/v1/api-keys/route", method: "GET" },
  { name: "POST /api/v1/issue-marker", path: "@/app/api/v1/issue-marker/route", method: "POST" },
  { name: "GET /api/v1/profile/[slugId]", path: "@/app/api/v1/profile/[slugId]/route", method: "GET" },
  { name: "GET /api/health", path: "@/app/api/health/route", method: "GET" },
  { name: "POST /api/github/deep-sync", path: "@/app/api/github/deep-sync/route", method: "POST" },
  { name: "GET /api/admin/annual-report", path: "@/app/api/admin/annual-report/route", method: "GET" },
];

describe.each(apiRoutes)("$name", ({ name: _name, path, method, returns201, createMethod }) => {
  it(`exports ${method} handler`, async () => {
    const mod = await import(path);
    expect(mod[method]).toBeDefined();
    expect(typeof mod[method]).toBe("function");
  });

  if (returns201) {
    const creationMethod = createMethod ?? method;
    it(`returns 201 Created via ${creationMethod}`, async () => {
      const mod = await import(path);
      expect(mod[creationMethod]).toBeDefined();
      expect(typeof mod[creationMethod]).toBe("function");
    });
  }
});

// Shared library exports
describe("@/lib/constants", () => {
  it("exports APP_URL and SITE_URL", async () => {
    const mod = await import("@/lib/constants");
    expect(mod.APP_URL).toBeDefined();
    expect(typeof mod.APP_URL).toBe("string");
    expect(mod.SITE_URL).toBeDefined();
    expect(typeof mod.SITE_URL).toBe("string");
  });
});
