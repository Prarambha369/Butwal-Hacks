import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.config";

/**
 * Cross-browser matrix for gallery video playback (e2e/gallery-video.spec.ts).
 *
 * Kept out of the default config on purpose: CI installs Chromium only, and
 * the rest of the suite has nothing engine-specific to prove. Run it after
 * touching anything in the <video>/<source> path:
 *
 *   npx playwright install chromium firefox webkit
 *   npx playwright test -c playwright.video.config.ts
 *
 * Set PLAYWRIGHT_BASE_URL to aim it at a deployed preview instead of a local
 * server; VIDEO_SCREENSHOT_DIR collects one screenshot per browser and test.
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  ...base,
  testMatch: /gallery-video\.spec\.ts$/,
  use: { ...base.use, ...(baseURL ? { baseURL } : {}) },
  webServer: baseURL ? undefined : base.webServer,
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "iphone-webkit", use: { ...devices["iPhone 15"] } },
    { name: "pixel-chromium", use: { ...devices["Pixel 7"] } },
  ],
});
