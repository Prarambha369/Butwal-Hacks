import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  EVENT_SHARE_BANNERS,
  absoluteBannerUrl,
  isShareBanner,
  resolveEventBanner,
  shareBannerPath,
} from "@/lib/event-share-banners";
import { SITE_URL } from "@/lib/constants";

describe("event share banners", () => {
  it("maps each partner event slug to its banner in public/events", () => {
    expect(shareBannerPath("hackday-butwal")).toBe("/events/hackday-butwal.png");
    expect(shareBannerPath("daydream-butwal")).toBe("/events/daydream-butwal.png");
    expect(shareBannerPath("cyberutsav-lumbini")).toBe("/events/cyberutsav-lumbini.png");
  });

  it("is null for unknown slugs and inherited keys", () => {
    expect(shareBannerPath("some-other-event")).toBeNull();
    expect(shareBannerPath("constructor")).toBeNull();
    expect(shareBannerPath(undefined)).toBeNull();
  });

  it("ships every mapped file (copied, not hotlinked)", () => {
    for (const file of Object.values(EVENT_SHARE_BANNERS)) {
      expect(existsSync(path.join(process.cwd(), "public", file))).toBe(true);
    }
  });

  it("prefers an uploaded banner, then the share banner", () => {
    const uploaded = "https://res.cloudinary.com/demo/image/upload/v1/b.jpg";
    expect(resolveEventBanner("hackday-butwal", uploaded)).toBe(uploaded);
    expect(resolveEventBanner("hackday-butwal", "  ")).toBe("/events/hackday-butwal.png");
    expect(resolveEventBanner("hackday-butwal", null)).toBe("/events/hackday-butwal.png");
    expect(resolveEventBanner("other", "")).toBeNull();
  });

  it("recognises share banners and makes their URLs absolute", () => {
    expect(isShareBanner("/events/daydream-butwal.png")).toBe(true);
    expect(isShareBanner("https://res.cloudinary.com/demo/image/upload/b.jpg")).toBe(false);
    expect(isShareBanner(null)).toBe(false);
    expect(absoluteBannerUrl("/events/daydream-butwal.png")).toBe(`${SITE_URL}/events/daydream-butwal.png`);
    expect(absoluteBannerUrl("https://x.test/a.png")).toBe("https://x.test/a.png");
  });
});
