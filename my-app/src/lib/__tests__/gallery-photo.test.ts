import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/utils/supabase", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { createServiceClient } from "@/utils/supabase";
import { getGalleryPhoto } from "@/lib/gallery-photo";

const mockedCreateServiceClient = createServiceClient as unknown as ReturnType<typeof vi.fn>;

const UUID = "3f6c2f0e-5c2b-4c47-9d3f-0e9b3a6f1a2c";

/**
 * Chainable PostgREST query-builder mock. Every builder method returns the
 * chain; only `.maybeSingle()` resolves, which is the terminal step the helper
 * uses.
 */
function mockDb(result: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle,
  };
  const from = vi.fn(() => chain);
  mockedCreateServiceClient.mockReturnValue({
    from,
  } as unknown as ReturnType<typeof createServiceClient>);
  return { from, ...chain };
}

beforeEach(() => {
  mockedCreateServiceClient.mockReset();
});

describe("getGalleryPhoto", () => {
  it("returns null for a non-UUID id without touching the database", async () => {
    expect(await getGalleryPhoto("not-a-uuid")).toBeNull();
    expect(await getGalleryPhoto("")).toBeNull();
    expect(mockedCreateServiceClient).not.toHaveBeenCalled();
  });

  it("maps an approved row to GalleryPhoto", async () => {
    const { from, eq } = mockDb({
      data: {
        id: UUID,
        url: "https://res.cloudinary.com/demo/image/upload/photo.jpg",
        span: 2,
        optimized_transform: "q_auto,f_auto",
        created_at: "2026-01-05T10:00:00.000Z",
        media_type: "image",
        duration_seconds: null,
        events: { id: "e1", title: "Hack 2026", slug: "hack-2026" },
        profiles: { full_name: "Asha K" },
      },
      error: null,
    });

    const photo = await getGalleryPhoto(UUID);

    expect(from).toHaveBeenCalledWith("photos");
    expect(eq).toHaveBeenCalledWith("id", UUID);
    expect(eq).toHaveBeenCalledWith("status", "approved");
    expect(photo).toMatchObject({
      id: UUID,
      url: "https://res.cloudinary.com/demo/image/upload/photo.jpg",
      event: "Hack 2026",
      event_slug: "hack-2026",
      date: "2026-01-05T10:00:00.000Z",
      span: 2,
      uploader: "Asha K",
      optimize: "q_auto,f_auto",
      media_type: "image",
    });
    expect(photo?.duration).toBeUndefined();
  });

  it("returns null when no approved row exists", async () => {
    mockDb({ data: null, error: null });
    expect(await getGalleryPhoto(UUID)).toBeNull();
  });

  it("throws on a PostgREST error so an outage is not a mass 404", async () => {
    const error = { message: "connection refused", code: "08006" };
    mockDb({ data: null, error });
    await expect(getGalleryPhoto(UUID)).rejects.toBe(error);
  });
});
