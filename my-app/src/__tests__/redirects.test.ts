import { describe, it, expect } from "vitest";

// Consolidation redirects: merged routes keep link equity via permanent
// redirects (verified live with curl during the merge; this pins them).
describe("consolidation redirects", () => {
  it("redirects merged routes to canonical homes", async () => {
    const config = await import("../../next.config");
    const redirectsFn = config.default.redirects;
    expect(redirectsFn).toBeDefined();
    const redirects = await redirectsFn!();
    const bySource = new Map(
      redirects.map((r) => [r.source, r] as const),
    );

    expect(bySource.get("/events/list")).toMatchObject({
      destination: "/events",
      permanent: true,
    });
    expect(bySource.get("/programs/annual-hackathon")).toMatchObject({
      destination: "/initiatives/hackathon",
      permanent: true,
    });
    expect(bySource.get("/programs")).toMatchObject({
      destination: "/initiatives",
      permanent: true,
    });
    expect(bySource.get("/philosophy")).toMatchObject({
      destination: "/about#philosophy",
      permanent: true,
    });
    expect(bySource.get("/profile/:bh_id")).toMatchObject({
      destination: "/p/:bh_id",
      permanent: true,
    });
    expect(bySource.get("/community")).toMatchObject({
      destination: "/explore",
      permanent: true,
    });
    expect(bySource.get("/initiatives")).toMatchObject({
      destination: "/events#initiatives",
      permanent: true,
    });
    expect(bySource.get("/donors")).toMatchObject({
      destination: "/partners#donors",
      permanent: true,
    });
    expect(bySource.get("/opportunities")).toMatchObject({
      destination: "/support#opportunities",
      permanent: true,
    });
    expect(bySource.get("/annual-report")).toMatchObject({
      destination: "/transparency?view=report",
      permanent: true,
    });
    expect(bySource.get("/login")).toMatchObject({
      destination: "/sign-in",
      permanent: true,
    });
    expect(bySource.get("/sign-up")).toMatchObject({
      destination: "/sign-in?mode=signup",
      permanent: true,
    });
    expect(bySource.get("/resources")).toMatchObject({
      destination: "/learn#resources",
      permanent: true,
    });
    expect(bySource.get("/docs")).toMatchObject({
      destination: "/learn#guides",
      permanent: true,
    });
  });
});

// The consolidation redirects above and sitemap.ts are maintained by hand and
// have drifted before: the sitemap listed /community, /initiatives, /donors,
// /opportunities, /philosophy and /docs, every one of which only ever 308s.
// That asks crawlers to fetch URLs that cannot rank, and spends crawl budget
// on a redirect hop. This pins the two files together.
describe("sitemap contains no redirect sources", () => {
  /** Pathnames listed in the sitemap, trailing slash and query stripped. */
  async function listedPaths() {
    const sitemap = await import("../app/sitemap");
    const entries = await sitemap.default();
    return new Set(
      entries.map((e) => new URL(e.url).pathname.replace(/\/$/, "")),
    );
  }

  it("does not list any URL that next.config redirects", async () => {
    const config = await import("../../next.config");
    const redirectSources = (await config.default.redirects!()).map((r) => r.source);
    const listed = await listedPaths();

    const offenders = [...listed]
      .map((path) => path || "/")
      .filter((path) => redirectSources.includes(path));

    expect(offenders).toEqual([]);
  });

  it("still lists every destination the removed entries pointed at", async () => {
    // The six stale entries were deleted rather than repointed, so their
    // destinations have to be discoverable on their own. Listed explicitly
    // rather than derived from next.config: the auth-stub redirects point at
    // /sign-in, which robots.ts deliberately keeps out of the index.
    const listed = await listedPaths();

    for (const path of ["/explore", "/events", "/partners", "/about", "/learn", "/support"]) {
      expect(listed.has(path)).toBe(true);
    }
  });
});
