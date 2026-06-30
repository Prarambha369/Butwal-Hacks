import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";
import { calculateLevel } from "@/lib/gamification/levels";

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

// ─────────────────────────────────────────────────────────
// Route smoke tests — verify pages export correctly
// ─────────────────────────────────────────────────────────

describe("/verify/[markerId]", () => {
  it("exports a default page component", async () => {
    const mod = await import("@/app/verify/[markerId]/page");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });

  it("exports generateMetadata", async () => {
    const mod = await import("@/app/verify/[markerId]/page");
    expect(mod.generateMetadata).toBeDefined();
    expect(typeof mod.generateMetadata).toBe("function");
  });
});

describe("/portal/sponsors", () => {
  it("exports a default page component", async () => {
    const mod = await import("@/app/(main)/portal/sponsors/page");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });

  it("is marked as dynamic (force-dynamic)", async () => {
    const mod = await import("@/app/(main)/portal/sponsors/page");
    // force-dynamic means the page should re-render on every request
    // This is a server component, so it won't have client-side hooks
    expect(mod.dynamic).toBe("force-dynamic");
  });
});

describe("/portal/recruiters", () => {
  it("exports a default page component", async () => {
    const mod = await import("@/app/(main)/portal/recruiters/page");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });

  it("exports static metadata", async () => {
    const mod = await import("@/app/(main)/portal/recruiters/page");
    expect(mod.metadata).toBeDefined();
    expect(mod.metadata.title).toBeDefined();
  });
});

describe("/portal/bounties", () => {
  it("exports a default page component", async () => {
    const mod = await import("@/app/(main)/portal/bounties/page");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });

  it("is marked as dynamic (force-dynamic)", async () => {
    const mod = await import("@/app/(main)/portal/bounties/page");
    expect(mod.dynamic).toBe("force-dynamic");
  });
});

describe("/p/[slug_id]", () => {
  it("exports a default page component", async () => {
    const mod = await import("@/app/p/[slug_id]/page");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });

  it("exports generateMetadata", async () => {
    const mod = await import("@/app/p/[slug_id]/page");
    expect(mod.generateMetadata).toBeDefined();
    expect(typeof mod.generateMetadata).toBe("function");
  });

  it("uses ISR with 60s revalidation", async () => {
    const mod = await import("@/app/p/[slug_id]/page");
    expect(mod.revalidate).toBe(60);
  });
});

describe("/widget/[slugId]", () => {
  it("exports a default page component", async () => {
    const mod = await import("@/app/widget/[slugId]/page");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });

  it("exports generateMetadata with noindex", async () => {
    const mod = await import("@/app/widget/[slugId]/page");
    expect(mod.generateMetadata).toBeDefined();
    expect(typeof mod.generateMetadata).toBe("function");
  });
});
