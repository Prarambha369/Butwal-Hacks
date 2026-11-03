import { afterEach, describe, expect, it, vi } from "vitest";
import { DEV_USER_ID, isDevAuthBypassEnabled } from "@/lib/dev-auth-bypass";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isDevAuthBypassEnabled", () => {
  it("is off unless DEV_AUTH_BYPASS is explicitly true", () => {
    // Vitest sets NODE_ENV=test, so without the opt-in this must be false —
    // the E2E suite runs `next dev` and asserts real 307 redirects.
    vi.stubEnv("DEV_AUTH_BYPASS", undefined);
    expect(isDevAuthBypassEnabled()).toBe(false);

    vi.stubEnv("DEV_AUTH_BYPASS", "1");
    expect(isDevAuthBypassEnabled()).toBe(false);

    vi.stubEnv("DEV_AUTH_BYPASS", "false");
    expect(isDevAuthBypassEnabled()).toBe(false);
  });

  it("is on for a non-production process with the opt-in set", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEV_AUTH_BYPASS", "true");
    expect(isDevAuthBypassEnabled()).toBe(true);
  });

  it("never enables in production, whatever DEV_AUTH_BYPASS says", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEV_AUTH_BYPASS", "true");
    expect(isDevAuthBypassEnabled()).toBe(false);
  });

  it("exposes one shared dev identity", () => {
    // dashboard/layout.tsx, hacker/layout.tsx and hacker/page.tsx all resolve
    // to this value; a second one is how the redirect loop happened.
    expect(DEV_USER_ID).toBe("dev-user");
  });
});
