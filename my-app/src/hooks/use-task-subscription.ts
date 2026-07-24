"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { TaskItem } from "@/components/tasks/task-card";

interface UseTaskSubscriptionOptions {
  workspaceId: string;
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>;
}

/**
 * Subscribes to Supabase Realtime postgres_changes on the `tasks` table,
 * filtered to the given workspace. Incoming INSERT/UPDATE/DELETE events
 * are merged into the local tasks state.
 *
 * Optimistic update cooldown: tasks mutated by the current client within
 * the last 2 seconds are skipped to avoid overriding optimistic state.
 *
 * Usage in KanbanBoard:
 *   useTaskSubscription({ workspaceId, tasks, setTasks });
 */
export function useTaskSubscription({ workspaceId, setTasks }: UseTaskSubscriptionOptions) {
  const pendingRef = useRef<Set<string>>(new Set());
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (!workspaceId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`tasks-${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tasks",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload: RealtimePostgresChangesPayload<TaskItem>) => {
          const newTask = payload.new as unknown as TaskItem;
          if (!newTask?.id) return;

          // Skip if this task was just created by the current client
          if (pendingRef.current.has(newTask.id)) return;

          setTasks((prev) => {
            if (prev.some((t) => t.id === newTask.id)) return prev;
            return [...prev, newTask];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tasks",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload: RealtimePostgresChangesPayload<TaskItem>) => {
          const updated = payload.new as unknown as TaskItem;
          if (!updated?.id) return;

          // Skip if this task was just mutated by the current client
          if (pendingRef.current.has(updated.id)) return;

          setTasks((prev) =>
            prev.map((t) => (t.id === updated.id ? updated : t)),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "tasks",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload: RealtimePostgresChangesPayload<TaskItem>) => {
          const deleted = payload.old as unknown as TaskItem;
          if (!deleted?.id) return;

          setTasks((prev) => prev.filter((t) => t.id !== deleted.id));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      // Cleanup pending timeouts
      for (const timeout of timeoutsRef.current.values()) {
        clearTimeout(timeout);
      }
      timeoutsRef.current.clear();
      pendingRef.current.clear();
    };
  }, [workspaceId, setTasks]);

  /**
   * Mark a task as "pending" so real-time updates for it are skipped.
   * The task is automatically removed from the pending set after 2 seconds.
   * Call this BEFORE the optimistic update (e.g., in onDragEnd).
   */
  function markPending(taskId: string) {
    pendingRef.current.add(taskId);

    // Clear any existing timeout for this task
    const existing = timeoutsRef.current.get(taskId);
    if (existing) clearTimeout(existing);

    // Auto-clear after 2 seconds
    const timeout = setTimeout(() => {
      pendingRef.current.delete(taskId);
      timeoutsRef.current.delete(taskId);
    }, 2000);

    timeoutsRef.current.set(taskId, timeout);
  }

  /**
   * Check if a task is currently in the pending set.
   */
  function isPending(taskId: string): boolean {
    return pendingRef.current.has(taskId);
  }

  return { markPending, isPending };
}
