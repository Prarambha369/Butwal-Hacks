// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast: toastMock }));

import GoogleCalendarSettings from "@/components/dashboard/google-calendar-settings";

/** A canned response body. `status` forces a non-200; other keys are the JSON. */
type RouteResponse = { status?: number } & Record<string, unknown>;

/**
 * Canned responses keyed by a URL fragment. Anything not matched returns an
 * `unmatched` body, so an unexpected call is visible rather than silent.
 */
function mockFetch(routes: Record<string, RouteResponse>) {
  const fn = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const key = Object.keys(routes).find((k) => url.includes(k));
    const value: RouteResponse = key ? routes[key] : { error: "unmatched" };
    return {
      ok: (value.status ?? 200) < 400,
      status: value.status ?? 200,
      json: async () => value,
    } as Response;
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

const assignMock = vi.fn();
const replaceStateMock = vi.fn();

function setLocation({ search = "" } = {}) {
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: {
      pathname: "/dashboard/profile",
      search,
      href: `http://localhost:3000/dashboard/profile${search}`,
      assign: assignMock,
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  setLocation();
  replaceStateMock.mockClear();
  window.history.replaceState = replaceStateMock as unknown as typeof window.history.replaceState;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("GoogleCalendarSettings", () => {
  it("shows a loading state before status resolves", () => {
    mockFetch({ "/status": { connected: false } });
    render(<GoogleCalendarSettings />);
    expect(screen.getByText(/Checking calendar connection/i)).toBeInTheDocument();
  });

  it("offers Connect when not connected, and states the one-way promise", async () => {
    mockFetch({ "/status": { connected: false } });
    render(<GoogleCalendarSettings />);

    expect(await screen.findByRole("button", { name: /connect google calendar/i })).toBeInTheDocument();
    // The never-delete guarantee must be visible, not merely implied.
    expect(screen.getByText(/never read, move, or delete/i)).toBeInTheDocument();
  });

  it("navigates to the consent URL on connect", async () => {
    mockFetch({
      "/status": { connected: false },
      "/connect": { url: "https://accounts.google.com/o/oauth2/v2/auth?x=1" },
    });
    render(<GoogleCalendarSettings />);

    fireEvent.click(await screen.findByRole("button", { name: /connect google calendar/i }));

    await waitFor(() =>
      expect(assignMock).toHaveBeenCalledWith("https://accounts.google.com/o/oauth2/v2/auth?x=1")
    );
  });

  it("surfaces a connect failure as a toast, not a crash", async () => {
    mockFetch({
      "/status": { connected: false },
      "/connect": { status: 400, error: "Invalid provider." },
    });
    render(<GoogleCalendarSettings />);

    fireEvent.click(await screen.findByRole("button", { name: /connect google calendar/i }));

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Invalid provider."));
    expect(assignMock).not.toHaveBeenCalled();
  });

  it("shows connection details and the sync/disconnect controls when connected", async () => {
    mockFetch({
      "/status": {
        connected: true,
        googleEmail: "user@example.com",
        lastSyncedAt: "2026-02-18T04:15:00.000Z",
        syncedEventCount: 7,
        lastSyncError: null,
      },
    });
    render(<GoogleCalendarSettings />);

    expect(await screen.findByText("user@example.com")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sync now/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /disconnect/i })).toBeInTheDocument();
    // The connected-state copy restates the never-delete guarantee.
    expect(screen.getByText(/never delete anything/i)).toBeInTheDocument();
  });

  it("reports per-action counts after a manual sync", async () => {
    mockFetch({
      "/status": { connected: true, syncedEventCount: 1, googleEmail: "a@b.c" },
      "/sync": { ok: true, counts: { create: 2, update: 1, skip: 3, orphan: 0 }, failures: [] },
    });
    render(<GoogleCalendarSettings />);

    fireEvent.click(await screen.findByRole("button", { name: /sync now/i }));

    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith("Synced: 2 added, 1 updated, 3 unchanged.")
    );
  });

  it("prompts to reconnect when the grant was revoked and disables syncing", async () => {
    mockFetch({ "/status": { connected: true, lastSyncError: "revoked", googleEmail: "a@b.c" } });
    render(<GoogleCalendarSettings />);

    expect(await screen.findByText(/revoked access/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reconnect/i })).toBeInTheDocument();
    // Syncing cannot work without a grant.
    expect(screen.getByRole("button", { name: /sync now/i })).toBeDisabled();
  });

  it("warns that events stay in the calendar when disconnecting", async () => {
    // Typed with a parameter so the recorded call args are inspectable.
    const confirmSpy = vi.fn((_message: string) => true);
    vi.stubGlobal("confirm", confirmSpy);
    mockFetch({
      "/status": { connected: true, googleEmail: "a@b.c" },
      "/disconnect": { success: true, message: "Google Calendar disconnected." },
    });
    render(<GoogleCalendarSettings />);

    fireEvent.click(await screen.findByRole("button", { name: /disconnect/i }));

    await waitFor(() => expect(confirmSpy).toHaveBeenCalled());
    // The prompt must be explicit that nothing is deleted on Google's side.
    expect(confirmSpy.mock.calls[0][0]).toMatch(/stay there/i);
  });

  it("does not call disconnect when the user cancels the prompt", async () => {
    vi.stubGlobal("confirm", vi.fn((_message: string) => false));
    const fn = mockFetch({ "/status": { connected: true, googleEmail: "a@b.c" } });
    render(<GoogleCalendarSettings />);

    fireEvent.click(await screen.findByRole("button", { name: /disconnect/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: /disconnect/i })).toBeInTheDocument());
    expect(fn.mock.calls.filter((c) => String(c[0]).includes("/disconnect"))).toHaveLength(0);
  });

  it("explains unavailability instead of showing a broken Connect button", async () => {
    mockFetch({ "/status": { status: 503, error: "not configured" } });
    render(<GoogleCalendarSettings />);

    expect(await screen.findByText(/isn't available yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /connect google calendar/i })).toBeNull();
  });

  it("surfaces a status failure with a retry affordance", async () => {
    mockFetch({ "/status": { status: 500, error: "Failed to read your calendar connection." } });
    render(<GoogleCalendarSettings />);

    expect(await screen.findByText("Failed to read your calendar connection.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("announces the OAuth callback and scrubs the query string", async () => {
    setLocation({ search: "?gcal=connected" });
    mockFetch({ "/status": { connected: true, googleEmail: "a@b.c" } });
    render(<GoogleCalendarSettings />);

    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith("Google Calendar connected")
    );
    expect(replaceStateMock).toHaveBeenCalledWith({}, "", "/dashboard/profile");
  });

  it("never renders a 401 as a connected calendar", async () => {
    mockFetch({ "/status": { status: 401, error: "Unauthorized" } });
    render(<GoogleCalendarSettings />);

    expect(await screen.findByText(/please sign in/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sync now/i })).toBeNull();
  });
});
