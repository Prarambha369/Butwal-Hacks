// @vitest-environment happy-dom

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import GalleryGrid from "../gallery-grid";
import type { GalleryPhoto } from "@/lib/gallery-photo";

// The gallery's whole point is that each tile is addressable, so this renders
// the real grid and reads the anchors it produces. The routes themselves are
// covered by e2e/gallery-share.spec.ts; this covers the markup that feeds them.

vi.mock("next/image", () => ({
  // next/image needs the Next runtime (and its loader); a plain img is enough
  // to render the card.
  default: (props: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- test double
    <img src={props.src} alt={props.alt} />
  ),
}));

vi.mock("next/link", () => ({
  default: (props: React.ComponentProps<"a">) => <a {...props} />,
}));

// The grid imports server actions for paging; nothing here triggers a fetch.
vi.mock("@/lib/actions/gallery", () => ({ fetchGalleryPage: vi.fn() }));

const IMAGE_ID = "3f6c2f0e-5c2b-4c47-9d3f-0e9b3a6f1a2c";
const VIDEO_ID = "9a1d4c0b-1f2e-4a3b-8c4d-5e6f7a8b9c0d";

const photos: GalleryPhoto[] = [
  {
    id: IMAGE_ID,
    url: "https://res.cloudinary.com/demo/image/upload/hack.jpg",
    event: "Hack 2026",
    event_slug: "hack-2026",
    date: "2026-01-05T10:00:00.000Z",
    span: 1,
    uploader: "Asha K",
    optimize: null,
    media_type: "image",
  },
  {
    id: VIDEO_ID,
    url: "https://res.cloudinary.com/demo/video/upload/daydream.mov",
    event: "Hack 2026",
    event_slug: "hack-2026",
    date: "2026-01-06T10:00:00.000Z",
    span: 1,
    uploader: null,
    optimize: null,
    media_type: "video",
    duration: 12,
  },
];

// ScrollReveal observes each tile; happy-dom has no IntersectionObserver.
beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("GalleryGrid share links", () => {
  it("links every tile to its own photo URL", () => {
    render(
      <GalleryGrid
        photos={photos}
        canDownload={false}
        totals={{ photos: 1, videos: 1, events: 1 }}
        hasMore={false}
        events={["Hack 2026"]}
      />,
    );

    const hrefs = Array.from(
      document.querySelectorAll<HTMLAnchorElement>('a[href^="/gallery/"]'),
    ).map((anchor) => anchor.getAttribute("href"));

    expect(hrefs).toEqual([`/gallery/${IMAGE_ID}`, `/gallery/${VIDEO_ID}`]);
    // Videos are addressable too, and no two tiles share a URL.
    expect(new Set(hrefs).size).toBe(photos.length);
  });
});
