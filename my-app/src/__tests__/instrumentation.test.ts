import { describe, it, expect } from "vitest";

describe("instrumentation", () => {
  it("exports onRequestError wired to Sentry so server errors are not dropped", async () => {
    const mod = await import("@/instrumentation");
    const Sentry = await import("@sentry/nextjs");

    expect(typeof mod.register).toBe("function");
    // Without this export Next.js swallows server-component render errors.
    expect(mod.onRequestError).toBe(Sentry.captureRequestError);
  });
});
