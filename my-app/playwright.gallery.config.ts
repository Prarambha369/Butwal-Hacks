import { defineConfig } from "@playwright/test";
import video from "./playwright.video.config";

/**
 * The whole gallery in every engine: grid, lightbox, keyboard, swipe
 * (e2e/gallery-lightbox.spec.ts) plus video playback (e2e/gallery-video.spec.ts),
 * on the same Chromium / Firefox / WebKit / iPhone / Pixel matrix.
 *
 *   npx playwright install chromium firefox webkit
 *   npx playwright test -c playwright.gallery.config.ts
 *
 * PLAYWRIGHT_BASE_URL aims it at a deployed preview. A preview behind Vercel
 * Authentication also needs VERCEL_SHARE_URL: a share link
 * (…/?_vercel_share=…) that the global setup opens once to collect the access
 * cookie for every browser. Never point this at production.
 */
const shareUrl = process.env.VERCEL_SHARE_URL;

export default defineConfig({
  ...video,
  testMatch: /gallery-(video|lightbox)\.spec\.ts$/,
  globalSetup: shareUrl ? "./e2e/vercel-share.setup.ts" : undefined,
  use: { ...video.use, ...(shareUrl ? { storageState: "test-results/.vercel-share.json" } : {}) },
});
