import type { Locator, Page } from "@playwright/test";
import { test, expect } from "./fixtures";

/**
 * Gallery grid and lightbox behaviour in real browser engines: event
 * sections, column count, fixed tile boxes, opening, stepping, closing,
 * keyboard navigation, the focus trap and swipe.
 *
 * Runs in Chromium under the default config. For the full matrix (Chromium,
 * Firefox, WebKit, iPhone and Pixel emulation) together with the video spec:
 *
 *   npx playwright test -c playwright.gallery.config.ts
 *
 * Like the share-link and video specs, these need approved media in the
 * gallery. CI's database is empty, so they skip with that reason there.
 */

const TILE = 'a[href^="/gallery/"]:has(img, video)';
const LIGHTBOX = '[role="dialog"][aria-modal="true"][aria-label$="preview"]';

/** Same localhost CSP workaround as gallery-video.spec.ts (WebKit only). */
async function allowPlainHttpLocalhost(page: Page): Promise<void> {
  await page.route(
    (url) => url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname),
    async (route) => {
      if (route.request().resourceType() !== "document") return route.continue();
      const response = await route.fetch();
      const headers = { ...response.headers() };
      const csp = headers["content-security-policy"];
      if (csp) headers["content-security-policy"] = csp.replace(/upgrade-insecure-requests;?\s*/, "");
      return route.fulfill({ response, headers });
    },
  );
}

/** Load /gallery and return its tiles, or null when it has no media. */
async function openGallery(page: Page): Promise<Locator | null> {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("bh:cookie-consent", "denied");
    } catch {
      // Storage disabled: the banner shows; nothing here depends on it.
    }
  });
  await allowPlainHttpLocalhost(page);
  await page.goto("/gallery");
  await expect(
    page.locator(TILE).first().or(page.getByText(/^(No photos yet|No media found)$/)),
  ).toBeAttached({ timeout: 20_000 });
  const tiles = page.locator(TILE);
  if ((await tiles.count()) === 0) return null;
  // Wait for hydration: the click handler that opens the lightbox is client-side.
  await page.waitForLoadState("load");
  await page.waitForTimeout(1500);
  return tiles;
}

async function counter(page: Page): Promise<string> {
  return (await page.locator(LIGHTBOX).getByText(/^\d+ \/ \d+$/).textContent()) ?? "";
}

test.describe("Gallery grid", () => {
  test.setTimeout(60_000);

  test("groups tiles under event headers in fixed 4:3 boxes", async ({ page }) => {
    const tiles = await openGallery(page);
    test.skip(tiles === null, "no approved media in this environment");

    const section = page.locator("section[aria-labelledby]").first();
    await expect(section.getByRole("heading", { level: 2 })).toBeVisible();
    await expect(section.locator("time")).toHaveText(/\d{4}/);

    const box = await (tiles as Locator).first().boundingBox();
    expect(box).not.toBeNull();
    expect((box as { height: number; width: number }).height / (box as { width: number }).width).toBeCloseTo(0.75, 1);
  });

  test("two columns on phones, four on a 1280px desktop", async ({ page, isMobile }) => {
    const tiles = await openGallery(page);
    test.skip(tiles === null, "no approved media in this environment");

    const grid = page.locator("section[aria-labelledby] .grid").first();
    const lefts = await grid.evaluate((el) =>
      Array.from(el.children).map((c) => Math.round(c.getBoundingClientRect().left)),
    );
    const columns = new Set(lefts).size;
    const expected = isMobile ? 2 : (page.viewportSize()?.width ?? 0) >= 1280 ? 4 : 3;
    expect(columns).toBe(Math.min(expected, lefts.length));
  });
});

test.describe("Gallery lightbox", () => {
  test.setTimeout(60_000);

  test("opens on the item URL, steps with arrow keys, closes with Escape", async ({ page }) => {
    const tiles = await openGallery(page);
    test.skip(tiles === null, "no approved media in this environment");
    test.skip(((await tiles?.count()) ?? 0) < 2, "needs at least two items");

    const first = (tiles as Locator).first();
    const firstHref = await first.getAttribute("href");
    await first.click();
    const dialog = page.locator(LIGHTBOX);
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${firstHref}$`));
    expect(await counter(page)).toMatch(/^1 \//);

    // Focus sits on the dialog itself, not a <video>, so arrows move items.
    await dialog.focus();
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => counter(page)).toMatch(/^2 \//);
    await expect(page).not.toHaveURL(new RegExp(`${firstHref}$`));

    await dialog.focus();
    await page.keyboard.press("ArrowLeft");
    await expect.poll(() => counter(page)).toMatch(/^1 \//);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/gallery$/);
  });

  test("Next and Previous buttons move between items", async ({ page }) => {
    const tiles = await openGallery(page);
    test.skip(tiles === null, "no approved media in this environment");
    test.skip(((await tiles?.count()) ?? 0) < 2, "needs at least two items");

    await (tiles as Locator).first().click();
    const dialog = page.locator(LIGHTBOX);
    await expect(dialog.getByRole("button", { name: "Previous" })).toBeDisabled();
    await dialog.getByRole("button", { name: "Next" }).click();
    await expect.poll(() => counter(page)).toMatch(/^2 \//);
    await dialog.getByRole("button", { name: "Previous" }).click();
    await expect.poll(() => counter(page)).toMatch(/^1 \//);
    await dialog.getByRole("button", { name: "Close lightbox" }).click();
    await expect(dialog).toBeHidden();
  });

  test("controls have 44px targets and Tab stays inside the dialog", async ({ page, browserName, isMobile }) => {
    const tiles = await openGallery(page);
    test.skip(tiles === null, "no approved media in this environment");

    await (tiles as Locator).first().click();
    const dialog = page.locator(LIGHTBOX);
    await expect(dialog).toBeVisible();

    for (const name of ["Close lightbox", "Next", "Share"]) {
      const box = await dialog.getByRole("button", { name }).boundingBox();
      expect(box, name).not.toBeNull();
      expect((box as { height: number }).height, name).toBeGreaterThanOrEqual(44);
    }

    // Desktop WebKit only tabs to form fields unless "Press Tab to highlight
    // each item" is on, so the trap cannot be driven from the keyboard there.
    test.skip(browserName === "webkit" && !isMobile, "WebKit skips links and buttons on Tab by default");
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    }
  });

  test("swipe left moves to the next item on touch screens", async ({ page, isMobile }) => {
    test.skip(!isMobile, "swipe is a touch gesture");
    const tiles = await openGallery(page);
    test.skip(tiles === null, "no approved media in this environment");
    test.skip(((await tiles?.count()) ?? 0) < 2, "needs at least two items");

    await (tiles as Locator).first().click();
    const dialog = page.locator(LIGHTBOX);
    await expect(dialog).toBeVisible();

    // Start on the stage but off the media element, which handles its own
    // horizontal drags (video scrubbing).
    const stage = dialog.getByRole("button", { name: "Next" }).locator("..");
    const swiped = await stage.evaluate((el) => {
      if (typeof Touch === "undefined") return false;
      const r = el.getBoundingClientRect();
      const y = r.top + 8;
      const at = (x: number) => new Touch({ identifier: 1, target: el, clientX: x, clientY: y });
      el.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, touches: [at(r.right - 40)], changedTouches: [at(r.right - 40)] }));
      el.dispatchEvent(new TouchEvent("touchend", { bubbles: true, touches: [], changedTouches: [at(r.left + 40)] }));
      return true;
    });
    test.skip(!swiped, "this engine cannot construct Touch events");
    await expect.poll(() => counter(page)).toMatch(/^2 \//);
  });
});
