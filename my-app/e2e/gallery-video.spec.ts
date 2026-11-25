import type { Locator, Page, TestInfo } from "@playwright/test";
import { test, expect } from "./fixtures";

/**
 * Gallery video playback in real browser engines.
 *
 * Runs in Chromium under the default config. For the full matrix (Chromium,
 * Firefox, WebKit, iPhone and Pixel emulation) use the video config:
 *
 *   npx playwright install chromium firefox webkit
 *   npx playwright test -c playwright.video.config.ts
 *
 * Playwright's Chromium is an open-source build with no H.264 decoder, so it
 * reports `canPlayType('video/mp4; codecs="avc1…"') === ""` and plays the VP9
 * WebM: it stands in for the Firefox-on-Linux-without-ffmpeg case for free.
 *
 * Like the share-link spec, these need at least one approved video in the
 * gallery. Uploads are signed and moderated, so a spec cannot seed one and
 * CI's database is empty; the tests skip with that reason instead of failing.
 */

const VIDEO_TILE = 'a[href^="/gallery/"]:has(video)';

/**
 * WebKit applies the CSP's `upgrade-insecure-requests` to http://localhost
 * (Chromium and Firefox exempt it), so against a local `next start` every
 * script and chunk is rewritten to https://localhost and the page never
 * hydrates. Drop that one directive for plain-http localhost documents only;
 * a deployed HTTPS preview is tested with its CSP untouched.
 */
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

/** First video tile on /gallery, or null when the gallery has no videos. */
async function firstVideoTile(page: Page): Promise<Locator | null> {
  // Decline cookies up front. The consent banner otherwise slides in over the
  // lower tiles a moment after load, and the pointer "leaving" onto it pauses
  // a hover preview — correct behaviour, but not what these tests measure.
  await page.addInitScript(() => {
    try {
      localStorage.setItem("bh:cookie-consent", "denied");
    } catch {
      // Storage disabled: the banner shows, and the hover test may flake.
    }
  });
  await allowPlainHttpLocalhost(page);
  await page.goto("/gallery");
  await expect(
    page.locator('a[href^="/gallery/"]').first().or(page.getByText(/^(No photos yet|No media found)$/)),
  ).toBeVisible();
  const tiles = page.locator(VIDEO_TILE);
  return (await tiles.count()) > 0 ? tiles.first() : null;
}

/**
 * Wait until the element can play through (readyState >= 3) and its clock
 * actually moves. readyState alone passes on a stalled decoder; a moving
 * currentTime is what the viewer sees as "it plays".
 */
async function expectPlaying(video: Locator): Promise<void> {
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.readyState), { timeout: 30_000 })
    .toBeGreaterThanOrEqual(3);
  const start = await video.evaluate((v: HTMLVideoElement) => v.currentTime);
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 15_000 })
    .toBeGreaterThan(start + 0.2);
  expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(false);
}

/** Which rendition the engine chose: "mp4" or "webm". */
async function chosenFormat(video: Locator): Promise<string> {
  const src = await video.evaluate((v: HTMLVideoElement) => v.currentSrc);
  return src.endsWith(".webm") ? "webm" : src.endsWith(".mp4") ? "mp4" : src;
}

async function shoot(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  const dir = process.env.VIDEO_SCREENSHOT_DIR;
  const path = dir ? `${dir}/${testInfo.project.name || "chromium"}-${name}.png` : testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path });
  await testInfo.attach(name, { path, contentType: "image/png" });
}

/** Open the lightbox for the first video tile and return its <video>. */
async function openLightbox(page: Page, tile: Locator): Promise<Locator> {
  await tile.click();
  const video = page.getByRole("dialog").locator("video");
  await expect(video).toBeVisible();
  return video;
}

test.describe("Gallery video playback", () => {
  test.setTimeout(90_000);

  test("lightbox video loads and plays", async ({ page }, testInfo) => {
    const tile = await firstVideoTile(page);
    test.skip(tile === null, "no approved videos in this environment");

    const video = await openLightbox(page, tile as Locator);
    await expectPlaying(video);
    testInfo.annotations.push({ type: "format", description: await chosenFormat(video) });
    await shoot(page, testInfo, "lightbox");
  });

  test("hover preview plays muted", async ({ page, isMobile }, testInfo) => {
    test.skip(isMobile, "touch devices have no hover; tapping opens the lightbox");
    const tile = await firstVideoTile(page);
    test.skip(tile === null, "no approved videos in this environment");

    const video = (tile as Locator).locator("video");
    await (tile as Locator).hover();
    await expectPlaying(video);
    expect(await video.evaluate((v: HTMLVideoElement) => v.muted)).toBe(true);
    await shoot(page, testInfo, "hover");

    // Leaving the tile pauses it.
    await page.mouse.move(0, 0);
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  });

  test("hover preview stays still under prefers-reduced-motion", async ({ page, isMobile }) => {
    test.skip(isMobile, "touch devices have no hover");
    await page.emulateMedia({ reducedMotion: "reduce" });
    const tile = await firstVideoTile(page);
    test.skip(tile === null, "no approved videos in this environment");

    const video = (tile as Locator).locator("video");
    await (tile as Locator).hover();
    await page.waitForTimeout(1500);
    expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  });

  test("a blocked MP4 falls back to the WebM and keeps playing", async ({ page }, testInfo) => {
    // A failed fetch fires `error` on the <source>, and resource selection
    // moves on to the next one. This is the path a 404/423 from the CDN takes.
    await page.route(/\/video\/upload\/.*\.mp4(\?|$)/, (route) => route.abort());
    const tile = await firstVideoTile(page);
    test.skip(tile === null, "no approved videos in this environment");

    const video = await openLightbox(page, tile as Locator);
    await expectPlaying(video);
    expect(await chosenFormat(video)).toBe("webm");
    await shoot(page, testInfo, "fallback-blocked-mp4");
  });

  test("a decode failure on the MP4 resumes playback from the WebM", async ({ page }, testInfo) => {
    // The case the onError handler exists for: the engine claimed the MP4,
    // fetched it, and its decoder then failed (Firefox with OpenH264 on a High
    // profile stream). That fires `error` on the <video> and does not advance
    // to the next <source>. No engine here reproduces that decoder on demand,
    // so inject the same event into a video that is really playing the MP4 and
    // check the real load()/play() sequence ends up playing the WebM.
    const tile = await firstVideoTile(page);
    test.skip(tile === null, "no approved videos in this environment");

    const video = await openLightbox(page, tile as Locator);
    await expectPlaying(video);
    test.skip(
      (await chosenFormat(video)) !== "mp4",
      "this engine has no H.264 decoder and already plays the WebM (covered by the tests above)",
    );

    await video.evaluate((v: HTMLVideoElement) => {
      Object.defineProperty(v, "error", { configurable: true, value: { code: 3 } });
      v.dispatchEvent(new Event("error"));
      // The element now has no real error; let the reload report its own.
      delete (v as { error?: unknown }).error;
    });

    await expect.poll(() => chosenFormat(video), { timeout: 15_000 }).toBe("webm");
    await expectPlaying(video);
    await shoot(page, testInfo, "fallback-decode-error");
  });

  test("a paused video stays paused through the decode fallback", async ({ page }) => {
    const tile = await firstVideoTile(page);
    test.skip(tile === null, "no approved videos in this environment");

    // The canonical page renders the player without autoplay.
    await page.goto((await (tile as Locator).getAttribute("href")) as string);
    const video = page.locator("article video");
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.readyState), { timeout: 30_000 })
      .toBeGreaterThanOrEqual(1);
    test.skip((await chosenFormat(video)) !== "mp4", "this engine already plays the WebM");

    await video.evaluate((v: HTMLVideoElement) => {
      Object.defineProperty(v, "error", { configurable: true, value: { code: 3 } });
      v.dispatchEvent(new Event("error"));
      delete (v as { error?: unknown }).error;
    });
    await expect.poll(() => chosenFormat(video), { timeout: 15_000 }).toBe("webm");
    await page.waitForTimeout(1000);
    expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  });
});
