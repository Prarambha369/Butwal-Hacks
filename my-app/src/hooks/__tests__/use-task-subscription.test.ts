// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTaskSubscription } from "../use-task-subscription";

// ─── Mock Supabase client ────────────────────────────────────────
// Store event handlers so tests can simulate real-time events
type EventHandler = (payload: unknown) => void;
const eventHandlers: Record<string, EventHandler> = {};

let mockSubscribe: ReturnType<typeof vi.fn>;
let mockChannel: { on: ReturnType<typeof vi.fn>; subscribe: ReturnType<typeof vi.fn> };
let mockRemoveChannel: ReturnType<typeof vi.fn>;

vi.mock("@/utils/supabase/client", () => ({
  createClient: vi.fn(() => ({
    channel: vi.fn(() => mockChannel),
    removeChannel: mockRemoveChannel,
  })),
}));

// ─── Helpers ──────────────────────────────────────────────────────

function makeTask(overrides: Record<string, unknown> = {}) {
  return {
    id: "task-1",
    title: "Test Task",
    description: "",
    status: "todo",
    priority: "medium",
    assignee_id: null,
    due_date: null,
    position: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ─── Setup ────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  // Reassign eventHandlers to a fresh object to prevent state leaking between tests
  for (const k of Object.keys(eventHandlers)) {
    delete eventHandlers[k];
  }
  // Create fresh mock channel objects for each test — avoids stale state across tests
  mockSubscribe = vi.fn();
  mockChannel = {
    on: vi.fn((_eventType: string, config: { event: string }, callback: EventHandler) => {
      eventHandlers[config.event] = callback;
      return mockChannel;
    }),
    subscribe: mockSubscribe,
  };
  mockRemoveChannel = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
});

// ─── Tests ────────────────────────────────────────────────────────

describe("useTaskSubscription hook setup", () => {
  it("creates a channel with the correct workspace ID", () => {
    const setTasks = vi.fn();
    renderHook(() => useTaskSubscription({ workspaceId: "ws-1", setTasks }));

    // Should call createClient().channel() with the workspace-prefixed name
    expect(mockChannel.on).toHaveBeenCalled(); // verifies channel was created
  });

  it("subscribes to INSERT, UPDATE, DELETE postgres_changes", () => {
    const setTasks = vi.fn();
    renderHook(() => useTaskSubscription({ workspaceId: "ws-1", setTasks }));

    // Should register 3 event handlers
    expect(mockChannel.on).toHaveBeenCalledTimes(3);
    expect(eventHandlers).toHaveProperty("INSERT");
    expect(eventHandlers).toHaveProperty("UPDATE");
    expect(eventHandlers).toHaveProperty("DELETE");

    // Should subscribe to the channel
    expect(mockSubscribe).toHaveBeenCalledTimes(1);
  });

  it("filters by the correct workspace ID in the event config", () => {
    const setTasks = vi.fn();
    renderHook(() => useTaskSubscription({ workspaceId: "ws-42", setTasks }));

    // Each .on() call includes the filter string with the workspace ID
    const onCalls = mockChannel.on.mock.calls;
    for (const call of onCalls) {
      const config = call[1];
      expect(config.filter).toContain("workspace_id=eq.ws-42");
    }
  });

  it("does nothing when workspaceId is empty", () => {
    const setTasks = vi.fn();
    renderHook(() => useTaskSubscription({ workspaceId: "", setTasks }));

    expect(mockChannel.on).not.toHaveBeenCalled();
    expect(mockSubscribe).not.toHaveBeenCalled();
  });
});

describe("INSERT events", () => {
  it("adds a new task to state when INSERT arrives", () => {
    const setTasks = vi.fn();
    renderHook(() => useTaskSubscription({ workspaceId: "ws-1", setTasks }));

    const newTask = makeTask({ id: "new-1", title: "New Task" });

    act(() => {
      eventHandlers.INSERT({ new: newTask, old: {} });
    });

    // setTasks should be called with a function (updater)
    const call = setTasks.mock.calls[0][0];
    expect(typeof call).toBe("function");

    // The updater should add the new task (simulate React's behavior)
    const prev = [makeTask({ id: "existing" })];
    const result = call(prev);
    expect(result).toHaveLength(2);
    expect(result).toContainEqual(newTask);
  });

  it("ignores INSERT for a task that already exists (dedup)", () => {
    const setTasks = vi.fn();
    renderHook(() => useTaskSubscription({ workspaceId: "ws-1", setTasks }));

    const existingTask = makeTask({ id: "dup-1" });

    act(() => {
      eventHandlers.INSERT({ new: existingTask, old: {} });
    });

    const updater = setTasks.mock.calls[0][0];
    const prev = [existingTask];
    const result = updater(prev);
    expect(result).toHaveLength(1); // No duplicate added
  });

  it("ignores INSERT when the task ID is pending", () => {
    const setTasks = vi.fn();
    const { result } = renderHook(() => useTaskSubscription({ workspaceId: "ws-1", setTasks }));

    // Mark the task as pending (as if this client just created it)
    act(() => {
      result.current.markPending("pending-task-1");
    });

    const newTask = makeTask({ id: "pending-task-1" });

    act(() => {
      eventHandlers.INSERT({ new: newTask, old: {} });
    });

    // setTasks should NOT have been called
    expect(setTasks).not.toHaveBeenCalled();
  });

  it("ignores INSERT with no task ID", () => {
    const setTasks = vi.fn();
    renderHook(() => useTaskSubscription({ workspaceId: "ws-1", setTasks }));

    act(() => {
      eventHandlers.INSERT({ new: null, old: {} });
    });

    expect(setTasks).not.toHaveBeenCalled();
  });
});

describe("UPDATE events", () => {
  it("replaces an existing task in state when UPDATE arrives", () => {
    const setTasks = vi.fn();
    renderHook(() => useTaskSubscription({ workspaceId: "ws-1", setTasks }));

    const updated = makeTask({ id: "task-1", title: "Updated Title" });

    act(() => {
      eventHandlers.UPDATE({ new: updated, old: {} });
    });

    const updater = setTasks.mock.calls[0][0];
    const prev = [
      makeTask({ id: "task-1", title: "Original Title" }),
      makeTask({ id: "task-2", title: "Other Task" }),
    ];
    const result = updater(prev);
    expect(result[0].title).toBe("Updated Title");
    expect(result[1].title).toBe("Other Task");
  });

  it("ignores UPDATE when the task ID is pending", () => {
    const setTasks = vi.fn();
    const { result } = renderHook(() => useTaskSubscription({ workspaceId: "ws-1", setTasks }));

    act(() => {
      result.current.markPending("task-1");
    });

    const updated = makeTask({ id: "task-1", title: "Should Be Ignored" });

    act(() => {
      eventHandlers.UPDATE({ new: updated, old: {} });
    });

    expect(setTasks).not.toHaveBeenCalled();
  });

  it("ignores UPDATE with no task ID", () => {
    const setTasks = vi.fn();
    renderHook(() => useTaskSubscription({ workspaceId: "ws-1", setTasks }));

    act(() => {
      eventHandlers.UPDATE({ new: null, old: {} });
    });

    expect(setTasks).not.toHaveBeenCalled();
  });
});

describe("DELETE events", () => {
  it("removes a task from state when DELETE arrives", () => {
    const setTasks = vi.fn();
    renderHook(() => useTaskSubscription({ workspaceId: "ws-1", setTasks }));

    act(() => {
      eventHandlers.DELETE({ old: { id: "task-1" }, new: {} });
    });

    const updater = setTasks.mock.calls[0][0];
    const prev = [
      makeTask({ id: "task-1" }),
      makeTask({ id: "task-2" }),
      makeTask({ id: "task-3" }),
    ];
    const result = updater(prev);
    expect(result).toHaveLength(2);
    expect(result.find((t: { id: string }) => t.id === "task-1")).toBeUndefined();
  });

  it("ignores DELETE with no ID", () => {
    const setTasks = vi.fn();
    renderHook(() => useTaskSubscription({ workspaceId: "ws-1", setTasks }));

    act(() => {
      eventHandlers.DELETE({ old: null, new: {} });
    });

    expect(setTasks).not.toHaveBeenCalled();
  });
});

describe("markPending / isPending", () => {
  it("marks a task as pending immediately", () => {
    const setTasks = vi.fn();
    const { result } = renderHook(() => useTaskSubscription({ workspaceId: "ws-1", setTasks }));

    act(() => {
      result.current.markPending("task-1");
    });

    expect(result.current.isPending("task-1")).toBe(true);
  });

  it("auto-clears pending status after 2 seconds", () => {
    vi.useFakeTimers();
    const setTasks = vi.fn();
    const { result } = renderHook(() => useTaskSubscription({ workspaceId: "ws-1", setTasks }));

    act(() => {
      result.current.markPending("task-1");
    });

    expect(result.current.isPending("task-1")).toBe(true);

    // Advance time by 2 seconds
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.isPending("task-1")).toBe(false);
  });

  it("replaces existing pending timeout when markPending is called again for same ID", () => {
    vi.useFakeTimers();
    const setTasks = vi.fn();
    const { result } = renderHook(() => useTaskSubscription({ workspaceId: "ws-1", setTasks }));

    // Mark pending, advance 1 second, mark again
    act(() => {
      result.current.markPending("task-1");
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Mark again - should reset the timer
    act(() => {
      result.current.markPending("task-1");
    });

    expect(result.current.isPending("task-1")).toBe(true);

    // After 1 more second (if timer wasn't reset, total would be 2s = cleared)
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should still be pending because timer was reset (1s ago, need 2s more)
    expect(result.current.isPending("task-1")).toBe(true);

    // Advance remaining 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.isPending("task-1")).toBe(false);
  });

  it("multiple tasks can be pending simultaneously", () => {
    const setTasks = vi.fn();
    const { result } = renderHook(() => useTaskSubscription({ workspaceId: "ws-1", setTasks }));

    act(() => {
      result.current.markPending("task-1");
      result.current.markPending("task-2");
      result.current.markPending("task-3");
    });

    expect(result.current.isPending("task-1")).toBe(true);
    expect(result.current.isPending("task-2")).toBe(true);
    expect(result.current.isPending("task-3")).toBe(true);
    expect(result.current.isPending("task-4")).toBe(false);
  });
});

describe("cleanup", () => {
  it("removes the channel and clears pending timeouts on unmount", () => {
    vi.useFakeTimers();
    const setTasks = vi.fn();
    const { result, unmount } = renderHook(() => useTaskSubscription({ workspaceId: "ws-1", setTasks }));

    // Set up some pending tasks
    act(() => {
      result.current.markPending("task-1");
      result.current.markPending("task-2");
    });

    expect(result.current.isPending("task-1")).toBe(true);
    expect(result.current.isPending("task-2")).toBe(true);

    // Unmount — should trigger cleanup (remove channel + clear pending timeouts)
    unmount();

    // The channel removal was registered
    expect(mockRemoveChannel).toHaveBeenCalledTimes(1);

    // After unmount, pending status should be cleared
    expect(result.current.isPending("task-1")).toBe(false);
    expect(result.current.isPending("task-2")).toBe(false);
  });

  it("cleans up old channel and creates a new one when workspaceId changes", () => {
    const setTasks = vi.fn();
    const { rerender } = renderHook(
      ({ workspaceId }: { workspaceId: string }) =>
        useTaskSubscription({ workspaceId, setTasks }),
      { initialProps: { workspaceId: "ws-1" } },
    );

    // Initial setup: channel created for ws-1
    expect(mockChannel.on).toHaveBeenCalled();
    expect(mockSubscribe).toHaveBeenCalled();

    // Track the channel object that was created
    const initialChannelCalls = mockChannel.on.mock.calls.length;

    // Change workspace ID — triggers cleanup of old effect + creation of new
    rerender({ workspaceId: "ws-2" });

    // Should have removed old channel (cleanup runs before new effect)
    expect(mockRemoveChannel).toHaveBeenCalledTimes(1);

    // New effect should create subscription for ws-2
    // The mock channel is reused, so .on() gets called for new subscriptions
    // We can verify by checking that new .on() registrations happened
    const newChannelCalls = mockChannel.on.mock.calls.length;
    expect(newChannelCalls).toBeGreaterThan(initialChannelCalls);
  });
});
