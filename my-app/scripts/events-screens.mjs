#!/usr/bin/env node
/**
 * Captures /events and one /events/<slug> page at phone and desktop width, in
 * light and dark, for before/after comparison in a PR.
 *
 *   node scripts/events-screens.mjs --base=http://localhost:3000 --slug=hackday-butwal --out=/tmp/events-after
 *
 * --share=<url> opens a Vercel share link first, for a protected preview.
 * Never point this at production (Vercel rate limits).
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, "").split("=");
    return [k, v.join("=")];
  }),
);
const base = (args.base ?? "http://localhost:3000").replace(/\/$/, "");
const out = args.out ?? "/tmp/events-screens";
const slug = args.slug ?? "hackday-butwal";
const prefix = args.prefix ?? "";
// Pause between page loads: previews share Vercel's per-IP rate limit.
const delay = Number(args.delay ?? 5000);
mkdirSync(out, { recursive: true });

const viewports = [
  { name: "phone", width: 390, height: 844, isMobile: true },
  { name: "desktop", width: 1440, height: 900, isMobile: false },
];
const schemes = ["light", "dark"];
const pages = [
  { name: "events", path: "/events" },
  { name: "detail", path: `/events/${slug}` },
];

const browser = await chromium.launch();
for (const vp of viewports) {
  for (const scheme of schemes) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
      deviceScaleFactor: vp.isMobile ? 2 : 1,
      colorScheme: scheme,
    });
    await context.addInitScript(() => {
      try {
        localStorage.setItem("bh:cookie-consent", "denied");
      } catch {
        /* storage blocked: the banner shows */
      }
    });
    const page = await context.newPage();
    // The site header prefetches its own links; they are not what is being
    // captured and only spend the rate limit.
    await page.route((url) => url.searchParams.has("_rsc"), (route) => route.abort());
    if (args.share) await page.goto(args.share);
    for (const p of pages) {
      await page.goto(base + p.path, { waitUntil: "load", timeout: 60_000 });
      await page.waitForTimeout(1500);
      const file = `${out}/${prefix}${p.name}-${vp.name}-${scheme}.png`;
      await page.screenshot({ path: file, fullPage: true });
      console.log(file);
      await page.waitForTimeout(delay);
    }
    await context.close();
  }
}
await browser.close();
