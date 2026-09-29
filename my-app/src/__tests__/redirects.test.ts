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
  /**
   * Path families the sitemap serves from a variable segment. Everything else
   * in the sitemap is a hand-written literal, which the main guard below
   * already covers exhaustively.
   *
   * These matter separately because half of them are populated from the
   * database at request time, and the `test` CI job runs with placeholder
   * Supabase credentials — so those rows are absent in CI and the main guard
   * never sees them. A redirect introduced over one of these prefixes would
   * therefore pass CI while shipping a sitemap full of 308s in production.
   */
  const DYNAMIC_FAMILIES = [
    "/initiatives", // @/lib/content
    "/blog", // @/lib/content
    "/chapters", // @/lib/content
    "/festivals", // @/lib/festivals
    "/events", // @/lib/content + DB
    "/projects", // DB
    "/p", // DB (public profiles)
    "/teams", // DB
  ] as const;

  /**
   * The six sources this branch removed from the sitemap. Kept as the
   * explicit record of the change, and used below to derive the destination
   * assertion so a repointed redirect cannot silently drift out of coverage.
   */
  const REMOVED_SOURCES = [
    "/community",
    "/initiatives",
    "/donors",
    "/opportunities",
    "/philosophy",
    "/docs",
  ] as const;

  /**
   * Redirects that deliberately reserve a value inside a dynamic family. A DB
   * row must never be created carrying a reserved value, because the sitemap
   * would then list a URL that 308s.
   */
  const RESERVED_SLUGS = [
    // /events/list was retired as a near-duplicate of /events and leaked
    // DRAFT events publicly. It permanently reserves the value `list`.
    { source: "/events/list", reserves: "list", in: "/events" },
  ] as const;

  /**
   * Convert a Next.js redirect `source` pattern into an anchored RegExp that
   * matches full pathnames.
   *
   * Handles segment wildcards (`:id`, `:path*`, `:path+`), optional segments
   * (`:id?`, where the preceding slash is also optional), inline regex groups
   * (`:id(\d+)`), and a trailing slash on the source itself. Unrecognised
   * syntax degrades to a literal match — it fails closed (no false alarms)
   * rather than matching paths it should not.
   */
  function sourceToRegExp(source: string): RegExp {
    let pattern = "";
    for (const segment of source.replace(/\/+$/, "").split("/")) {
      const param = /^:([^*+?()]+)(\*|\+|\?)?(\(.*\))?$/.exec(segment);
      if (!param) {
        pattern += `/${segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`;
        continue;
      }
      const suffix = param[2];
      const inline = param[3];
      const body =
        inline ?? (suffix === "*" ? ".*" : suffix === "+" ? ".+" : "[^/]+");
      if (suffix === "?") {
        // `/docs/:id?` must match both `/docs` and `/docs/x`, so the slash
        // belongs inside the optional group rather than in front of it.
        pattern = pattern.replace(/\/$/, "") + `(?:/(${body}))?`;
      } else {
        pattern += `/${body}`;
      }
    }
    return new RegExp(`^${pattern || "/"}/?$`);
  }

  /** Pathname of a sitemap entry, absolute or relative, query and slash stripped. */
  function pathOf(url: string): string {
    const pathname = (() => {
      try {
        return new URL(url).pathname;
      } catch {
        // Relative entry — fall back to string surgery rather than throwing
        // and taking the whole file down with an opaque error.
        return url.split(/[?#]/)[0];
      }
    })();
    return pathname.replace(/\/+$/, "") || "/";
  }

  /** Pathnames listed in the sitemap, trailing slash and query stripped. */
  async function listedPaths() {
    const sitemap = await import("../app/sitemap");
    const entries = await sitemap.default();
    return new Set(entries.map((e) => pathOf(e.url)));
  }

  async function redirectRules() {
    const config = await import("../../next.config");
    return config.default.redirects!();
  }

  it("does not list any URL that next.config redirects", async () => {
    const redirectSources = (await redirectRules()).map((r) => r.source);
    const listed = await listedPaths();

    // Guard against a vacuous pass: if either side silently emptied out, the
    // filter below would be `[]` for the wrong reason and assert nothing.
    expect(redirectSources.length).toBeGreaterThan(0);
    expect(listed.size).toBeGreaterThan(0);

    const offenders = [...listed].filter((path) =>
      redirectSources.some((source) => sourceToRegExp(source).test(path)),
    );

    expect(offenders).toEqual([]);
  });

  it("has no redirect source that reserves a slug inside a dynamic family", async () => {
    // The coverage gap this guards: the DB-backed families above are absent
    // from CI, so the main guard cannot see them. A redirect whose tail sits
    // inside one of those families reserves a value in it — any row carrying
    // that slug would be listed in the sitemap while only ever 308-ing, and
    // CI would stay green because the row is not there to be listed.
    //
    // Scoped to redirects whose *parent* is a family. A redirect on a family
    // root (`/initiatives` itself) is safe: it claims the index page, not a
    // slug, so it cannot shadow any generated entry.
    const rules = await redirectRules();
    const collisions = rules
      .map((r) => {
        const segments = r.source.replace(/\/+$/, "").split("/");
        return { source: r.source, parent: segments.slice(0, -1).join("/") };
      })
      .filter(({ parent }) => (DYNAMIC_FAMILIES as readonly string[]).includes(parent))
      .filter(
        ({ source }) => !RESERVED_SLUGS.some((known) => known.source === source),
      );

    expect(collisions).toEqual([]);
  });

  it("documents every reserved slug in a dynamic family", async () => {
    // Paired with the assertion above: if someone adds a redirect that
    // reserves a slug inside a dynamic family, this fails and forces them to
    // record the reservation, so it is a reviewed decision rather than an
    // accident that only surfaces in production.
    const rules = await redirectRules();
    const sources = new Set(rules.map((r) => r.source));

    for (const { source } of RESERVED_SLUGS) {
      expect(sources.has(source), `${source} reservation is stale`).toBe(true);
    }
  });

  it("still lists every destination the removed entries pointed at", async () => {
    // The six stale entries were deleted rather than repointed, so their
    // destinations have to be discoverable on their own. Derived from
    // next.config rather than hardcoded, so repointing a redirect without
    // listing its new home fails here instead of passing silently.
    //
    // Scoped to the six removed sources on purpose: the auth-stub redirects
    // also point at /sign-in, which robots.ts deliberately keeps unindexed,
    // so deriving from every source would demand a page that must not exist.
    const bySource = new Map(
      (await redirectRules()).map((r) => [r.source, r] as const),
    );
    const listed = await listedPaths();

    const missing: string[] = [];
    for (const source of REMOVED_SOURCES) {
      const rule = bySource.get(source);
      expect(rule, `redirect for ${source} should still exist`).toBeDefined();
      // Destination is `/events#initiatives` etc; only the pathname has to be
      // listed, since a fragment does not change which document is served.
      const target = pathOf(rule!.destination);
      if (!listed.has(target)) missing.push(`${source} -> ${target}`);
    }

    expect(missing).toEqual([]);
  });
});
