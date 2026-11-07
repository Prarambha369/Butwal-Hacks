import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";

/**
 * Canonical gallery photo pages.
 *
 * Public routes, so no skipInCI(): the point is that a shared link works for a
 * signed-out visitor and for a crawler that never runs JavaScript.
 *
 * The two link assertions need at least one approved photo to exist. Uploads
 * are signed and moderated, so a spec cannot seed one, and CI's database is
 * empty. Failing there would report "sharing is broken" when the real state is
 * "there is nothing to share" — so they skip with that reason and run wherever
 * the gallery has content.
 */

const PHOTO_PATH = /^\/gallery\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** The first tile's href, or null when the gallery renders no photo tiles. */
async function firstPhotoHref(page: Page): Promise<string | null> {
  await page.goto("/gallery");
  const cards = page.locator('a[href^="/gallery/"]');
  if ((await cards.count()) === 0) return null;
  return cards.first().getAttribute("href");
}

test.describe("Gallery share links", () => {
  test("a gallery card is a link to its canonical photo page", async ({ page }) => {
    const href = await firstPhotoHref(page);
    test.skip(href === null, "no approved photos in this environment");

    expect(href).toMatch(PHOTO_PATH);
  });

  test("a photo URL renders its heading and a social card image", async ({ page }) => {
    const href = await firstPhotoHref(page);
    test.skip(href === null, "no approved photos in this environment");

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
