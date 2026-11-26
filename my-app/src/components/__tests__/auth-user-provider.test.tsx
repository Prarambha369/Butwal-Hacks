// @vitest-environment happy-dom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { AuthUserProvider, PROFILE_RETRY_DELAYS_MS, useAuthUser } from "../auth-user-provider";

function Probe() {
  const { user, isLoading } = useAuthUser();
  return <p>{isLoading ? "loading" : user ? `user:${user.sub}` : "signed-out"}</p>;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("AuthUserProvider", () => {
  it("reads the profile once and shares the signed-in user", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ sub: "auth0|1" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <AuthUserProvider>
        <Probe />
        <Probe />
      </AuthUserProvider>,
    );
    await waitFor(() => expect(screen.getAllByText("user:auth0|1")).toHaveLength(2));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/auth/profile", expect.anything());
  });

  it("treats a 401 as signed out and never asks again", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const fetchMock = vi.fn(async () => new Response("Unauthorized", { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <AuthUserProvider>
        <Probe />
      </AuthUserProvider>,
    );
    await waitFor(() => expect(screen.getByText("signed-out")).toBeInTheDocument());
    // SWR used to retry this on a backoff (5 s, 10 s, ...) for as long as
    // the tab stayed open.
    await vi.advanceTimersByTimeAsync(120_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("treats a 204 as signed out", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));
    render(
      <AuthUserProvider>
        <Probe />
      </AuthUserProvider>,
    );
    expect(await screen.findByText("signed-out")).toBeInTheDocument();
  });

  it("retries a failed probe a fixed number of times, staying in loading", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("network"))
      .mockResolvedValueOnce(new Response("boom", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ sub: "auth0|2" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <AuthUserProvider>
        <Probe />
      </AuthUserProvider>,
    );
    // A blip must not show a signed-in visitor the signed-out UI.
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(screen.getByText("loading")).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(PROFILE_RETRY_DELAYS_MS[0]);
    await vi.advanceTimersByTimeAsync(PROFILE_RETRY_DELAYS_MS[1]);
    expect(await screen.findByText("user:auth0|2")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });

  it("gives up after the last retry and settles as signed out", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const fetchMock = vi.fn(async () => new Response("boom", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <AuthUserProvider>
        <Probe />
      </AuthUserProvider>,
    );
    await vi.advanceTimersByTimeAsync(60_000);
    expect(await screen.findByText("signed-out")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(PROFILE_RETRY_DELAYS_MS.length + 1);
    await vi.advanceTimersByTimeAsync(120_000);
    expect(fetchMock).toHaveBeenCalledTimes(PROFILE_RETRY_DELAYS_MS.length + 1);
    vi.useRealTimers();
  });
});
