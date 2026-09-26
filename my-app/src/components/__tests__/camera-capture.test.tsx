// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import CameraCapture from "@/components/camera-capture";

/**
 * A camera permission prompt can stay pending for a long time, and the user can
 * hit "Try Again" while it is still pending. Without a generation counter,
 * whichever getUserMedia promise resolved last won: an abandoned request could
 * hijack the preview, and its track was never stopped, leaving the camera light
 * on with nothing on screen.
 *
 * These tests drive a getUserMedia they control, so a request can be left
 * unresolved on purpose and resolved after the timeout or after a retry.
 */
describe("CameraCapture overlapping getUserMedia", () => {
  /** A MediaStream stand-in whose track records whether it was stopped. */
  function makeStream() {
    const track = { stop: vi.fn(), kind: "video" };
    return { stream: { getTracks: () => [track] } as unknown as MediaStream, track };
  }

  /** A getUserMedia whose resolution each test controls. */
  function deferredGetUserMedia() {
    const pending: Array<(s: MediaStream) => void> = [];
    const getUserMedia = vi.fn(
      () =>
        new Promise<MediaStream>((resolve) => {
          pending.push(resolve);
        })
    );
    return { getUserMedia, resolveRequest: (i: number, s: MediaStream) => pending[i](s) };
  }

  function stubMediaDevices(value: unknown) {
    Object.defineProperty(navigator, "mediaDevices", { value, configurable: true });
  }

  /** Let the 12s startup budget expire, flushing the microtasks it releases. */
  async function expireStartupBudget() {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(12_000);
    });
  }

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete (navigator as { mediaDevices?: unknown }).mediaDevices;
  });

  it("stops a stream that resolves after the startup timeout", async () => {
    const late = makeStream();
    const { getUserMedia, resolveRequest } = deferredGetUserMedia();
    stubMediaDevices({ getUserMedia });

    render(<CameraCapture onCapture={vi.fn()} onClose={vi.fn()} />);

    // The budget expires while getUserMedia is still pending.
    await expireStartupBudget();
    expect(screen.getByText(/taking too long/i)).toBeInTheDocument();

    // The abandoned request now resolves. Its track must be stopped rather
    // than attached to the preview.
    await act(async () => {
      resolveRequest(0, late.stream);
      await Promise.resolve();
    });

    expect(late.track.stop).toHaveBeenCalled();
  });

  it("does not let an abandoned request hijack the preview after a retry", async () => {
    const abandoned = makeStream();
    const fresh = makeStream();
    const { getUserMedia, resolveRequest } = deferredGetUserMedia();
    stubMediaDevices({ getUserMedia });

    render(<CameraCapture onCapture={vi.fn()} onClose={vi.fn()} />);

    // The first request is still pending when the user gives up and retries.
    await expireStartupBudget();
    await act(async () => {
      screen.getByRole("button", { name: /try again/i }).click();
      await Promise.resolve();
    });
    expect(getUserMedia).toHaveBeenCalledTimes(2);

    // Retry's request wins...
    await act(async () => {
      resolveRequest(1, fresh.stream);
      await Promise.resolve();
    });
    // ...and the first one, resolving late, is discarded rather than shown.
    await act(async () => {
      resolveRequest(0, abandoned.stream);
      await Promise.resolve();
    });

    expect(abandoned.track.stop).toHaveBeenCalled();
    expect(fresh.track.stop).not.toHaveBeenCalled();
  });

  it("explains the failure when the browser exposes no camera", async () => {
    stubMediaDevices(undefined);

    render(<CameraCapture onCapture={vi.fn()} onClose={vi.fn()} />);
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText(/does not support camera capture/i)).toBeInTheDocument();
  });

  it("offers a retry after a failure", async () => {
    stubMediaDevices({ getUserMedia: vi.fn().mockRejectedValue(new DOMException("x", "NotAllowedError")) });

    render(<CameraCapture onCapture={vi.fn()} onClose={vi.fn()} />);
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText(/access denied/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });
});
