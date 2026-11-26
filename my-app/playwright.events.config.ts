import { defineConfig } from "@playwright/test";
import video from "./playwright.video.config";

/**
 * /events and /events/<slug> (e2e/events.spec.ts) on the same Chromium /
 * Firefox / WebKit / iPhone / Pixel matrix as the gallery.
 *
 *   npx playwright install chromium firefox webkit
 *   npx playwright test -c playwright.events.config.ts
 *
 * PLAYWRIGHT_BASE_URL aims it at a local build or a PR preview. A preview
 * behind Vercel Authentication also needs VERCEL_SHARE_URL (see
 * e2e/vercel-share.setup.ts). Never point this at production.
 */
const shareUrl = process.env.VERCEL_SHARE_URL;
// A deployed preview is reached over the network and shares a per-IP rate
// limit, so one retry absorbs a slow or throttled response there. Local runs
// keep zero retries so real failures stay loud.
const remote = Boolean(process.env.PLAYWRIGHT_BASE_URL && !/localhost|127\.0\.0\.1/.test(process.env.PLAYWRIGHT_BASE_URL));

export default defineConfig({
  ...video,
  testMatch: /events\.spec\.ts$/,
  retries: remote ? 1 : 0,
  globalSetup: shareUrl ? "./e2e/vercel-share.setup.ts" : undefined,
  use: { ...video.use, ...(shareUrl ? { storageState: "test-results/.vercel-share.json" } : {}) },
});
