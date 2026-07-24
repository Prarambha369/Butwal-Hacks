import { type Page, type APIRequestContext } from "@playwright/test";

/**
 * E2E test helpers shared across spec files.
 *
 * Usage:
 *   import { hasCredentials, signIn, ensureWorkspace } from "../helpers";
 */

// ─── Auth credentials ─────────────────────────────────────────────
// Read from environment; tests skip gracefully when not set.
export const TEST_EMAIL = process.env.AUTH0_TEST_EMAIL;
export const TEST_PASSWORD = process.env.AUTH0_TEST_PASSWORD;
export const hasCredentials = !!TEST_EMAIL && !!TEST_PASSWORD;

// ─── signIn ───────────────────────────────────────────────────────
/**
 * Sign in via Auth0's Universal Login page.
 *
 * Navigates to /sign-in, fills the Auth0 login form with the test
 * credentials, and waits for the dashboard to load.
 *
 * Requires AUTH0_TEST_EMAIL and AUTH0_TEST_PASSWORD to be set.
 * Guards with test.skip(!hasCredentials, ...) before calling.
 */
export async function signIn(page: Page) {
  // Navigate to a protected page first. The proxy middleware will redirect
  // to Auth0's Universal Login with a `returnTo` parameter so the user
  // lands back on the dashboard after authentication.
  await page.goto("/dashboard/hacker");

  // Auth0 Universal Login renders with different DOM depending on the
  // tenant's login experience setting (Classic vs New). The email field
  // might be `input[name="email"]` (Classic) or `input#username` (New).
  // We try both selectors to stay compatible.
  const emailField = page.locator('input[name="email"], input#username, input[type="email"]').first();
  await emailField.waitFor({ state: "visible", timeout: 20000 });
  await emailField.fill(TEST_EMAIL!);

  const passwordField = page.locator('input[name="password"], input#password').first();
  await passwordField.fill(TEST_PASSWORD!);

  // Target the primary submit button by text — filters out the
  // "Continue with Google/GitHub/LinkedIn" social login buttons.
  const submitButton = page.locator('button[type="submit"]').filter({ hasText: /^Continue$/ });
  await submitButton.click();

  // Wait for the Auth0 callback to complete and the proxy middleware
  // to redirect back to /dashboard/hacker (the returnTo target).
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
}

// ─── ensureWorkspace ──────────────────────────────────────────────
/**
 * Create a workspace for E2E testing.
 *
 * Creates a team (POST /api/teams) then creates a workspace within
 * that team (POST /api/workspaces). Returns the workspace ID.
 *
 * The caller is responsible for tracking and cleaning up created
 * teams and workspaces.
 *
 * Returns: { workspaceId: string, teamId: string }
 */
export async function ensureWorkspace(
  request: APIRequestContext
): Promise<{ workspaceId: string; teamId: string }> {
  // Create a team first
  const teamRes = await request.post("/api/teams", {
    data: { name: `E2E Team ${Date.now()}` },
  });
  if (!teamRes.ok()) {
    const body = await teamRes.text();
    throw new Error(`Failed to create team (${teamRes.status()}): ${body}`);
  }
  const { team } = await teamRes.json();

  // Create a workspace within the team
  const wsRes = await request.post("/api/workspaces", {
    data: { team_id: team.id, name: `E2E Workspace ${Date.now()}` },
  });
  if (!wsRes.ok()) {
    const body = await wsRes.text();
    throw new Error(`Failed to create workspace (${wsRes.status()}): ${body}`);
  }
  const { workspace } = await wsRes.json();

  return { workspaceId: workspace.id, teamId: team.id };
}
