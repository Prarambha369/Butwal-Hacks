#!/usr/bin/env node
/**
 * Axe (serious/critical, WCAG 2.1 A/AA) and state screenshots for the event
 * pages against a deployed preview with real data — the local audit:ui run
 * only sees an empty database.
 *
 *   node scripts/events-preview-check.mjs --base=<preview> --share=<share url> --out=/tmp/events-check
 *
 * Paced for Vercel's per-IP rate limit; never point it at production.
 */
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium, devices } from "@playwright/test";

const require = createRequire(import.meta.url);
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, "").split("=");
    return [k, v.join("=")];
  }),
);
const base = (args.base ?? "http://localhost:3000").replace(/\/$/, "");
const out = args.out ?? "/tmp/events-check";
const delay = Number(args.delay ?? 6000);
mkdirSync(out, { recursive: true });

const pages = ["/events", "/events/cyberutsav-lumbini", "/events/hackday-butwal"];
// --combos=desktop:light,phone:dark limits the axe pass; default is all four.
const combos = args.combos ? new Set(args.combos.split(",")) : null;
const want = (vp, scheme) => !combos || combos.has(`${vp}:${scheme}`);
const report = [];
const browser = await chromium.launch();

async function context(opts) {
  const ctx = await browser.newContext(opts);
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem("bh:cookie-consent", "denied");
    } catch {
      /* storage blocked */
    }
  });
  const page = await ctx.newPage();
  if (args.share) {
    // The share link sets the access cookie on a redirect; confirm it took,
    // or every "page" below is Vercel's login screen (and axe audits that).
    for (let attempt = 0; attempt < 3; attempt++) {
      await page.goto(args.share, { waitUntil: "load" });
      await page.goto(base + "/events", { waitUntil: "load" });
      if (!/vercel\.com/.test(page.url()) && !(await page.title()).includes("Vercel")) break;
      if (attempt === 2) throw new Error("Vercel share cookie was not accepted");
      await page.waitForTimeout(delay);
    }
  }
  return { ctx, page };
}

async function axe(page) {
  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
  return page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] });
    return r.violations
      .filter((v) => v.impact === "critical" || v.impact === "serious")
      .map((v) => ({ id: v.id, count: v.nodes.length, target: v.nodes[0]?.target?.join(" ") }));
  });
}

// 1. Axe on every page, desktop + phone, light + dark (prefetch of other
//    pages blocked; it is not what is being audited).
for (const [vpName, vp] of [
  ["desktop", { viewport: { width: 1440, height: 900 } }],
  ["phone", { ...devices["iPhone 13"], defaultBrowserType: undefined }],
]) {
  for (const scheme of ["light", "dark"]) {
    if (!want(vpName, scheme)) continue;
    const { ctx, page } = await context({ ...vp, colorScheme: scheme });
    await page.route((u) => u.searchParams.has("_rsc"), (r) => r.abort());
    for (const path of pages) {
      let res = null;
      try {
        res = await page.goto(base + path, { waitUntil: "load", timeout: 60_000 });
      } catch (error) {
        console.log(`UNAVAILABLE ${vpName}/${scheme} ${path}: ${error instanceof Error ? error.message.split("\n")[0] : error}`);
        report.push({ path, vp: vpName, scheme, unavailable: true, error: String(error).slice(0, 200) });
        continue;
      }
      await page.waitForTimeout(1500);
      // A 429 or error page does not make goto() throw; never audit it as
      // the event page. Require a 200 and the page's own h1.
      // Same host and path as requested (no redirect), and an h1: the events
      // list says "Events"; a detail page's h1 is the event title.
      const landed = new URL(page.url());
      const h1 = ((await page.locator("h1").first().textContent().catch(() => "")) ?? "").trim();
      const isEventPage =
        res?.ok() &&
        landed.origin === new URL(base).origin &&
        landed.pathname === path &&
        (path === "/events" ? h1 === "Events" : h1.length > 0);
      if (!isEventPage) {
        report.push({ path, vp: vpName, scheme, status: res?.status(), unavailable: true });
        console.log(`UNAVAILABLE ${res?.status()} ${vpName}/${scheme} ${path} (not audited)`);
        await page.waitForTimeout(delay);
        continue;
      }
      const violations = await axe(page);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      report.push({ path, vp: vpName, scheme, status: res?.status(), overflow, violations });
      console.log(`${res?.status()} ${vpName}/${scheme} ${path} axe=${violations.length} overflow=${overflow}`);
      if (path.includes("hackday")) {
        await page.screenshot({ path: `${out}/hackday-${vpName}-${scheme}.png`, fullPage: true });
      }
      await page.waitForTimeout(delay);
    }
    await ctx.close();
  }
}

writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));

/** A state screenshot that fails (rate limit, slow page) is reported, not fatal. */
async function shot(label, fn) {
  try {
    await fn();
  } catch (error) {
    console.log(`screenshot ${label} failed: ${error instanceof Error ? error.message.split("\n")[0] : error}`);
  }
}

// 2. Phone: sticky CTA after scrolling (viewport shot, not full page), and
//    the Registered state (signed-in answers mocked; nothing is written).
{
  const { ctx, page } = await context({ ...devices["iPhone 13"], defaultBrowserType: undefined, colorScheme: "light" });
  await page.route((u) => u.searchParams.has("_rsc"), (r) => r.abort());
  await page.goto(base + "/events/cyberutsav-lumbini", { waitUntil: "load" });
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 1400));
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/sticky-phone-signed-out.png` });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await shot("signed-out", () => page.locator("#register").screenshot({ path: `${out}/cta-phone-signed-out.png` }));
  await page.waitForTimeout(delay);

  await page.route("**/auth/profile", (r) => r.fulfill({ json: { sub: "auth0|e2e-fake-user", name: "E2E" } }));
  await page.route(/\/api\/events\/register\?event_id=/, (r) => r.fulfill({ json: { registered: false } }));
  await page.goto(base + "/events/cyberutsav-lumbini", { waitUntil: "load" });
  await page.waitForTimeout(2000);
  await shot("register", () => page.locator("#register").screenshot({ path: `${out}/cta-phone-register.png` }));
  await page.evaluate(() => window.scrollTo(0, 1400));
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/sticky-phone-register.png` });
  await page.waitForTimeout(delay);

  await page.unroute(/\/api\/events\/register\?event_id=/);
  await page.route(/\/api\/events\/register\?event_id=/, (r) => r.fulfill({ json: { registered: true } }));
  await page.goto(base + "/events/cyberutsav-lumbini", { waitUntil: "load" });
  await page.waitForTimeout(2000);
  await shot("registered", () => page.locator("#register").screenshot({ path: `${out}/cta-phone-registered.png` }));
  await ctx.close();
}

// 3. Page-path requests for one detail-page visit (prefetch NOT blocked).
{
  const { ctx, page } = await context({ viewport: { width: 1440, height: 900 } });
  const origin = new URL(base).origin;
  const seen = [];
  page.on("request", (req) => {
    const u = new URL(req.url());
    if (u.origin !== origin) return;
    if (req.resourceType() === "document" || u.searchParams.has("_rsc")) seen.push(u.pathname + u.search);
  });
  await page.goto(base + "/events/cyberutsav-lumbini", { waitUntil: "load" });
  await page.waitForTimeout(4000);
  const docs = seen.filter((s) => s.startsWith("/events/cyberutsav-lumbini") && !s.includes("_rsc"));
  report.push({ detailRequests: seen });
  console.log(`detail page-path requests: ${seen.length} (${docs.length} document) → ${seen.join(", ")}`);
  await ctx.close();
}

writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
await browser.close();
