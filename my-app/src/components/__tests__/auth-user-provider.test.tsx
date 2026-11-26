// @vitest-environment happy-dom

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { AuthUserProvider, useAuthUser } from "../auth-user-provider";

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

  it("treats a network failure or 204 as signed out", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));
    render(
      <AuthUserProvider>
        <Probe />
      </AuthUserProvider>,
    );
    expect(await screen.findByText("signed-out")).toBeInTheDocument();
  });
});
