// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ─── Store presence event callbacks so tests can simulate events ───
type PresenceCallback = (payload: { key: string } & Record<string, unknown>) => void;
type SyncCallback = () => void;
let onSyncCb: SyncCallback | null = null;
let onJoinCb: PresenceCallback | null = null;
let onLeaveCb: PresenceCallback | null = null;
let mockSubscribeStatusCb: ((status: string) => void) | null = null;

// Singleton channel mock — .on() must return the same object for chaining
const channelMock = {
  on: vi.fn((_eventType: string, config: { event: string }, callback: unknown) => {
    if (_eventType === "presence" && config.event === "sync") {
      onSyncCb = callback as SyncCallback;
    } else if (_eventType === "presence" && config.event === "join") {
      onJoinCb = callback as PresenceCallback;
    } else if (_eventType === "presence" && config.event === "leave") {
      onLeaveCb = callback as PresenceCallback;
    }
    return channelMock;
  }),
  subscribe: vi.fn((callback: (status: string) => void) => {
    mockSubscribeStatusCb = callback;
  }),
  track: vi.fn().mockResolvedValue(undefined),
  untrack: vi.fn().mockResolvedValue(undefined),
  presenceState: vi.fn().mockReturnValue({}),
};

// ─── Mocks ─────────────────────────────────────────────────────────

vi.mock("@/utils/supabase/client", () => ({
  createClient: vi.fn(() => ({
    channel: vi.fn(() => channelMock),
  })),
}));

vi.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: vi.fn(),
}));

import { createClient } from "@/utils/supabase/client";
import { useUser } from "@auth0/nextjs-auth0/client";

const mockedCreateClient = createClient as any;
const mockedUseUser = useUser as any;

// ═══════════════════════════════════════════════════════════════════
// usePresence
// ═══════════════════════════════════════════════════════════════════

describe("usePresence", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    onSyncCb = null;
    onJoinCb = null;
    onLeaveCb = null;
    mockSubscribeStatusCb = null;

    // Restore mock implementations after clearAllMocks
    channelMock.on.mockImplementation((_eventType: string, config: { event: string }, callback: unknown) => {
      if (_eventType === "presence" && config.event === "sync") {
        onSyncCb = callback as SyncCallback;
      } else if (_eventType === "presence" && config.event === "join") {
        onJoinCb = callback as PresenceCallback;
      } else if (_eventType === "presence" && config.event === "leave") {
        onLeaveCb = callback as PresenceCallback;
      }
      return channelMock;
    });
    channelMock.subscribe.mockImplementation((cb: (status: string) => void) => { mockSubscribeStatusCb = cb; });
    (channelMock.track as any).mockResolvedValue(undefined);
    (channelMock.untrack as any).mockResolvedValue(undefined);
    (channelMock.presenceState as any).mockReturnValue({});

    mockedCreateClient.mockReturnValue({
      channel: vi.fn(() => channelMock),
    });

    mockedUseUser.mockReturnValue({ user: { sub: "auth0|12345", email: "test@test.com" }, isLoading: false });
  });

  afterEach(async () => {
    vi.resetModules();
  });

  it("returns an empty Set initially when no presence data exists", async () => {
    const { usePresence } = await import("../use-presence");
    const { result } = renderHook(() => usePresence());
    expect(result.current).toBeInstanceOf(Set);
    expect(result.current.size).toBe(0);
  });

  it("subscribes to the bh-online channel", async () => {
    const { usePresence } = await import("../use-presence");
    renderHook(() => usePresence());
    expect(mockedCreateClient().channel).toHaveBeenCalledWith("bh-online");
  });

  it("tracks presence when user is signed in and channel subscribes", async () => {
    const { usePresence } = await import("../use-presence");
    renderHook(() => usePresence());

    act(() => { mockSubscribeStatusCb?.("SUBSCRIBED"); });

    expect(channelMock.track).toHaveBeenCalledWith({
      online_at: expect.any(String),
      user_id: "auth0|12345",
    });
  });

  it("does not track presence when user is not signed in", async () => {
    mockedUseUser.mockReturnValue({ user: null, isLoading: false });
    const { usePresence } = await import("../use-presence");
    renderHook(() => usePresence());

    act(() => { mockSubscribeStatusCb?.("SUBSCRIBED"); });

    expect(channelMock.track).not.toHaveBeenCalled();
  });

  it("untracks presence when user signs out", async () => {
    const { usePresence } = await import("../use-presence");
    const { rerender } = renderHook(() => usePresence());

    act(() => { mockSubscribeStatusCb?.("SUBSCRIBED"); });
    expect(channelMock.track).toHaveBeenCalledTimes(2);

    mockedUseUser.mockReturnValue({ user: null, isLoading: false });
    rerender();

    expect(channelMock.untrack).toHaveBeenCalledTimes(1);
  });

  it("updates online IDs on presence sync event", async () => {
    const { usePresence } = await import("../use-presence");
    const { result } = renderHook(() => usePresence());

    (channelMock.presenceState as any).mockReturnValue({ "auth0|user1": {}, "auth0|user2": {} });
    act(() => { onSyncCb?.(); });

    expect(result.current.has("auth0|user1")).toBe(true);
    expect(result.current.has("auth0|user2")).toBe(true);
    expect(result.current.size).toBe(2);
  });

  it("adds a new user ID on presence join event", async () => {
    const { usePresence } = await import("../use-presence");
    const { result } = renderHook(() => usePresence());

    (channelMock.presenceState as any).mockReturnValue({ "auth0|user1": {} });
    act(() => { onSyncCb?.(); });
    expect(result.current.size).toBe(1);

    act(() => { onJoinCb?.({ key: "auth0|user2" }); });

    expect(result.current.has("auth0|user2")).toBe(true);
    expect(result.current.size).toBe(2);
  });

  it("removes a user ID on presence leave event", async () => {
    const { usePresence } = await import("../use-presence");
    const { result } = renderHook(() => usePresence());

    (channelMock.presenceState as any).mockReturnValue({ "auth0|user1": {}, "auth0|user2": {} });
    act(() => { onSyncCb?.(); });
    expect(result.current.size).toBe(2);

    act(() => { onLeaveCb?.({ key: "auth0|user1" }); });

    expect(result.current.has("auth0|user1")).toBe(false);
    expect(result.current.has("auth0|user2")).toBe(true);
    expect(result.current.size).toBe(1);
  });

  it("maintains singleton channel across multiple hook calls", async () => {
    const { usePresence } = await import("../use-presence");
    renderHook(() => usePresence());
    renderHook(() => usePresence());

    expect(mockedCreateClient().channel).toHaveBeenCalledTimes(1);
  });

  it("updates online IDs reactively via useSyncExternalStore", async () => {
    const { usePresence } = await import("../use-presence");
    const { result } = renderHook(() => usePresence());

    (channelMock.presenceState as any).mockReturnValue({ "auth0|alice": {} });
    act(() => { onSyncCb?.(); });
    expect(result.current.has("auth0|alice")).toBe(true);

    (channelMock.presenceState as any).mockReturnValue({ "auth0|bob": {} });
    act(() => { onSyncCb?.(); });

    expect(result.current.has("auth0|alice")).toBe(false);
    expect(result.current.has("auth0|bob")).toBe(true);
  });
});
