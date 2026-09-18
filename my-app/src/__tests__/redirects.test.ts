import { describe, it, expect } from "vitest";

// Consolidation redirects: merged routes keep link equity via permanent
// redirects (verified live with curl during the merge; this pins them).
describe("consolidation redirects", () => {
  it("redirects merged routes to canonical homes", async () => {
    const config = await import("../../next.config");
    const redirects = await config.default.redirects();
    const bySource = new Map(redirects.map((r: { source: string; destination: string; permanent: boolean }) => [r.source, r]));

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
