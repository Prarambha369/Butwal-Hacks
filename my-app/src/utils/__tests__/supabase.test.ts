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

  it("fails fast without network when unconfigured", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { createServiceClient } = await import("@/utils/supabase");
    const client = createServiceClient();
    const start = Date.now();
    const { data, error } = await client
      .from("profiles")
      .select("*", { count: "exact", head: true });
    expect(Date.now() - start).toBeLessThan(1000);
    expect(data).toBeNull();
    expect(error).toMatchObject({ code: "SUPABASE_NOT_CONFIGURED" });
  });

  it("uses real config when present", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
    const { createServiceClient } = await import("@/utils/supabase");
    const client = createServiceClient();
    expect(client).toBeDefined();
  });

  it("falls back to the names Vercel's Supabase integration provisions", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.SUPABASE_URL = "https://integration.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "integration-secret";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { supabaseServerUrl, serviceRoleKey, createServiceClient } = await import(
      "@/utils/supabase"
    );

    // Production only has the integration-managed names, so a lookup that
    // ignored them would silently fall through to the inert client.
    expect(supabaseServerUrl()).toBe("https://integration.supabase.co");
    expect(serviceRoleKey()).toBe("integration-secret");

    createServiceClient();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("prefers the explicit names over the integration fallback", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://explicit.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "explicit-secret";
    process.env.SUPABASE_URL = "https://integration.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "integration-secret";
    const { supabaseServerUrl, serviceRoleKey } = await import("@/utils/supabase");
    expect(supabaseServerUrl()).toBe("https://explicit.supabase.co");
    expect(serviceRoleKey()).toBe("explicit-secret");
  });
});
