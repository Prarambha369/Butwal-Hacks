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

export default defineConfig({
  ...video,
  testMatch: /events\.spec\.ts$/,
  globalSetup: shareUrl ? "./e2e/vercel-share.setup.ts" : undefined,
  use: { ...video.use, ...(shareUrl ? { storageState: "test-results/.vercel-share.json" } : {}) },
});
