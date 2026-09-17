import { describe, it, expect } from "vitest";
import { cloudinaryUrl, cloudinaryDownloadUrl } from "../cloudinary-url";

const PLAIN = "https://res.cloudinary.com/demo/image/upload/sample.jpg";
const VERSIONED = "https://res.cloudinary.com/demo/image/upload/v123/sample.jpg";
const FOLDER = "https://res.cloudinary.com/demo/image/upload/butwal-hacks/u1/photo.jpg";
const TRANSFORMED = "https://res.cloudinary.com/demo/image/upload/w_600,q_auto,f_auto/sample.jpg";

describe("cloudinaryUrl", () => {
  it("injects a sized delivery transform into plain asset URLs", () => {
    expect(cloudinaryUrl(PLAIN, 600)).toBe(
      "https://res.cloudinary.com/demo/image/upload/w_600,q_auto,f_auto/sample.jpg",
    );
  });

  it("handles versioned and folder paths", () => {
    expect(cloudinaryUrl(VERSIONED, 800)).toContain("w_800,q_auto,f_auto/v123/sample.jpg");
    expect(cloudinaryUrl(FOLDER, 400)).toContain("w_400,q_auto,f_auto/butwal-hacks/u1/photo.jpg");
  });

  it("rounds widths", () => {
    expect(cloudinaryUrl(PLAIN, 599.7)).toContain("w_600,");
  });

  it("leaves already-transformed URLs alone", () => {
    expect(cloudinaryUrl(TRANSFORMED, 300)).toBe(TRANSFORMED);
  });
});

describe("cloudinaryDownloadUrl", () => {
  it("inserts fl_attachment for forced best-quality download", () => {
    expect(cloudinaryDownloadUrl(PLAIN)).toBe(
      "https://res.cloudinary.com/demo/image/upload/fl_attachment/sample.jpg",
    );
  });

  it("handles versioned and folder paths", () => {
    expect(cloudinaryDownloadUrl(VERSIONED)).toContain("fl_attachment/v123/sample.jpg");
    expect(cloudinaryDownloadUrl(FOLDER)).toContain("fl_attachment/butwal-hacks/u1/photo.jpg");
  });

  it("is idempotent and passes through non-Cloudinary URLs", () => {
    const once = cloudinaryDownloadUrl(PLAIN);
    expect(cloudinaryDownloadUrl(once)).toBe(once);
    expect(cloudinaryDownloadUrl("https://images.unsplash.com/photo-123")).toBe(
      "https://images.unsplash.com/photo-123",
    );
    expect(cloudinaryDownloadUrl("")).toBe("");
  });
});

describe("cloudinaryUrl passthrough", () => {
  it("passes through videos, external URLs, and garbage", () => {
    expect(cloudinaryUrl("https://res.cloudinary.com/demo/video/upload/clip.mp4", 600))
      .toBe("https://res.cloudinary.com/demo/video/upload/clip.mp4");
    expect(cloudinaryUrl("https://images.unsplash.com/photo-123", 600))
      .toBe("https://images.unsplash.com/photo-123");
    expect(cloudinaryUrl("", 600)).toBe("");
    expect(cloudinaryUrl(PLAIN, 0)).toBe(PLAIN);
    expect(cloudinaryUrl(PLAIN, NaN)).toBe(PLAIN);
  });
});
