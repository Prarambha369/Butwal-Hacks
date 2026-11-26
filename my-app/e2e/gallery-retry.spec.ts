import type { BrowserContext, Page } from "@playwright/test";
import { test, expect } from "./fixtures";

/**
 * Gallery failure states, forced by route-blocking: a failed next page, a
 * failed event filter, a failed tile and a failed lightbox photo. Each must
 * put its error message first and its Retry button after it, at the bottom of
 * whatever failed, and nothing may retry on its own (the edge firewall caps
 * page-path requests per IP, and pagination is a server action posted to the
 * page path).
 *
 * Needs approved media in the gallery (CI's database is empty, so these skip
 * there). For the full engine matrix:
 *
 *   npx playwright test -c playwright.gallery.config.ts
 *
 * Never point this at production.
 */

const TILE = 'a[href^="/gallery/"]:has(img, video)';
const LIGHTBOX = '[role="dialog"][aria-modal="true"][aria-label$="preview"]';
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAABAAAAAMCAIAAADkharWAAAAFElEQVR4nGM4QyJgGNUwGkpnsAIAQy3LEKNin9sAAAAASUVORK5CYII=",
  "base64",
);

/** `fullSize` fails only lightbox-sized images: grid tiles stop at w_800. */
type Blocks = { actions: boolean; media: boolean; fullSize: boolean };

/**
 * Route switches for the context. Server actions carry a `next-action`
 * header; aborting them is what a dropped connection or a 429 looks like to
 * the client. Media is answered locally either way, so no bytes leave the
 * machine and no real CDN is hit.
 */
async function blockable(context: BrowserContext): Promise<Blocks> {
  const blocks: Blocks = { actions: false, media: false, fullSize: false };
  await context.route(
    (url) => ["localhost", "127.0.0.1"].includes(url.hostname),
    async (route) => {
      const request = route.request();
      if (blocks.actions && request.method() === "POST" && request.headers()["next-action"]) {
        return route.abort("failed");
      }
      // WebKit enforces upgrade-insecure-requests on plain-http localhost.
      if (request.resourceType() !== "document") return route.continue();
      const response = await route.fetch();
      const headers = { ...response.headers() };
      const csp = headers["content-security-policy"];
      if (csp) headers["content-security-policy"] = csp.replace(/upgrade-insecure-requests;?\s*/, "");
      return route.fulfill({ response, headers });
    },
  );
  await context.route("https://res.cloudinary.com/**", (route) => {
    const width = Number(/\/w_(\d+)/.exec(route.request().url())?.[1] ?? 0);
    return blocks.media || (blocks.fullSize && width > 800)
      ? route.abort("failed")
      : // no-store: a later request for the same URL (the lightbox can pick a
        // srcset width the grid already fetched) must reach this route.
        route.fulfill({ status: 200, contentType: "image/png", body: PNG, headers: { "cache-control": "no-store" } });
  });
  return blocks;
}

/** Load /gallery; false when it has no media. */
async function openGallery(page: Page): Promise<boolean> {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("bh:cookie-consent", "denied");
    } catch {
      // Storage disabled: the banner shows; nothing here depends on it.
    }
  });
  await page.goto("/gallery");
  await expect(
    page.locator(TILE).first().or(page.getByText(/^(No photos yet|No media found)$/)),
  ).toBeAttached({ timeout: 20_000 });
  if ((await page.locator(TILE).count()) === 0) return false;
  await page.waitForLoadState("load");
  await page.waitForTimeout(1500);
  return true;
}

/** Number of page-path POSTs (server actions) sent while `fn` runs. */
async function countActions(page: Page, fn: () => Promise<void>): Promise<number> {
  let n = 0;
  const onRequest = (r: { method(): string; headers(): Record<string, string> }) => {
    if (r.method() === "POST" && r.headers()["next-action"]) n++;
  };
  page.on("request", onRequest);
  await fn();
  page.off("request", onRequest);
  return n;
}

test.describe("Gallery failure states", () => {
  test.setTimeout(90_000);

  test("a failed next page reports below the loaded items, with Retry last", async ({ page, context }) => {
    const blocks = await blockable(context);
    test.skip(!(await openGallery(page)), "no approved media in this environment");
    const loadMore = page.getByRole("button", { name: "Load more" });
    test.skip((await loadMore.count()) === 0, "only one page of media here");

    blocks.actions = true;
    const retry = page.getByRole("button", { name: /^Try again/ });
    // Scroll through the sentinel like a finger would; fall back to the
    // button where script-driven scrolls do not reach the observer.
    for (let i = 0; i < 80 && !(await retry.isVisible()); i++) {
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(150);
    }
    if (!(await retry.isVisible())) await loadMore.click({ force: true });
    await expect(retry).toBeVisible();

    const alert = page.getByRole("alert").filter({ hasText: "Couldn't load more media" });
    await expect(alert).toBeVisible();
    const lastTile = page.locator(TILE).last();
    const [tileBox, alertBox, retryBox] = await Promise.all([
      lastTile.boundingBox(),
      alert.boundingBox(),
      retry.boundingBox(),
    ]);
    expect(alertBox!.y).toBeGreaterThanOrEqual(tileBox!.y + tileBox!.height);
    expect(retryBox!.y).toBeGreaterThan(alertBox!.y);

    // Visible focus ring on keyboard focus.
    await retry.focus();
    await expect(retry).toBeFocused();

    // Nothing retries by itself, however much the visitor scrolls.
    const sent = await countActions(page, async () => {
      for (let i = 0; i < 6; i++) {
        await page.mouse.wheel(0, i % 2 ? 400 : -400).catch(() => {});
        await page.waitForTimeout(500);
      }
      await page.waitForTimeout(3000);
    });
    expect(sent).toBe(0);

    // A second failure backs off: the button waits before it can be pressed.
    const second = await countActions(page, async () => {
      await retry.click();
      await expect(retry).toHaveText(/Try again in \d+s/);
    });
    expect(second).toBe(1);
    // aria-disabled, not disabled, so keyboard focus stays on the button.
    await expect(retry).toHaveAttribute("aria-disabled", "true");
    await expect(retry).toBeFocused();

    // Back online: Retry loads the page and the error goes away.
    blocks.actions = false;
    await expect(retry).toHaveText("Try again", { timeout: 10_000 });
    await retry.click();
    await expect(alert).toBeHidden();
  });

  test("a failed event filter reports under the chips and re-applies it", async ({ page, context }) => {
    const blocks = await blockable(context);
    test.skip(!(await openGallery(page)), "no approved media in this environment");
    const chips = page.getByRole("group", { name: "Filter by event" }).getByRole("button");
    test.skip((await chips.count()) < 2, "only one event here");

    blocks.actions = true;
    await chips.nth(1).click();
    const alert = page.getByRole("alert").filter({ hasText: "Couldn't load media" });
    await expect(alert).toBeVisible();
    const retry = page.getByRole("button", { name: "Try again" });
    expect((await retry.boundingBox())!.y).toBeGreaterThan((await alert.boundingBox())!.y);

    blocks.actions = false;
    await retry.click();
    await expect(alert).toBeHidden();
    await expect(page.locator(TILE).first()).toBeVisible();
  });

  test("a failed tile shows its message with Retry at the bottom", async ({ page, context }) => {
    const blocks = await blockable(context);
    blocks.media = true;
    test.skip(!(await openGallery(page)), "no approved media in this environment");

    const retry = page.getByRole("button", { name: /^Retry loading / }).first();
    await expect(retry).toBeVisible();
    // Beside the card link, never inside it.
    expect(await retry.evaluate((el) => el.closest("a") === null)).toBe(true);

    // Back online: that tile's Retry reloads it and its error goes away.
    // (Labels repeat across uncaptioned tiles and lazy tiles keep failing as
    // they scroll in, so follow this one tile rather than a count.)
    blocks.media = false;
    await retry.evaluate((el) => el.closest(".group")?.setAttribute("data-test-tile", "retried"));
    const tile = page.locator('[data-test-tile="retried"]');
    await retry.click();
    await expect(tile.getByRole("button", { name: /^Retry loading / })).toHaveCount(0);
    await expect(tile.locator("img")).toBeVisible();
  });

  test("a video tile whose poster fails offers Retry, not a blank box", async ({ page, context }) => {
    await blockable(context);
    // Only video deliveries fail; photos load as usual. Registered after
    // blockable(): the newest matching route wins.
    await context.route(
      (url) => url.hostname === "res.cloudinary.com" && url.pathname.includes("/video/upload/"),
      (route) => route.abort("failed"),
    );
    test.skip(!(await openGallery(page)), "no approved media in this environment");
    const video = page.locator('a[href^="/gallery/"][aria-label*="video"]').first();
    test.skip((await video.count()) === 0, "no videos here");

    await video.scrollIntoViewIfNeeded();
    const tile = video.locator("xpath=..");
    await expect(tile.getByText("Couldn't load this video.")).toBeVisible();
    await expect(tile.getByRole("button", { name: /^Retry loading / })).toBeVisible();
  });

  test("a failed lightbox photo shows its message with Retry under it", async ({ page, context }) => {
    const blocks = await blockable(context);
    test.skip(!(await openGallery(page)), "no approved media in this environment");
    const photo = page.locator(`${TILE}:has(img)`).first();
    test.skip((await photo.count()) === 0, "no photos here");

    // The grid has loaded; now the lightbox's own full-size request fails.
    blocks.fullSize = true;
    await photo.click();
    const dialog = page.locator(LIGHTBOX);
    const alert = dialog.getByRole("alert");
    await expect(alert).toContainText("Couldn't load this");
    const retry = dialog.getByRole("button", { name: "Retry" });
    expect((await retry.boundingBox())!.y).toBeGreaterThan((await alert.boundingBox())!.y);

    blocks.fullSize = false;
    await retry.click();
    await expect(alert).toBeHidden();
  });
});
