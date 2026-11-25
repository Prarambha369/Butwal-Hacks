import { chromium } from "@playwright/test";

/**
 * Opens VERCEL_SHARE_URL once and saves the access cookie it sets, so the
 * gallery matrix can run against a protected preview deployment. The file
 * lands under test-results/, which is git-ignored.
 */
export default async function globalSetup(): Promise<void> {
  const shareUrl = process.env.VERCEL_SHARE_URL;
  if (!shareUrl) return;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(shareUrl);
  await context.storageState({ path: "test-results/.vercel-share.json" });
  await browser.close();
}
