import { test, expect } from "@playwright/test";
import { hasCredentials, signIn, ensureWorkspace } from "./helpers";

/**
 * These tests verify the task creation and reordering flow, specifically
 * covering the atomic position generation (get_next_task_position RPC).
 *
 * Prerequisites:
 *   - Local dev server running (npm run dev)
 *   - Auth0 credentials set via AUTH0_TEST_EMAIL / AUTH0_TEST_PASSWORD env vars
 *   - The 090_atomic_task_position migration applied to the database
 *
 * If auth credentials are not available, the tests are skipped gracefully.
 */

const createdWorkspaceIds: string[] = [];

test.describe("Task Workflow", () => {
  test.describe("Task Creation and Positioning", () => {
    test("creates tasks with sequential positions", async ({ page }) => {
      test.skip(!hasCredentials, "AUTH0_TEST_EMAIL/PASSWORD not set");
      await signIn(page);

      const api = page.request;
      const { workspaceId } = await ensureWorkspace(api);
      createdWorkspaceIds.push(workspaceId);

      // Create 3 tasks in the "todo" column
      const results = await Promise.all(
        ["E2E Alpha", "E2E Beta", "E2E Gamma"].map((title) =>
          api.post("/api/tasks", {
            data: { workspace_id: workspaceId, title, status: "todo" },
          })
        )
      );

      expect(results.length).toBe(3);

      // All creations should return 201 Created
      for (const res of results) {
        expect(res.status()).toBe(201);
      }

      const tasks = await Promise.all(results.map((r) => r.json()));

          // Verify unique sequential positions under concurrent creation
      const positions = tasks.map((t: any) => t.task.position);
      expect(new Set(positions).size).toBe(3);
      expect(positions.sort()).toEqual([0, 1, 2]);

      // Clean up
      for (const t of tasks) {
        await api.delete(`/api/tasks/${t.task.id}`);
      }
    });

    test("repositions task when status changes", async ({ page }) => {
      test.skip(!hasCredentials, "AUTH0_TEST_EMAIL/PASSWORD not set");
      await signIn(page);

      const api = page.request;
      const { workspaceId } = await ensureWorkspace(api);
      createdWorkspaceIds.push(workspaceId);

      // Create a task in "todo"
      const createRes = await api.post("/api/tasks", {
        data: { workspace_id: workspaceId, title: "Reorder Test", status: "todo" },
      });
      expect(createRes.status()).toBe(201);
      const { task } = await createRes.json();
      expect(task.position).toBe(0);

      // Move it to "in_progress" — appends to end of new column
      const patchRes = await api.patch(`/api/tasks/${task.id}`, {
        data: { status: "in_progress" },
      });
      expect(patchRes.ok()).toBeTruthy();
      const { task: updated } = await patchRes.json();
      expect(updated.status).toBe("in_progress");

      // Second task in "in_progress" should get position 1
      const createRes2 = await api.post("/api/tasks", {
        data: { workspace_id: workspaceId, title: "Second In Progress", status: "in_progress" },
      });
      expect(createRes2.status()).toBe(201);
      const { task: task2 } = await createRes2.json();
      expect(task2.position).toBe(1);

      // Verify all positions in the column are unique
      const listRes = await api.get(
        `/api/tasks?workspace_id=${workspaceId}&status=in_progress`
      );
      const { tasks } = await listRes.json();
      const inProgressPositions = tasks.map((t: any) => t.position);
      expect(new Set(inProgressPositions).size).toBe(inProgressPositions.length);

      // Clean up
      for (const t of tasks) {
        await api.delete(`/api/tasks/${t.id}`);
      }
    });
  });

  test.describe("Race Condition Coverage", () => {
    test("concurrent task creation produces unique positions", async ({ page }) => {
      test.skip(!hasCredentials, "AUTH0_TEST_EMAIL/PASSWORD not set");
      await signIn(page);

      const api = page.request;
      const { workspaceId } = await ensureWorkspace(api);
      createdWorkspaceIds.push(workspaceId);

      // Fire 5 concurrent task creations to stress-test the advisory lock
      const titles = ["Race A", "Race B", "Race C", "Race D", "Race E"];
      const responses = await Promise.all(
        titles.map((title) =>
          api.post("/api/tasks", {
            data: { workspace_id: workspaceId, title, status: "todo" },
          })
        )
      );

      // All should have succeeded with 201
      expect(responses.length).toBe(5);
      for (const res of responses) {
        expect(res.status()).toBe(201);
      }

      const results = await Promise.all(responses.map((r) => r.json()));

      // Positions should be unique (0, 1, 2, 3, 4) even under concurrent load
      const positions = results.map((r: any) => r.task.position);
      const uniquePositions = new Set(positions);
      expect(uniquePositions.size).toBe(5);
      expect(Math.max(...positions)).toBe(4);
      expect(Math.min(...positions)).toBe(0);

      // Clean up
      for (const r of results) {
        if (r.task?.id) {
          await api.delete(`/api/tasks/${r.task.id}`);
        }
      }
    });
  });

  // Clean up any workspaces created during tests
  test.afterAll(async () => {
    // Workspaces are cleaned up within each test
    createdWorkspaceIds.length = 0;
  });
});
