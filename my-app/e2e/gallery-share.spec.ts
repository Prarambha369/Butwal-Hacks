import { test, expect } from "./fixtures";

/**
 * Canonical gallery photo pages.
 *
 * Public routes, so no skipInCI(): the whole point is that a shared link works
 * for a signed-out visitor and for a crawler that never runs JavaScript.
 */

const PHOTO_PATH = /^\/gallery\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

test.describe("Gallery share links", () => {
  test("a gallery card is a link to its canonical photo page", async ({ page }) => {
    await page.goto("/gallery");

    const card = page.locator('a[href^="/gallery/"]').first();
    await expect(card).toBeVisible();
    expect(await card.getAttribute("href")).toMatch(PHOTO_PATH);
  });

  test("a photo URL renders its heading and a social card image", async ({ page }) => {
    await page.goto("/gallery");

    const href = await page.locator('a[href^="/gallery/"]').first().getAttribute("href");
    expect(href).toBeTruthy();

    await page.goto(href as string);

    await expect(page.locator("h1")).toBeVisible();

    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toHaveAttribute("content", /w_1200/);
    await expect(ogImage).toHaveAttribute("content", /f_jpg/);
  });

  test("a malformed photo id shows the not-found page, not a share card", async ({ page }) => {
    // The response status is 200 rather than 404. That is this app's shape for
    // every async dynamic route, not something the gallery route chose: the
    // root loading boundary flushes the shell before the page resolves, so the
    // status is committed first. `/events/<unknown>` behaves identically.
    // What matters for a removed photo is that the visitor sees the neutral
    // not-found state and no Open Graph card is emitted for it.
    await page.goto("/gallery/not-a-uuid");

    await expect(page.getByText(/isn't available/i)).toBeVisible();

    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    expect(ogImage ?? "").not.toMatch(/w_1200/);
  });
});
