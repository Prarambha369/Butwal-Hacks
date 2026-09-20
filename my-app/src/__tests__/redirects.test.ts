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
  });
});
