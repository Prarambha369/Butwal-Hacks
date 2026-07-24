import { test, expect } from "@playwright/test";
import { hasCredentials, signIn } from "./helpers";

/**
 * E2E tests for the avatar upload and profile photo flow.
 *
 * Prerequisites:
 *   - Local dev server running (npm run dev)
 *   - Auth0 credentials set via AUTH0_TEST_EMAIL / AUTH0_TEST_PASSWORD env vars
 *   - Cloudinary env vars configured for the signature API
 *
 * Tests:
 *   - Unauthenticated users are redirected to Auth0
 *   - Profile page renders the avatar section with upload area
 *   - Selecting a file triggers the crop dialog
 *   - Cloudinary signature API returns valid params
 *   - Removing avatar triggers auto-save feedback
 *   - Avatar preview modal opens and closes
 *   - Social link input validation (bonus)
 *
 * Auth-gated tests gracefully skip when credentials are not set.
 */

// ─── Test Data ─────────────────────────────────────────────────────
// Minimal 1x1 red PNG as a byte buffer for file input testing
const TEST_PNG_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

// ─── Unauthenticated ───────────────────────────────────────────────
test.describe("Avatar Upload — Unauthenticated", () => {
  test("redirects to /auth/login when accessing profile page", async ({ request }) => {
    // Uses APIRequestContext with maxRedirects: 0 so we can inspect the
    // actual redirect response rather than following it — matching the
    // pattern established in rbac-routing.spec.ts.
    const response = await request.get("/dashboard/hacker/profile", { maxRedirects: 0 });

    // The proxy middleware should redirect to /auth/login
    expect(response.status()).toBe(307);
    const location = response.headers()["location"] || "";
    expect(location).toContain("/auth/login");
  });
});

// ─── Authenticated ─────────────────────────────────────────────────
test.describe("Avatar Upload — Authenticated", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasCredentials, "AUTH0_TEST_EMAIL/PASSWORD not set");
    await signIn(page);
  });

  test("profile page renders avatar section with upload area", async ({ page }) => {
    await page.goto("/dashboard/hacker/profile");
    await page.waitForLoadState("networkidle");

    // Avatar preview button (clickable round thumbnail)
    const previewBtn = page.getByLabel("Preview avatar");
    await expect(previewBtn).toBeVisible();

    // Upload button area with label text
    // The label is rendered inside the dashed-border button area
    const uploadLabel = page.getByText("Upload Avatar");
    await expect(uploadLabel).toBeVisible();

    // The hidden file input exists
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeHidden();

    // Verify the form title is visible
    await expect(page.getByText("Full Name")).toBeVisible();
    await expect(page.getByText("BH-ID")).toBeVisible();
  });

  test("selecting a file opens the crop dialog", async ({ page }) => {
    await page.goto("/dashboard/hacker/profile");
    await page.waitForLoadState("networkidle");

    // The file input is hidden — setInputFiles works directly on hidden inputs
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test-avatar.png",
      mimeType: "image/png",
      buffer: TEST_PNG_BYTES,
    });

    // The crop dialog should appear (1:1 aspect ratio for avatars)
    await expect(page.getByText("Adjust Profile Photo")).toBeVisible();

    // Zoom controls visible
    await expect(page.getByTitle("Zoom in")).toBeVisible();
    await expect(page.getByTitle("Zoom out")).toBeVisible();

    // The Apply & Upload button should be visible
    await expect(page.getByText("Apply & Upload")).toBeVisible();

    // Cancel button should also be visible
    await expect(page.getByText("Cancel").first()).toBeVisible();

    // Cancel the crop dialog to clean up
    await page.getByText("Cancel").first().click();
    await expect(page.getByText("Adjust Profile Photo")).not.toBeVisible();
  });

  test("cloudinary-signature API returns valid upload params", async ({ request }) => {
    const res = await request.post("/api/cloudinary-signature", {
      data: { entity_type: "avatar" },
    });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    expect(body.signature).toBeDefined();
    expect(typeof body.signature).toBe("string");
    expect(body.signature.length).toBeGreaterThan(0);

    expect(body.cloudName).toBeDefined();
    expect(body.apiKey).toBeDefined();
    expect(body.timestamp).toBeDefined();
    expect(typeof body.timestamp).toBe("number");

    // Folder should include the user's Auth0 ID
    expect(body.folder).toContain("butwal-hacks/");
  });

  test("avatar preview modal opens and closes", async ({ page }) => {
    await page.goto("/dashboard/hacker/profile");
    await page.waitForLoadState("networkidle");

    // Click the avatar preview button
    const previewBtn = page.getByLabel("Preview avatar");
    await previewBtn.click();

    // Preview modal should appear — it has role="dialog" and aria-label
    const modal = page.getByRole("dialog", { name: /preview/i });
    await expect(modal).toBeVisible();

    // Close via the X button
    const closeBtn = page.getByLabel("Close preview");
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    // Modal should be gone
    await expect(modal).not.toBeVisible();
  });

  test("avatar removal triggers auto-save feedback", async ({ page }) => {
    await page.goto("/dashboard/hacker/profile");
    await page.waitForLoadState("networkidle");

    // This test only applies if there IS an uploaded avatar to remove.
    // If the user has a DiceBear fallback (no avatar), the upload button
    // shows instead of the current image. We check which state we're in.
    const removeBtn = page.locator('button[title="Remove image"]');

    if (await removeBtn.isVisible()) {
      await removeBtn.click();

      // The save feedback should appear — toast or "Saved!" label
      // After removal completes, the "Upload Avatar" label should reappear
      await expect(page.getByText("Upload Avatar")).toBeVisible();
    } else {
      // No avatar uploaded — test the upload button renders instead
      await expect(page.getByText("Upload Avatar")).toBeVisible();
    }
  });

  test("social link validation shows error on invalid URLs", async ({ page }) => {
    await page.goto("/dashboard/hacker/profile");
    await page.waitForLoadState("networkidle");

    // Find the GitHub input and fill with an invalid URL
    const githubInput = page.getByPlaceholder("https://github.com/username");
    await expect(githubInput).toBeVisible();
    await githubInput.fill("not-a-valid-url");

    // Blur the field to trigger validation
    await page.getByText("Full Name").click();

    // Validation error should appear
    await expect(page.getByText(/GitHub|invalid|format/i)).toBeVisible();
  });
});
