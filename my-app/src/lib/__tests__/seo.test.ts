import { describe, it, expect } from "vitest";
import { buildPageMetadata } from "../seo";

type OpenGraphShape = {
  images?: unknown;
  siteName?: string;
  locale?: string;
  url?: string;
};
type TwitterShape = { card?: string; images?: string[] };

const base = {
  title: "Event Gallery",
  description: "Photos from Butwal Hacks hackathons.",
  path: "/gallery",
};

describe("buildPageMetadata", () => {
  it("leaves images absent and keeps the default robots when none is supplied", () => {
    const meta = buildPageMetadata(base);
    const og = meta.openGraph as OpenGraphShape | null | undefined;
    const twitter = meta.twitter as TwitterShape | null | undefined;

    expect(og?.images).toBeUndefined();
    expect(twitter?.images).toBeUndefined();
    expect(twitter?.card).toBe("summary_large_image");
    expect(meta.robots).toMatchObject({ index: true, follow: true });
  });

  it("emits the image on both openGraph and twitter when supplied", () => {
    const meta = buildPageMetadata({
      ...base,
      image: {
        url: "https://res.cloudinary.com/demo/image/upload/card.jpg",
        alt: "Hack 2026 — Photo",
        width: 1200,
        height: 630,
      },
    });
    const og = meta.openGraph as OpenGraphShape | null | undefined;
    const twitter = meta.twitter as TwitterShape | null | undefined;

    expect(og?.images).toEqual([
      {
        url: "https://res.cloudinary.com/demo/image/upload/card.jpg",
        alt: "Hack 2026 — Photo",
        width: 1200,
        height: 630,
      },
    ]);
    expect(twitter?.images).toEqual([
      "https://res.cloudinary.com/demo/image/upload/card.jpg",
    ]);
    expect(twitter?.card).toBe("summary_large_image");
    // The whole openGraph object is re-emitted, so the shared-card fields
    // survive Next's shallow replace.
    expect(og?.siteName).toBe("Butwal Hacks");
    expect(og?.locale).toBe("en_US");
  });

  it("honours a robots override", () => {
    const meta = buildPageMetadata({
      ...base,
      robots: { index: false, follow: true },
    });
    expect(meta.robots).toEqual({ index: false, follow: true });
  });
});
