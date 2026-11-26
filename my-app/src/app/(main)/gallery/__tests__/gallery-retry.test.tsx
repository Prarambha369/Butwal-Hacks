// @vitest-environment happy-dom

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, cleanup, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import GalleryGrid, { handleVideoError, retryDelaySeconds } from "../gallery-grid";
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
  // The grid reads ?event= on mount; a filter a previous test put in the URL
  // (via replaceState) must not leak into the next render.
  window.history.replaceState(null, "", "/gallery");
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
    expect(waiting).toHaveAttribute("aria-disabled", "true");
    // Pressing it during the wait sends nothing.
    fireEvent.click(waiting);
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

describe("handleVideoError (WebM fallback from #63 comes first)", () => {
  function videoWith(currentSrc: string, error: boolean) {
    const video = document.createElement("video");
    video.innerHTML =
      '<source src="a.mp4" type="video/mp4; codecs=avc1.640028"><source src="a.webm" type="video/webm">';
    Object.defineProperty(video, "currentSrc", { value: currentSrc });
    Object.defineProperty(video, "error", { value: error ? { code: 3 } : null });
    Object.defineProperty(video, "paused", { value: true });
    video.load = vi.fn();
    return video;
  }

  it("switches an undecodable MP4 to the WebM without reporting a failure", () => {
    const video = videoWith("https://res.cloudinary.com/demo/video/upload/a.mp4", true);
    const onFail = vi.fn();
    handleVideoError({ currentTarget: video }, onFail);
    expect(onFail).not.toHaveBeenCalled();
    expect(video.load).toHaveBeenCalledTimes(1);
    expect(video.querySelector("source")!.getAttribute("type")).toBe("video/x-undecodable");
  });

  it("reports a failure once the WebM has failed too", () => {
    const video = videoWith("https://res.cloudinary.com/demo/video/upload/a.webm", true);
    const onFail = vi.fn();
    handleVideoError({ currentTarget: video }, onFail);
    expect(onFail).toHaveBeenCalledTimes(1);
    expect(video.load).not.toHaveBeenCalled();
  });

  it("ignores an error event with no media error", () => {
    const onFail = vi.fn();
    handleVideoError({ currentTarget: videoWith("x.mp4", false) }, onFail);
    expect(onFail).not.toHaveBeenCalled();
  });
});

describe("GalleryGrid after a failed page", () => {
  it("does not load more from the lightbox until Retry is pressed", async () => {
    mockFetch.mockRejectedValue(new Error("offline"));
    render(<GalleryGrid photos={PHOTOS} canDownload={false} totals={TOTALS} hasMore />);
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    await screen.findByRole("button", { name: "Try again" });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Opening the last tiles and stepping near the end used to pull the next
    // page on every move, bypassing the Retry backoff.
    fireEvent.click(screen.getAllByRole("link", { name: /Photo 2/ })[0], { button: 0 });
    const dialog = await screen.findByRole("dialog");
    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(dialog).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("keeps the Retry button (and its focus) while the retry is in flight", async () => {
    mockFetch.mockRejectedValueOnce(new Error("offline"));
    render(<GalleryGrid photos={PHOTOS} canDownload={false} totals={TOTALS} hasMore />);
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    const retry = await screen.findByRole("button", { name: "Try again" });
    retry.focus();

    let resolve!: (v: { photos: GalleryPhoto[]; hasMore: boolean }) => void;
    mockFetch.mockReturnValueOnce(new Promise((r) => { resolve = r; }));
    fireEvent.click(retry);
    expect(await screen.findByRole("button", { name: "Trying again" })).toBe(retry);
    expect(retry).toHaveAttribute("aria-disabled", "true");
    expect(document.activeElement).toBe(retry);
    // Pressing it again while busy sends nothing.
    fireEvent.click(retry);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    resolve({ photos: [photo(4)], hasMore: false });
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });
});

describe("GalleryGrid video tile", () => {
  it("offers Retry when the poster fails, not a blank black box", async () => {
    const video: GalleryPhoto = {
      ...photo(5),
      url: "https://res.cloudinary.com/demo/video/upload/v1/clip.mp4",
      caption: "Demo clip",
      media_type: "video",
    };
    const { container } = render(
      <GalleryGrid photos={[video]} canDownload={false} totals={TOTALS} hasMore={false} />,
    );
    const poster = container.querySelector('a[href^="/gallery/"] img[alt=""]');
    expect(poster).not.toBeNull();
    fireEvent.error(poster!);
    expect(await screen.findByRole("button", { name: "Retry loading Demo clip" })).toBeInTheDocument();
    expect(screen.getByText("Couldn't load this video.")).toBeInTheDocument();
  });
});

describe("GalleryGrid review follow-ups", () => {
  it("re-selecting the failed filter chip waits for the backoff like Retry", async () => {
    mockFetch.mockRejectedValue(new Error("offline"));
    render(
      <GalleryGrid photos={PHOTOS} canDownload={false} totals={TOTALS} hasMore={false} events={["Hack 2026", "Jam"]} />,
    );
    const chip = screen.getByRole("button", { name: "Jam" });
    fireEvent.click(chip);
    await screen.findByRole("button", { name: "Try again" });
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByRole("button", { name: /Try again in 2s/ });
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // During the backoff the active chip sends nothing either.
    fireEvent.click(chip);
    fireEvent.click(chip);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // A different event is still allowed.
    mockFetch.mockResolvedValue({ photos: PHOTOS, hasMore: false });
    fireEvent.click(screen.getByRole("button", { name: "Hack 2026" }));
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(3));
  });

  it("clears a lightbox failure after stepping away and back once it loads", async () => {
    render(<GalleryGrid photos={PHOTOS} canDownload={false} totals={TOTALS} hasMore={false} />);
    fireEvent.click(screen.getAllByRole("link", { name: /Photo 1/ })[0], { button: 0 });
    const dialog = await screen.findByRole("dialog");
    fireEvent.error(within(dialog).getByAltText("Photo 1"));
    expect(await within(dialog).findByRole("alert")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    // Back on photo 1: a fresh load, not the stale error.
    expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.load(within(dialog).getByAltText("Photo 1"));
    expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("GalleryGrid ?event= link", () => {
  // The page is ISR-cached, so the server no longer reads ?event=; the grid
  // applies it on mount.
  it("applies a known event from the URL on mount", async () => {
    window.history.replaceState(null, "", "/gallery?event=Jam");
    mockFetch.mockResolvedValue({ photos: [photo(4, "Jam")], hasMore: false });
    render(
      <GalleryGrid photos={PHOTOS} canDownload={false} totals={TOTALS} hasMore={false} events={["Hack 2026", "Jam"]} />,
    );
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(0, "Jam"));
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("ignores an event that is not in the gallery", () => {
    window.history.replaceState(null, "", "/gallery?event=Nope");
    render(
      <GalleryGrid photos={PHOTOS} canDownload={false} totals={TOTALS} hasMore={false} events={["Hack 2026", "Jam"]} />,
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
