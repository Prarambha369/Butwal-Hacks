import { beforeEach, describe, expect, it, vi } from "vitest";

const listMetadataFields = vi.fn();

vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(() => ({ cloud_name: "demo" })),
    api: { list_metadata_fields: (...args: unknown[]) => listMetadataFields(...args) },
    utils: { api_sign_request: vi.fn(() => "sig") },
  },
}));
vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: vi.fn(async () => ({ user: { sub: "auth0|u1" } })) },
}));
vi.mock("@/lib/rate-limiter", () => ({
  withRateLimit: vi.fn((handler) => handler),
}));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("@/utils/supabase", () => ({ createServiceClient: vi.fn() }));

function sign(body: Record<string, unknown>) {
  return new Request("http://localhost/api/cloudinary-signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function loadRoute() {
  vi.resetModules();
  return (await import("../cloudinary-signature/route")).POST as (req: Request) => Promise<Response>;
}

describe("cloudinary-signature metadata field cache", () => {
  beforeEach(() => {
    vi.useRealTimers();
    listMetadataFields.mockReset();
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "demo";
    process.env.CLOUDINARY_API_KEY = "key";
    process.env.CLOUDINARY_API_SECRET = "secret";
  });

  it("drops a field deleted after the cache filled once the client asks for a refresh", async () => {
    vi.useFakeTimers();
    listMetadataFields
      .mockResolvedValueOnce({ metadata_fields: [{ external_id: "uploader_auth0_id" }, { external_id: "entity_type" }] })
      .mockResolvedValueOnce({ metadata_fields: [{ external_id: "entity_type" }] });
    const POST = await loadRoute();

    const first = await (await POST(sign({ entity_type: "avatar" }))).json();
    expect(first.metadata).toContain("uploader_auth0_id=");

    vi.advanceTimersByTime(31_000);
    const retried = await (await POST(sign({ entity_type: "avatar", refresh_metadata: true }))).json();
    expect(listMetadataFields).toHaveBeenCalledTimes(2);
    expect(retried.metadata).not.toContain("uploader_auth0_id");
    expect(retried.metadata).toContain("entity_type=avatar");
  });

  it("serves the cache without a refresh flag, and throttles refreshes", async () => {
    listMetadataFields.mockResolvedValue({ metadata_fields: [{ external_id: "entity_type" }] });
    const POST = await loadRoute();

    await POST(sign({ entity_type: "avatar" }));
    await POST(sign({ entity_type: "avatar" }));
    // Within the minimum refresh age, a refresh request still uses the cache.
    await POST(sign({ entity_type: "avatar", refresh_metadata: true }));
    expect(listMetadataFields).toHaveBeenCalledTimes(1);
  });

  it("never treats refresh_metadata as a metadata field", async () => {
    listMetadataFields.mockResolvedValue({
      metadata_fields: [{ external_id: "entity_type" }, { external_id: "refresh_metadata" }],
    });
    const POST = await loadRoute();
    const body = await (await POST(sign({ entity_type: "avatar", refresh_metadata: true }))).json();
    expect(body.metadata ?? "").not.toContain("refresh_metadata");
  });
});
