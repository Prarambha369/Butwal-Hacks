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

  it("signs a throttled refresh without metadata instead of re-signing the rejected fields", async () => {
    listMetadataFields.mockResolvedValue({ metadata_fields: [{ external_id: "entity_type" }] });
    const POST = await loadRoute();

    const first = await (await POST(sign({ entity_type: "avatar" }))).json();
    expect(first.metadata).toContain("entity_type=avatar");
    const retried = await (await POST(sign({ entity_type: "avatar", refresh_metadata: true }))).json();
    expect(listMetadataFields).toHaveBeenCalledTimes(1);
    expect(retried.metadata).toBeUndefined();
  });

  it("shares one in-flight lookup between concurrent requests on a cold cache", async () => {
    let resolve!: (v: unknown) => void;
    listMetadataFields.mockReturnValue(new Promise((r) => { resolve = r; }));
    const POST = await loadRoute();

    const pending = [POST(sign({ entity_type: "avatar" })), POST(sign({ entity_type: "avatar" }))];
    await Promise.resolve();
    resolve({ metadata_fields: [{ external_id: "entity_type" }] });
    const bodies = await Promise.all(pending.map(async (p) => (await p).json()));
    expect(listMetadataFields).toHaveBeenCalledTimes(1);
    for (const body of bodies) expect(body.metadata).toContain("entity_type=avatar");
  });

  it("waits out a cooldown after a failed lookup before calling the Admin API again", async () => {
    vi.useFakeTimers();
    listMetadataFields
      .mockRejectedValueOnce(new Error("admin api down"))
      .mockResolvedValue({ metadata_fields: [{ external_id: "entity_type" }] });
    const POST = await loadRoute();

    expect((await (await POST(sign({ entity_type: "avatar" }))).json()).metadata).toBeUndefined();
    expect((await (await POST(sign({ entity_type: "avatar" }))).json()).metadata).toBeUndefined();
    expect(listMetadataFields).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(31_000);
    expect((await (await POST(sign({ entity_type: "avatar" }))).json()).metadata).toContain("entity_type=avatar");
    expect(listMetadataFields).toHaveBeenCalledTimes(2);
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

describe("cloudinary-signature video renditions", () => {
  beforeEach(() => {
    listMetadataFields.mockReset();
    listMetadataFields.mockResolvedValue({ metadata_fields: [] });
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "demo";
    process.env.CLOUDINARY_API_KEY = "key";
    process.env.CLOUDINARY_API_SECRET = "secret";
  });

  it("eagerly generates every source the gallery player requests, WebM fallback included", async () => {
    const { videoSources } = await import("@/lib/cloudinary-url");
    const POST = await loadRoute();
    const body = await (await POST(sign({ entity_type: "gallery_video" }))).json();
    const eager = String(body.videoUploadParams.eager).split("|");

    const stored = "https://res.cloudinary.com/demo/video/upload/clips/a.mp4";
    for (const width of [1600, 640]) {
      for (const { src } of videoSources(stored, width)) {
        // ".../video/upload/<transform>/clips/a.<ext>" -> "<transform>/<ext>"
        const [, transform, ext] = /\/video\/upload\/([^/]+)\/.+\.(\w+)$/.exec(src) ?? [];
        expect(eager).toContain(`${transform}/${ext}`);
      }
    }
  });
});
