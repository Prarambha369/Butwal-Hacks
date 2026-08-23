import { describe, it, expect } from "vitest";
import { cloudinaryUrl, getDiceBearUrl, getDiceBearPlaceholder, getAvatarUrl } from "@/lib/utils";

// ─── cloudinaryUrl ──────────────────────────────────────────────────────

describe("cloudinaryUrl", () => {
  it("returns empty string for null", () => {
    expect(cloudinaryUrl(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(cloudinaryUrl(undefined)).toBe("");
  });

  it("returns the URL as-is for non-Cloudinary URLs", () => {
    const url = "https://example.com/image.png";
    expect(cloudinaryUrl(url)).toBe(url);
  });

  it("injects auto-optimization transforms into Cloudinary URLs", () => {
    const input = "https://res.cloudinary.com/demo/image/upload/v1234/photo.jpg";
    const result = cloudinaryUrl(input);
    expect(result).toContain("q_auto,f_auto,w_800");
    expect(result).not.toContain("/image/upload/v1234/photo.jpg");
    expect(result).toContain("/image/upload/q_auto,f_auto,w_800/v1234/photo.jpg");
  });

  it("respects a custom width", () => {
    const input = "https://res.cloudinary.com/demo/image/upload/photo.jpg";
    const result = cloudinaryUrl(input, 400);
    expect(result).toContain("w_400");
  });

  it("handles Cloudinary URLs without version segment", () => {
    const input = "https://res.cloudinary.com/demo/image/upload/logo.svg";
    const result = cloudinaryUrl(input, 200);
    expect(result).toBe(
      "https://res.cloudinary.com/demo/image/upload/q_auto,f_auto,w_200/logo.svg"
    );
  });
});

// ─── getDiceBearPlaceholder ────────────────────────────────────────────

describe("getDiceBearPlaceholder", () => {
  it("returns a shapes SVG URL by default", () => {
    const url = getDiceBearPlaceholder("abc-123");
    expect(url).toContain("api.dicebear.com/7.x/shapes/svg");
    expect(url).toContain("seed=abc-123");
  });

  it("accepts a custom style", () => {
    const url = getDiceBearPlaceholder("test", "initials");
    expect(url).toContain("api.dicebear.com/7.x/initials/svg");
  });

  it("handles null seed with 'default' fallback", () => {
    const url = getDiceBearPlaceholder(null);
    expect(url).toContain("seed=default");
  });

  it("handles undefined seed with 'default' fallback", () => {
    const url = getDiceBearPlaceholder(undefined);
    expect(url).toContain("seed=default");
  });

  it("handles empty string seed with 'default' fallback", () => {
    const url = getDiceBearPlaceholder("");
    expect(url).toContain("seed=default");
  });

  it("lowercases and hyphenates the seed", () => {
    const url = getDiceBearPlaceholder("Photo Gallery Event");
    expect(url).toContain("seed=photo-gallery-event");
  });

  it("URL-encodes special characters", () => {
    const url = getDiceBearPlaceholder("Photo #1 & Friends");
    expect(url).toContain("seed=photo-");
    expect(url).not.toContain("#");
    expect(url).not.toContain("&");
    expect(url).not.toContain(" ");
  });

  it("trims whitespace from seed", () => {
    const url = getDiceBearPlaceholder("  My Photo  ");
    expect(url).toContain("seed=my-photo");
  });

  it("handles UUID-style seeds", () => {
    const url = getDiceBearPlaceholder("550e8400-e29b-41d4-a716-446655440000");
    expect(url).toContain("seed=550e8400-e29b-41d4-a716-446655440000");
  });

  it("works with numeric seeds", () => {
    const url = getDiceBearPlaceholder("12345");
    expect(url).toContain("seed=12345");
  });

  it("works with mixed alphanumeric seeds", () => {
    const url = getDiceBearPlaceholder("photo-2026-event");
    expect(url).toContain("seed=photo-2026-event");
  });
});

// ─── getDiceBearUrl ─────────────────────────────────────────────────────

describe("getDiceBearUrl", () => {
  it("returns a DiceBear avataaars SVG URL with the seed", () => {
    const url = getDiceBearUrl("John Doe");
    expect(url).toContain("api.dicebear.com/7.x/avataaars/svg");
    expect(url).toContain("seed=john-doe");
  });

  it("lowercases and hyphenates the seed", () => {
    const url = getDiceBearUrl("Alice Wonderland");
    expect(url).toContain("seed=alice-wonderland");
  });

  it("uses 'default' when seed is null", () => {
    const url = getDiceBearUrl(null);
    expect(url).toContain("seed=default");
  });

  it("uses 'default' when seed is undefined", () => {
    const url = getDiceBearUrl(undefined);
    expect(url).toContain("seed=default");
  });

  it("URL-encodes special characters in the seed", () => {
    const url = getDiceBearUrl("John & Jane");
    expect(url).toContain("seed=john-");
    expect(url).not.toContain(" ");
  });

  it("handles an empty string seed", () => {
    const url = getDiceBearUrl("");
    expect(url).toContain("seed=default");
  });

  it("uses avataaars style via getDiceBearPlaceholder internally", () => {
    const result = getDiceBearUrl("test-seed");
    const expected = getDiceBearPlaceholder("test-seed", "avataaars");
    expect(result).toBe(expected);
  });
});

// ─── getAvatarUrl ───────────────────────────────────────────────────────

describe("getAvatarUrl", () => {
  const cloudinaryUrlStr =
    "https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg";
  const seed = "Test User";

  it("returns a Cloudinary URL when avatarUrl is provided", () => {
    const result = getAvatarUrl(cloudinaryUrlStr, seed);
    expect(result).toBe(cloudinaryUrlStr);
  });

  it("returns DiceBear when avatarUrl is null", () => {
    const result = getAvatarUrl(null, seed);
    expect(result).toContain("api.dicebear.com/7.x/avataaars/svg");
    expect(result).toContain("seed=test-user");
  });

  it("returns DiceBear with custom seed", () => {
    const result = getAvatarUrl(null, "Alice");
    expect(result).toContain("seed=alice");
  });

  it("returns DiceBear with default seed when seed is null", () => {
    const result = getAvatarUrl(null, null);
    expect(result).toContain("seed=default");
  });

  it("returns DiceBear when avatarUrl is empty string", () => {
    const result = getAvatarUrl("", seed);
    expect(result).toContain("seed=test-user");
  });

  it("returns DiceBear when avatarUrl is undefined", () => {
    const result = getAvatarUrl(undefined, "Edge Case");
    expect(result).toContain("seed=edge-case");
  });

  it("handles all nulls gracefully", () => {
    const result = getAvatarUrl(null, null);
    expect(result).toContain("seed=default");
  });

  it("handles all undefineds gracefully", () => {
    const result = getAvatarUrl(undefined, undefined);
    expect(result).toContain("seed=default");
  });
});
