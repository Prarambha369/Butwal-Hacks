import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("createServiceClient", () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...OLD_ENV };
  });
  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("never throws on missing config (CI builds prerender without secrets)", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { createServiceClient } = await import("@/utils/supabase");
    expect(() => createServiceClient()).not.toThrow();
  });

  it("uses real config when present", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
    const { createServiceClient } = await import("@/utils/supabase");
    const client = createServiceClient();
    expect(client).toBeDefined();
  });
});
