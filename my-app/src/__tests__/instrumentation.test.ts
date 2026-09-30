import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `instrumentation.ts` is the only thing that loads the Sentry **server**
 * config. `@sentry/nextjs` auto-injects `sentry.client.config.ts` at build
 * time, but nothing loads `sentry.server.config.ts` on its own — and
 * `withSentryConfig` in `next.config.ts` is a build-time webpack wrapper, not
 * a runtime hook.
 *
 * Without this file:
 *   - `Sentry.captureException()` is a no-op on the server
 *   - `httpIntegration` never instruments outgoing requests
 *   - server-component render errors are swallowed entirely
 *
 * In other words, every server-side error was being dropped on the floor.
 */
// Records each time the server config is actually pulled in, so the
// nodejs-runtime test can prove register() loaded it rather than merely
// observing that the module exists.
const loaded = vi.hoisted(() => ({ count: 0 }));

// Resolved from this file (src/__tests__/) to my-app/sentry.server.config — the
// same module instrumentation.ts reaches via its own "../sentry.server.config".
vi.mock("../../sentry.server.config", () => {
  loaded.count++;
  return { __esModule: true };
});

describe("instrumentation", () => {
  const originalRuntime = process.env.NEXT_RUNTIME;

  beforeEach(() => {
    vi.resetModules();
    loaded.count = 0;
  });

  afterEach(() => {
    if (originalRuntime === undefined) delete process.env.NEXT_RUNTIME;
    else process.env.NEXT_RUNTIME = originalRuntime;
  });

  it("exports onRequestError wired to Sentry so server errors are not dropped", async () => {
    const mod = await import("@/instrumentation");
    const Sentry = await import("@sentry/nextjs");

    expect(typeof mod.register).toBe("function");
    // Without this export Next.js swallows server-component render errors.
    expect(mod.onRequestError).toBe(Sentry.captureRequestError);
  });

  it("loads the server config on the nodejs runtime", async () => {
    process.env.NEXT_RUNTIME = "nodejs";

    const mod = await import("@/instrumentation");
    await mod.register();

    // This is the assertion that matters: without register() pulling the
    // module in, server-side Sentry never initialises.
    expect(loaded.count).toBeGreaterThan(0);
  });

  it("skips the server config on the edge runtime", async () => {
    process.env.NEXT_RUNTIME = "edge";

    const mod = await import("@/instrumentation");
    await expect(mod.register()).resolves.not.toThrow();

    // httpIntegration and the node transport do not exist on the edge, so
    // loading the server config there would be wrong.
    expect(loaded.count).toBe(0);
  });

  it("does not throw when NEXT_RUNTIME is unset", async () => {
    delete process.env.NEXT_RUNTIME;

    const mod = await import("@/instrumentation");
    await expect(mod.register()).resolves.not.toThrow();
  });
});
