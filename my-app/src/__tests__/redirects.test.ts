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
  });
});
