import { type Page, type APIRequestContext, test } from "@playwright/test";

/**
 * E2E test helpers shared across spec files.
 *
 * Usage:
 *   import { skipInCI, signIn, ensureWorkspace } from "../helpers";
 */

// ─── Auth credentials ─────────────────────────────────────────────
// Read from environment; tests skip gracefully when not set.
export const TEST_EMAIL = process.env.AUTH0_TEST_EMAIL;
export const TEST_PASSWORD = process.env.AUTH0_TEST_PASSWORD;
export const hasCredentials = !!TEST_EMAIL && !!TEST_PASSWORD;

/**
 * Skip the current test when running in CI or when credentials are missing.
 *
 * Call this synchronously at the top of `test.beforeEach` or the test body.
 * In CI, Auth0 Management API is often not enabled and the database lacks
 * the permissions needed for E2E CRUD, so authenticated tests cannot run.
 */
export function skipInCI() {
  const reason = !hasCredentials
    ? "AUTH0_TEST_EMAIL/PASSWORD not set"
    : process.env.CI
      ? "Skipped in CI — Auth0 Management API not enabled and database permissions not configured for E2E"
      : null;
  if (reason) test.skip(true, reason);
}

// ─── signIn ───────────────────────────────────────────────────────
/**
 * Sign in via Auth0's Universal Login page.
 *
 * Navigates to /sign-in, fills the Auth0 login form with the test
 * credentials, and waits for the dashboard to load.
 *
 * Returns true on success, false on failure (never throws).
 * Requires AUTH0_TEST_EMAIL and AUTH0_TEST_PASSWORD to be set.
 */
export async function signIn(page: Page): Promise<boolean> {
  try {
    await page.goto("/dashboard/hacker");

    const emailField = page.locator('input[name="email"], input#username, input[type="email"]').first();
    await emailField.waitFor({ state: "visible", timeout: 20000 });
    await emailField.fill(TEST_EMAIL!);

    const passwordField = page.locator('input[name="password"], input#password').first();
    await passwordField.fill(TEST_PASSWORD!);

    const submitButton = page.locator('button[type="submit"]').filter({ hasText: /^Continue$/ });
    await submitButton.click();

    await page.waitForURL(/\/dashboard/, { timeout: 30000 });
    return true;
  } catch {
    return false;
  }
}

// ─── ensureWorkspace ──────────────────────────────────────────────
/**
 * Create a workspace for E2E testing.
 *
 * Creates a team (POST /api/teams) then creates a workspace within
 * that team (POST /api/workspaces). Returns the workspace ID.
 *
 * Returns null when workspace creation fails (e.g. DB permissions in CI).
 * The caller should handle null gracefully.
 */
export async function ensureWorkspace(
  request: APIRequestContext
): Promise<{ workspaceId: string; teamId: string } | null> {
  try {
    const teamRes = await request.post("/api/teams", {
      data: { name: `E2E Team ${Date.now()}` },
    });
    if (!teamRes.ok()) {
      console.warn(`[E2E] Failed to create team (${teamRes.status()}): ${await teamRes.text()}`);
      return null;
    }
    const { team } = await teamRes.json();

    const wsRes = await request.post("/api/workspaces", {
      data: { team_id: team.id, name: `E2E Workspace ${Date.now()}` },
    });
    if (!wsRes.ok()) {
      console.warn(`[E2E] Failed to create workspace (${wsRes.status()}): ${await wsRes.text()}`);
      return null;
    }
    const { workspace } = await wsRes.json();

    return { workspaceId: workspace.id, teamId: team.id };
  } catch (err) {
    console.warn("[E2E] ensureWorkspace failed:", err);
    return null;
  }
}
