import { test, expect } from "@playwright/test";
import { hasCredentials, signIn } from "./helpers";

/**
 * E2E tests for the ImageCropDialog interactions (zoom, pan, confirm, cancel).
 *
 * Prerequisites:
 *   - Local dev server running (npm run dev)
 *   - Auth0 credentials set via AUTH0_TEST_EMAIL / AUTH0_TEST_PASSWORD env vars
 *
 * These tests verify the crop dialog's interactive controls work correctly:
 *   - Zoom in/out buttons change the zoom level
 *   - Zoom slider adjusts the zoom proportionally
 *   - Pan drag repositions the image within the crop box
 *   - Apply & Upload triggers the upload via Cloudinary
 *   - Cancel closes the dialog without side effects
 *
 * Auth-gated tests gracefully skip when credentials are not set.
 *
 * Uses a 640x640 test image so that initial zoom = boxPx.w / 640 ≈ 1.0 (100%).
 * Images smaller than the crop box get zoomed to fit the box width.
 */

// ─── Test Data ─────────────────────────────────────────────────────
// Minimal 640x640 PNG — yields initial zoom of ~100% in a 640px crop box
// (1x1 pixel scaled via CSS would distort; this base64 is a minimal valid
//  PNG that browsers interpret at 640x640 via the decoder)
const TEST_PNG_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAoAAAAKAAQMAAAA1NohjAAAABlBMVEUAAAD///+l2Z/dAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAASklEQVR42u3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/AaMQgAB1O5MKwAAAABJRU5ErkJggg==",
  "base64"
);

test.describe("Crop Dialog — Interactions", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasCredentials, "AUTH0_TEST_EMAIL/PASSWORD not set");
    await signIn(page);
    await page.goto("/dashboard/hacker/profile");
    await page.waitForLoadState("networkidle");

    // Select a file to trigger the crop dialog
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test-crop.png",
      mimeType: "image/png",
      buffer: TEST_PNG_BYTES,
    });

    // Wait for the crop dialog to appear
    await expect(page.getByText("Adjust Profile Photo")).toBeVisible();
  });

  test("zoom in button increases zoom percentage", async ({ page }) => {
    // Read initial zoom percentage (should be ~100% for a 640px image in a 640px box)
    const zoomLabel = page.locator("text=100%").first();
    await expect(zoomLabel).toBeVisible();

    // Click zoom in (100% * 1.2 = 120%)
    const zoomInBtn = page.getByTitle("Zoom in");
    await zoomInBtn.click();

    await expect(page.getByText("120%")).toBeVisible();
  });

  test("zoom out button decreases zoom percentage", async ({ page }) => {
    // Click zoom in twice first (100% -> 120% -> 144%)
    const zoomInBtn = page.getByTitle("Zoom in");
    await zoomInBtn.click();
    await zoomInBtn.click();

    // Now click zoom out (144% / 1.2 = 120%)
    const zoomOutBtn = page.getByTitle("Zoom out");
    await zoomOutBtn.click();

    await expect(page.getByText("120%")).toBeVisible();
  });

  test("zoom slider adjusts zoom value", async ({ page }) => {
    // The zoom slider is an input[type="range"]
    const slider = page.locator('input[type="range"]');
    await expect(slider).toBeVisible();

    // Set slider to 150%
    await slider.fill("150");

    // Zoom percentage should update
    await expect(page.getByText("150%")).toBeVisible();
  });

  test("pan drag repositions the crop preview image", async ({ page }) => {
    // Wait for the image to fully load (it has to set naturalWidth/naturalHeight)
    await page.waitForTimeout(1000);

    // Get the crop preview image
    const previewImg = page.locator('img[alt="Crop preview"]');
    await expect(previewImg).toBeVisible();

    // Get initial bounding box
    const initialBox = await previewImg.boundingBox();
    expect(initialBox).not.toBeNull();

    // Perform a pointer drag on the image
    const startX = initialBox!.x + initialBox!.width / 2;
    const startY = initialBox!.y + initialBox!.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 50, startY + 30, { steps: 5 });
    await page.mouse.up();

    // Wait for React state update
    await page.waitForTimeout(300);

    // The image's style attribute should contain translate() after dragging
    const styleAttr = await previewImg.getAttribute("style");
    expect(styleAttr).toContain("translate(");
  });

  test("apply & upload button triggers the crop and closes dialog", async ({ page }) => {
    // The Apply & Upload button should be visible
    const applyBtn = page.getByText("Apply & Upload");
    await expect(applyBtn).toBeVisible();

    // Click to apply crop — this closes the dialog and starts upload
    await applyBtn.click();

    // After applying crop, the dialog should close
    await expect(page.getByText("Adjust Profile Photo")).not.toBeVisible({ timeout: 5000 });
  });

  test("cancel button closes the dialog without uploading", async ({ page }) => {
    // Crop dialog is visible
    await expect(page.getByText("Adjust Profile Photo")).toBeVisible();

    // Click the Cancel button
    const cancelBtn = page.getByText("Cancel").first();
    await cancelBtn.click();

    // Dialog should close
    await expect(page.getByText("Adjust Profile Photo")).not.toBeVisible();

    // The upload button should still be visible (no upload triggered)
    await expect(page.getByText("Upload Avatar")).toBeVisible();
  });

  test("dismiss crop dialog and re-open with a new file", async ({ page }) => {
    // Cancel the current crop
    await page.getByText("Cancel").first().click();
    await expect(page.getByText("Adjust Profile Photo")).not.toBeVisible();

    // Select a different file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test-crop-2.png",
      mimeType: "image/png",
      buffer: TEST_PNG_BYTES,
    });

    // Crop dialog should re-appear
    await expect(page.getByText("Adjust Profile Photo")).toBeVisible();

    // Verify the zoom label re-appears for the new file
    await expect(page.getByText("100%").first()).toBeVisible();
  });
});
