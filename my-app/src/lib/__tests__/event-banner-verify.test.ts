import { describe, it, expect, vi, beforeEach } from "vitest";

const resource = vi.fn();
vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(() => ({ cloud_name: "demo-cloud" })),
    api: { resource: (...args: unknown[]) => resource(...args) },
  },
}));
vi.mock("@/lib/logger", () => ({ logger: { warn: vi.fn(), error: vi.fn() } }));

import { verifyBannerUpload } from "../event-banner-verify";
import { bannerFileError } from "../event-banner";

const SUB = "github|1000001";
const ID = `butwal-hacks/${SUB}/abc123`;
const URL_OK = `https://res.cloudinary.com/demo-cloud/image/upload/v1/butwal-hacks/github%7C1000001/abc123.jpg`;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "demo-cloud";
  process.env.CLOUDINARY_API_KEY = "test-key";
  process.env.CLOUDINARY_API_SECRET = "test-secret";
});

describe("verifyBannerUpload", () => {
  it("accepts the caller's own jpg under 5 MB and returns Cloudinary's URL", async () => {
    resource.mockResolvedValue({ public_id: ID, format: "jpg", bytes: 900_000, secure_url: URL_OK, type: "upload" });
    await expect(verifyBannerUpload(ID, SUB)).resolves.toEqual({ ok: true, publicId: ID, url: URL_OK });
  });

  it("refuses another member's upload without calling Cloudinary", async () => {
    const result = await verifyBannerUpload("butwal-hacks/auth0|someone-else/abc", SUB);
    expect(result.ok).toBe(false);
    expect(resource).not.toHaveBeenCalled();
  });

  it("refuses ids that try to climb out of the folder", async () => {
    expect((await verifyBannerUpload(`butwal-hacks/${SUB}/../x`, SUB)).ok).toBe(false);
    expect((await verifyBannerUpload("https://evil.example/x.jpg", SUB)).ok).toBe(false);
    expect((await verifyBannerUpload(42, SUB)).ok).toBe(false);
    expect(resource).not.toHaveBeenCalled();
  });

  it("refuses a format outside jpg/png/webp", async () => {
    resource.mockResolvedValue({ public_id: ID, format: "gif", bytes: 1000, secure_url: URL_OK, type: "upload" });
    expect(await verifyBannerUpload(ID, SUB)).toMatchObject({ ok: false, error: "Banners must be a JPG, PNG or WebP image." });
  });

  it("refuses a file over 5 MB", async () => {
    resource.mockResolvedValue({ public_id: ID, format: "png", bytes: 5 * 1024 * 1024 + 1, secure_url: URL_OK, type: "upload" });
    expect(await verifyBannerUpload(ID, SUB)).toMatchObject({ ok: false, error: "Banners can be at most 5 MB." });
  });

  it("refuses an id Cloudinary does not know", async () => {
    resource.mockRejectedValue(new Error("Resource not found"));
    expect((await verifyBannerUpload(ID, SUB)).ok).toBe(false);
  });
});

describe("bannerFileError (client-side check)", () => {
  it("accepts jpg, png and webp up to 5 MB", () => {
    expect(bannerFileError({ type: "image/jpeg", size: 1024 })).toBeNull();
    expect(bannerFileError({ type: "image/png", size: 5 * 1024 * 1024 })).toBeNull();
    expect(bannerFileError({ type: "image/webp", size: 10 })).toBeNull();
  });

  it("names the problem for a wrong type or an oversized file", () => {
    expect(bannerFileError({ type: "image/gif", size: 10 })).toMatch(/JPG, PNG or WebP/);
    expect(bannerFileError({ type: "application/pdf", size: 10 })).toMatch(/JPG, PNG or WebP/);
    expect(bannerFileError({ type: "image/jpeg", size: 6 * 1024 * 1024 })).toMatch(/6\.0 MB.*at most 5 MB/);
  });
});
