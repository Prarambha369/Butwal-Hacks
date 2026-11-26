// @vitest-environment happy-dom

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, cleanup, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import GalleryGrid, { retryDelaySeconds } from "../gallery-grid";
import type { GalleryPhoto } from "@/lib/gallery-photo";
import { fetchGalleryPage } from "@/lib/actions/gallery";

// Failure states of the gallery: where Retry appears, that nothing retries on
// its own, and that repeated failures back off. e2e/gallery-retry.spec.ts
// covers the same states in real browsers by route-blocking requests.

vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string; onError?: () => void; onLoad?: () => void }) => (
    // eslint-disable-next-line @next/next/no-img-element -- test double
    <img src={props.src} alt={props.alt} onError={props.onError} onLoad={props.onLoad} />
  ),
}));

vi.mock("next/link", () => ({
  // Record the prefetch prop so the test can assert it; never pass it to <a>.
  default: ({ prefetch, ...props }: React.ComponentProps<"a"> & { prefetch?: boolean | null }) => (
    <a data-prefetch={String(prefetch)} {...props} />
  ),
}));

vi.mock("@/lib/actions/gallery", () => ({ fetchGalleryPage: vi.fn() }));

const mockFetch = vi.mocked(fetchGalleryPage);

function photo(n: number, event = "Hack 2026"): GalleryPhoto {
  return {
    id: `00000000-0000-4000-8000-00000000000${n}`,
    url: `https://res.cloudinary.com/demo/image/upload/p${n}.jpg`,
    event,
    event_slug: "hack-2026",
    location: null,
    caption: `Photo ${n}`,
    date: "2026-01-05T10:00:00.000Z",
    span: 1,
    uploader: null,
    optimize: null,
    media_type: "image",
  };
}

const PHOTOS = [photo(1), photo(2), photo(3)];
const TOTALS = { photos: 3, videos: 0, events: 1 };

let observers: Array<{ cb: IntersectionObserverCallback }> = [];
beforeEach(() => {
  observers = [];
  mockFetch.mockReset();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      cb: IntersectionObserverCallback;
      constructor(cb: IntersectionObserverCallback) {
        this.cb = cb;
        observers.push(this);
      }
      observe() {}
      unobserve() {}
      // A disconnected observer never fires again; drop it like a browser.
      disconnect() {
        observers = observers.filter((o) => o !== this);
      }
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("retryDelaySeconds", () => {
  it("lets the first retry go at once, then doubles up to 30 s", () => {
    expect([1, 2, 3, 4, 5, 6, 7, 10].map(retryDelaySeconds)).toEqual([0, 2, 4, 8, 16, 30, 30, 30]);
  });
});

describe("GalleryGrid load-more failure", () => {
  it("shows the error and Retry below the loaded items, not above them", async () => {
    mockFetch.mockRejectedValue(new Error("offline"));
    const { container } = render(
      <GalleryGrid photos={PHOTOS} canDownload={false} totals={TOTALS} hasMore events={["Hack 2026"]} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Couldn't load more media");
    const retry = screen.getByRole("button", { name: "Try again" });

    const tiles = container.querySelectorAll('a[href^="/gallery/"]');
    const lastTile = tiles[tiles.length - 1];
    // DOCUMENT_POSITION_FOLLOWING: the panel comes after the last tile.
    expect(lastTile.compareDocumentPosition(alert) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // Message first, Retry after it.
    expect(alert.compareDocumentPosition(retry) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("never retries on its own and backs off after repeated failures", async () => {
    mockFetch.mockRejectedValue(new Error("offline"));
    render(<GalleryGrid photos={PHOTOS} canDownload={false} totals={TOTALS} hasMore />);
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    await screen.findByRole("button", { name: "Try again" });

    // Any scroll observer still connected after the failure must not send a
    // request (the sentinel is gone, so there should be none).
    expect(observers).toHaveLength(0);
    observers.forEach((o) => o.cb([{ isIntersecting: true } as IntersectionObserverEntry], o as unknown as IntersectionObserver));
    expect(mockFetch).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    const waiting = await screen.findByRole("button", { name: /Try again in 2s/ });
    expect(waiting).toBeDisabled();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("re-applies a failed filter at the bottom, under the chips", async () => {
    mockFetch.mockRejectedValue(new Error("offline"));
    render(
      <GalleryGrid photos={PHOTOS} canDownload={false} totals={TOTALS} hasMore={false} events={["Hack 2026", "Jam"]} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Jam" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load media");

    mockFetch.mockResolvedValue({ photos: [photo(4, "Jam")], hasMore: false });
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(mockFetch).toHaveBeenLastCalledWith(0, "Jam");
  });
});

describe("GalleryGrid media failure", () => {
  it("puts a Retry button at the bottom of a failed tile, outside the card link", async () => {
    render(<GalleryGrid photos={PHOTOS} canDownload={false} totals={TOTALS} hasMore={false} />);
    fireEvent.error(screen.getByAltText("Photo 2"));

    const retry = await screen.findByRole("button", { name: "Retry loading Photo 2" });
    expect(retry.closest("a")).toBeNull();
    const message = screen.getByText("Couldn't load this photo.");
    expect(message).toHaveAttribute("aria-live", "polite");
    expect(message.compareDocumentPosition(retry) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.click(retry);
    expect(screen.queryByRole("button", { name: "Retry loading Photo 2" })).not.toBeInTheDocument();
    // Remounted for a fresh request.
    expect(screen.getByAltText("Photo 2")).toBeInTheDocument();
  });

  it("shows the lightbox error with Retry under it", async () => {
    render(<GalleryGrid photos={PHOTOS} canDownload={false} totals={TOTALS} hasMore={false} />);
    fireEvent.click(screen.getAllByRole("link", { name: /Photo 1/ })[0], { button: 0 });
    const dialog = await screen.findByRole("dialog");
    fireEvent.error(within(dialog).getByAltText("Photo 1"));

    const alert = await within(dialog).findByRole("alert");
    expect(alert).toHaveTextContent("Couldn't load this photo");
    const retry = within(dialog).getByRole("button", { name: "Retry" });
    expect(alert.compareDocumentPosition(retry) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.click(retry);
    expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("GalleryGrid prefetch", () => {
  it("does not prefetch any card or section link", () => {
    const { container } = render(
      <GalleryGrid photos={PHOTOS} canDownload={false} totals={TOTALS} hasMore={false} />,
    );
    const links = container.querySelectorAll("a[data-prefetch]");
    expect(links.length).toBeGreaterThan(PHOTOS.length);
    links.forEach((a) => expect(a).toHaveAttribute("data-prefetch", "false"));
  });
});
