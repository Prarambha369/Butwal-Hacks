import { test, expect } from "@playwright/test";
import { hasCredentials, signIn, ensureWorkspace } from "./helpers";

/**
 * E2E tests for the Kanban board API and Realtime data flow.
 *
 * These tests verify that:
 *   1. Tasks can be created, read, updated, and deleted via the API
 *   2. Task positions are unique and sequential within each column
 *   3. Status changes correctly reposition tasks
 *   4. Cross-column moves maintain position integrity
 *   5. Concurrent operations don't produce duplicate positions
 *
 * The real-time subscription layer (useTaskSubscription hook) bridges
 * these API changes to connected clients via Supabase Realtime. By
 * verifying the API layer, we ensure the data flowing through the
 * subscription is correct.
 *
 * Prerequisites:
 *   - Local dev server running (npm run dev)
 *   - Auth0 credentials set via AUTH0_TEST_EMAIL / AUTH0_TEST_PASSWORD env vars
 */

const teamIds: string[] = [];
const workspaceIds: string[] = [];
const createdTaskIds: string[] = [];

test.describe("Kanban Realtime — API Layer", () => {
  test.describe("Task CRUD", () => {
    test("creates, reads, updates, and deletes a task", async ({ page }) => {
      test.skip(!hasCredentials, "AUTH0_TEST_EMAIL/PASSWORD not set");
      await signIn(page);

      const api = page.request;
      const { workspaceId, teamId } = await ensureWorkspace(api);
      workspaceIds.push(workspaceId);
      teamIds.push(teamId);

      // ── CREATE ──────────────────────────────────────────────────
      const createRes = await api.post("/api/tasks", {
        data: {
          workspace_id: workspaceId,
          title: "E2E Kanban Test Task",
          status: "todo",
          priority: "medium",
        },
      });
      expect(createRes.status()).toBe(201);
      const { task: created } = await createRes.json();
      expect(created.title).toBe("E2E Kanban Test Task");
      expect(created.status).toBe("todo");
      expect(created.priority).toBe("medium");
      expect(created.position).toBe(0);
      createdTaskIds.push(created.id);

      // ── READ ────────────────────────────────────────────────────
      const listRes = await api.get(`/api/tasks?workspace_id=${workspaceId}`);
      expect(listRes.ok()).toBeTruthy();
      const { tasks } = await listRes.json();
      const found = tasks.find((t: any) => t.id === created.id);
      expect(found).toBeTruthy();
      expect(found.title).toBe(created.title);

      // ── UPDATE (status change) ──────────────────────────────────
      const updateRes = await api.patch(`/api/tasks/${created.id}`, {
        data: { status: "in_progress" },
      });
      expect(updateRes.ok()).toBeTruthy();
      const { task: updated } = await updateRes.json();
      expect(updated.status).toBe("in_progress");

      // ── UPDATE (priority change) ────────────────────────────────
      const priorityRes = await api.patch(`/api/tasks/${created.id}`, {
        data: { priority: "high" },
      });
      expect(priorityRes.ok()).toBeTruthy();
      const { task: reprioritized } = await priorityRes.json();
      expect(reprioritized.priority).toBe("high");

      // ── DELETE ──────────────────────────────────────────────────
      const deleteRes = await api.delete(`/api/tasks/${created.id}`);
      expect(deleteRes.ok()).toBeTruthy();

      // Verify deletion
      const listAfterDelete = await api.get(`/api/tasks?workspace_id=${workspaceId}`);
      const { tasks: tasksAfter } = await listAfterDelete.json();
      expect(tasksAfter.find((t: any) => t.id === created.id)).toBeFalsy();
    });

    test("rejects unauthorized task creation", async ({ request }) => {
      // No sign-in — should get 401
      const createRes = await request.post("/api/tasks", {
        data: {
          workspace_id: "00000000-0000-0000-0000-000000000000",
          title: "Should Fail",
        },
      });
      expect(createRes.status()).toBe(401);
    });
  });

  test.describe("Task Positions", () => {
    test("creates tasks with unique sequential positions", async ({ page }) => {
      test.skip(!hasCredentials, "AUTH0_TEST_EMAIL/PASSWORD not set");
      await signIn(page);

      const api = page.request;
      const { workspaceId, teamId } = await ensureWorkspace(api);
      workspaceIds.push(workspaceId);
      teamIds.push(teamId);

      // Create 3 tasks in the same column
      const titles = ["Pos A", "Pos B", "Pos C"];
      const results = await Promise.all(
        titles.map((title) =>
          api.post("/api/tasks", {
            data: { workspace_id: workspaceId, title, status: "review" },
          })
        )
      );

      expect(results.length).toBe(3);
      for (const res of results) {
        expect(res.status()).toBe(201);
      }

      const tasks = await Promise.all(results.map((r) => r.json()));
      const positions = tasks.map((t: any) => t.task.position);
      const uniquePositions = new Set(positions);

      expect(uniquePositions.size).toBe(3);
      expect(positions.sort()).toEqual([0, 1, 2]);

      // Verify via GET endpoint
      const listRes = await api.get(
        `/api/tasks?workspace_id=${workspaceId}&status=review`
      );
      const { tasks: listed } = await listRes.json();
      const listedPositions = listed.map((t: any) => t.position).sort();
      expect(listedPositions).toEqual([0, 1, 2]);

      // Clean up
      for (const t of tasks) {
        await api.delete(`/api/tasks/${t.task.id}`);
      }
    });

    test("repositions task when moving between columns", async ({ page }) => {
      test.skip(!hasCredentials, "AUTH0_TEST_EMAIL/PASSWORD not set");
      await signIn(page);

      const api = page.request;
      const { workspaceId, teamId } = await ensureWorkspace(api);
      workspaceIds.push(workspaceId);
      teamIds.push(teamId);

      // Create 2 tasks in "todo"
      const t1 = await api.post("/api/tasks", {
        data: { workspace_id: workspaceId, title: "Move Me", status: "todo" },
      });
      const t2 = await api.post("/api/tasks", {
        data: { workspace_id: workspaceId, title: "Stay Here", status: "todo" },
      });
      expect(t1.status()).toBe(201);
      expect(t2.status()).toBe(201);

      const { task: task1 } = await t1.json();
      const { task: task2 } = await t2.json();
      createdTaskIds.push(task1.id, task2.id);

      // Move task1 from "todo" to "in_progress"
      const moveRes = await api.patch(`/api/tasks/${task1.id}`, {
        data: { status: "in_progress" },
      });
      expect(moveRes.ok()).toBeTruthy();
      const { task: moved } = await moveRes.json();
      expect(moved.status).toBe("in_progress");
      expect(moved.position).toBe(0); // First task in new column

      // The remaining "todo" task should still have unique positions
      const todoList = await api.get(
        `/api/tasks?workspace_id=${workspaceId}&status=todo`
      );
      const { tasks: todoTasks } = await todoList.json();
      expect(todoTasks.length).toBe(1);
      expect(todoTasks[0].position).toBe(0);

      // Clean up
      await api.delete(`/api/tasks/${task1.id}`);
      await api.delete(`/api/tasks/${task2.id}`);
    });
  });

  test.describe("Concurrent Operations", () => {
    test("concurrent status changes produce valid positions", async ({ page }) => {
      test.skip(!hasCredentials, "AUTH0_TEST_EMAIL/PASSWORD not set");
      await signIn(page);

      const api = page.request;
      const { workspaceId, teamId } = await ensureWorkspace(api);
      workspaceIds.push(workspaceId);
      teamIds.push(teamId);

      // Create 3 tasks in "todo"
      const created = await Promise.all(
        ["Concurrent A", "Concurrent B", "Concurrent C"].map((title) =>
          api
            .post("/api/tasks", {
              data: { workspace_id: workspaceId, title, status: "todo" },
            })
            .then((r) => r.json())
            .then((d) => d.task)
        )
      );

      for (const task of created) {
        createdTaskIds.push(task.id);
      }

      // Move all 3 to "in_progress" concurrently
      const moves = await Promise.all(
        created.map((task) =>
          api.patch(`/api/tasks/${task.id}`, {
            data: { status: "in_progress" },
          })
        )
      );

      for (const move of moves) {
        expect(move.ok()).toBeTruthy();
      }

      // All 3 should now be in "in_progress" with unique positions
      const inProgressList = await api.get(
        `/api/tasks?workspace_id=${workspaceId}&status=in_progress`
      );
      const { tasks: inProgress } = await inProgressList.json();
      expect(inProgress.length).toBe(3);

      const positions = inProgress.map((t: any) => t.position).sort();
      const uniquePositions = new Set(positions);
      expect(uniquePositions.size).toBe(3);
      expect(positions).toEqual([0, 1, 2]);

      // Clean up
      for (const task of created) {
        await api.delete(`/api/tasks/${task.id}`);
      }
    });

    test("concurrent task creation with mixed statuses", async ({ page }) => {
      test.skip(!hasCredentials, "AUTH0_TEST_EMAIL/PASSWORD not set");
      await signIn(page);

      const api = page.request;
      const { workspaceId, teamId } = await ensureWorkspace(api);
      workspaceIds.push(workspaceId);
      teamIds.push(teamId);

      // Create tasks in different columns simultaneously
      const todoTask = api.post("/api/tasks", {
        data: { workspace_id: workspaceId, title: "Mixed Todo", status: "todo" },
      });
      const inProgressTask = api.post("/api/tasks", {
        data: { workspace_id: workspaceId, title: "Mixed In Progress", status: "in_progress" },
      });
      const doneTask = api.post("/api/tasks", {
        data: { workspace_id: workspaceId, title: "Mixed Done", status: "done" },
      });

      const results = await Promise.all([todoTask, inProgressTask, doneTask]);
      for (const res of results) {
        expect(res.status()).toBe(201);
        const { task } = await res.json();
        createdTaskIds.push(task.id);
      }

      // Each column should have exactly 1 task
      for (const status of ["todo", "in_progress", "done"]) {
        const listRes = await api.get(
          `/api/tasks?workspace_id=${workspaceId}&status=${status}`
        );
        const { tasks } = await listRes.json();
        expect(tasks.length).toBe(1);
        expect(tasks[0].position).toBe(0);
      }

      // Clean up
      for (const id of [...createdTaskIds]) {
        await api.delete(`/api/tasks/${id}`);
      }
    });
  });

  test.describe("Work Dashboard Page", () => {
    test("loads the work dashboard page when authenticated", async ({ page }) => {
      test.skip(!hasCredentials, "AUTH0_TEST_EMAIL/PASSWORD not set");
      await signIn(page);

      await page.goto("/dashboard/hacker/work");
      await page.waitForLoadState("networkidle");

      // The page should render without crashing
      const title = page.locator("h1");
      await expect(title).toBeVisible();

      // Should show either the board view or a "no workspace" message
      const boardView = page.locator("text=Board").first();
      const noWorkspace = page.locator("text=No Active Workspace");

      // One of these should be present
      const boardVisible = await boardView.isVisible().catch(() => false);
      const noWsVisible = await noWorkspace.isVisible().catch(() => false);
      expect(boardVisible || noWsVisible).toBeTruthy();
    });

    test("renders column headers on the board view", async ({ page }) => {
      test.skip(!hasCredentials, "AUTH0_TEST_EMAIL/PASSWORD not set");
      await signIn(page);

      const api = page.request;

      // Ensure there's a workspace with tasks
      const { workspaceId, teamId } = await ensureWorkspace(api);
      workspaceIds.push(workspaceId);
      teamIds.push(teamId);

      // Create a task so the workspace has content
      const createRes = await api.post("/api/tasks", {
        data: { workspace_id: workspaceId, title: "Dashboard Test Task", status: "todo" },
      });
      expect(createRes.status()).toBe(201);
      const { task } = await createRes.json();
      createdTaskIds.push(task.id);

      await page.goto("/dashboard/hacker/work");
      await page.waitForLoadState("networkidle");

      // Column headers should be visible
      await expect(page.locator("text=To Do").first()).toBeVisible();
      await expect(page.locator("text=In Progress").first()).toBeVisible();

      // Clean up
      await api.delete(`/api/tasks/${task.id}`);
    });
  });

  // Clean up created resources
  test.afterAll(async () => {
    createdTaskIds.length = 0;
    workspaceIds.length = 0;
    teamIds.length = 0;
  });
});
