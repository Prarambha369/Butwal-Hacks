import type { Page, Route } from "@playwright/test";
import { test, expect } from "./fixtures";

/**
 * /events and /events/<slug> in real browser engines: the list's hierarchy
 * and empty state, card CTAs, the detail page's CTA states (signed out,
 * signed in, already registered, past), add-to-calendar, share, the sticky
 * mobile bar and keyboard navigation.
 *
 * Signed-in states are simulated by answering the two requests the page makes
 * (`/auth/profile` and `GET /api/events/register`); nothing is written. The
 * consent modal is opened but never submitted.
 *
 * Runs in Chromium under the default config. For the full matrix (Chromium,
 * Firefox, WebKit, iPhone and Pixel emulation):
 *
 *   npx playwright test -c playwright.events.config.ts
 *
 * Point PLAYWRIGHT_BASE_URL at a local build or a PR preview, never at
 * production. Data-dependent tests skip with a reason when the database has
 * no matching event (CI's database is empty).
 */

const CARD_CTA = 'article a[aria-label^="Register:"], article a[aria-label^="View details:"], article a[aria-label^="See recap:"]';

/** Same localhost CSP workaround as the gallery specs (WebKit only). */
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

async function prepare(page: Page, { blockPrefetch = true } = {}): Promise<void> {
  // A deployed preview shares Vercel's per-IP rate limit with everything else
  // on this machine; pace remote runs so the matrix does not trip it.
  const base = process.env.PLAYWRIGHT_BASE_URL ?? "";
  if (base && !/localhost|127\.0\.0\.1/.test(base)) await page.waitForTimeout(8000);
  // Other pages' RSC prefetches (site header, bottom nav) are irrelevant here
  // and spend the preview's per-IP rate limit; only the request-count test
  // lets them through, because counting them is its job.
  if (blockPrefetch) {
    await page.route(
      (url) => url.searchParams.has("_rsc") && !url.pathname.startsWith("/events"),
      (route) => route.abort(),
    );
  }
  await page.addInitScript(() => {
    try {
      localStorage.setItem("bh:cookie-consent", "denied");
    } catch {
      // Storage disabled: the banner shows; nothing here depends on it.
    }
  });
  await allowPlainHttpLocalhost(page);
}

async function signedIn(page: Page, registered: boolean): Promise<void> {
  await page.route("**/auth/profile", (route: Route) =>
    route.fulfill({ json: { sub: "auth0|e2e-fake-user", name: "E2E Tester", email: "e2e@example.com" } }),
  );
  await page.route(/\/api\/events\/register\?event_id=/, (route: Route) =>
    route.fulfill({ json: { registered }, headers: { "Cache-Control": "private, no-store" } }),
  );
}

async function signedOut(page: Page): Promise<void> {
  await page.route("**/auth/profile", (route: Route) => route.fulfill({ status: 204, body: "" }));
}

/** Slugs of upcoming and past events, read from the list page. */
interface Slugs {
  /** An event still taking registrations (its card says "Register"). */
  upcoming: string | null;
  /** Any not-yet-ended event, including a live one ("View details"). */
  current: string | null;
  past: string | null;
}
let slugCache: Slugs | null = null;

async function findSlugs(page: Page): Promise<Slugs> {
  // One list visit per worker, not one per test.
  if (slugCache) return slugCache;
  await page.goto("/events");
  await expect(page.locator("article").first().or(page.getByText("No upcoming events right now")).first()).toBeVisible({
    timeout: 20_000,
  });
  const hrefOf = async (selector: string) => {
    const link = page.locator(selector).first();
    return (await link.count()) > 0 ? link.getAttribute("href") : null;
  };
  const upcoming = await hrefOf('article a[aria-label^="Register:"]');
  const current = await hrefOf('article a[aria-label^="Register:"], article a[aria-label^="View details:"]');
  const past = await hrefOf('article a[aria-label^="See recap:"]');
  const slug = (href: string | null) => href?.match(/^\/events\/([^/#?]+)/)?.[1] ?? null;
  slugCache = { upcoming: slug(upcoming), current: slug(current), past: slug(past) };
  return slugCache;
}

test.describe("/events list", () => {
  test.beforeEach(async ({ page }, info) =>
    prepare(page, { blockPrefetch: !info.title.startsWith("renders the hierarchy") }),
  );

  test("renders the hierarchy (or the empty state) without overflow", async ({ page, baseURL }, info) => {
    // Page-path requests for one visit: the document plus any RSC/prefetch
    // fetches of other pages (production WAF budget: 120 page requests per IP
    // per minute). Event links have prefetch off, so none of these may be an
    // /events/* page; the site-wide header and bottom nav prefetch their own
    // few links, which are counted and reported but not owned by this page.
    const origin = new URL(baseURL ?? "http://localhost:3000").origin;
    const pageRequests: string[] = [];
    page.on("request", (req) => {
      const url = new URL(req.url());
      if (url.origin !== origin) return;
      const isRsc = url.searchParams.has("_rsc") || req.headers()["rsc"] === "1";
      if (req.resourceType() === "document" || isRsc) pageRequests.push(url.pathname + url.search);
    });

    await page.goto("/events");
    await expect(page.getByRole("heading", { level: 1, name: "Events" })).toBeVisible();

    const cards = page.locator("article");
    const empty = page.getByText("No upcoming events right now");
    await expect(cards.first().or(empty).first()).toBeVisible({ timeout: 20_000 });

    if ((await cards.count()) > 0) {
      // Grid cards hold a 16:9 banner box before and after images load (no
      // layout shift). The featured card stretches its banner beside the
      // details on wide screens, so it is not measured here.
      const gridBanner = page.locator("ul article > div").first();
      if ((await gridBanner.count()) > 0) {
        const box = await gridBanner.boundingBox();
        if (box) expect(Math.abs(box.width / box.height - 16 / 9)).toBeLessThan(0.05);
      }
      // One CTA per card, and it is the card's only link.
      const links = await cards.first().locator("a").count();
      expect(links).toBe(1);
    }

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    // Let idle work (hydration, any prefetch) happen, then count.
    await page.waitForTimeout(3000);
    info.annotations.push({ type: "page-path requests", description: String(pageRequests.length) });
    console.log(`[events] page-path requests for one /events visit: ${pageRequests.length} → ${pageRequests.join(", ")}`);
    expect(pageRequests.filter((p) => p.startsWith("/events/"))).toEqual([]);
    expect(pageRequests.filter((p) => !p.includes("_rsc"))).toHaveLength(1);
  });

  test("card CTA leads to the event page", async ({ page }) => {
    await page.goto("/events");
    const cta = page.locator(CARD_CTA).first();
    test.skip((await cta.count()) === 0, "No published events in this database");
    const href = await cta.getAttribute("href");
    await cta.click();
    await expect(page).toHaveURL(new RegExp(href!.replace(/#.*$/, "").replace(/[/]/g, "\\/")));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("keyboard: Tab reaches a card CTA with a visible focus ring", async ({ page, browserName }) => {
    await page.goto("/events");
    const cta = page.locator(CARD_CTA).first();
    test.skip((await cta.count()) === 0, "No published events in this database");
    // WebKit only tabs to links with "Press Tab to highlight each item" on;
    // the focus *style* is what this checks, so focus it directly there.
    if (browserName === "webkit") {
      await cta.focus();
    } else {
      for (let i = 0; i < 60; i++) {
        await page.keyboard.press("Tab");
        if (await cta.evaluate((el) => el === document.activeElement)) break;
      }
    }
    await expect(cta).toBeFocused();
    const ring = await cta.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(ring).not.toBe("none");
  });
});

test.describe("/events/<slug> detail", () => {
  test.beforeEach(async ({ page }) => prepare(page));

  test("signed out, upcoming: Sign in to register; breadcrumbs, calendar and meta", async ({ page }) => {
    const { upcoming } = await findSlugs(page);
    test.skip(!upcoming, "No event open for registration in this database");
    await signedOut(page);
    await page.goto(`/events/${upcoming}`);

    const crumbs = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(crumbs.getByRole("link", { name: "Events" })).toHaveAttribute("href", "/events");

    const hero = page.locator("#register");
    await expect(hero.getByRole("link", { name: "Sign in to register" })).toBeVisible();
    await expect(page.getByText("Free admission — no registration fee")).toBeVisible();

    // JSON-LD Event and Open Graph are present.
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ld.some((t) => t.includes('"@type":"Event"'))).toBe(true);
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);

    // The .ics comes from our own route.
    const ics = await page.request.get(`/api/events/ical?slug=${upcoming}`);
    expect(ics.status()).toBe(200);
    expect(ics.headers()["content-type"]).toContain("text/calendar");
    expect(await ics.text()).toContain("BEGIN:VEVENT");
  });

  test("signed in, not registered: Register opens the consent dialog", async ({ page }) => {
    const { upcoming } = await findSlugs(page);
    test.skip(!upcoming, "No event open for registration in this database");
    await signedIn(page, false);
    await page.goto(`/events/${upcoming}`);
    const register = page.locator("#register").getByRole("button", { name: /Register — it's free/ });
    await expect(register).toBeVisible();
    await register.click();
    await expect(page.getByRole("dialog", { name: "Before you register" })).toBeVisible();
    // Never submitted: close it again.
    await page.keyboard.press("Escape");
  });

  test("signed in, already registered: Registered ✓ and no register button", async ({ page }) => {
    const { upcoming } = await findSlugs(page);
    test.skip(!upcoming, "No event open for registration in this database");
    await signedIn(page, true);
    await page.goto(`/events/${upcoming}`);
    await expect(page.locator("#register").getByText("Registered", { exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: /Register — it's free/ })).toHaveCount(0);
  });

  test("past event: See recap jumps to the recap section", async ({ page }) => {
    const { past } = await findSlugs(page);
    test.skip(!past, "No past event in this database");
    await signedOut(page);
    await page.goto(`/events/${past}`);
    const recap = page.locator("#register").getByRole("link", { name: "See recap" });
    await expect(recap).toBeVisible();
    await recap.click();
    await expect(page).toHaveURL(/#recap$/);
    await expect(page.getByRole("heading", { name: "Projects & photos" })).toBeInViewport();
  });

  test("keyboard: calendar menu opens with Enter and Escape returns focus", async ({ page }) => {
    const { current, past } = await findSlugs(page);
    const slug = current ?? past;
    test.skip(!slug, "No published events in this database");
    await signedOut(page);
    await page.goto(`/events/${slug}`);
    const trigger = page.getByRole("button", { name: "Add to calendar" });
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("link", { name: /Google Calendar/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
  });

  test("phone: the sticky CTA appears once the hero CTA scrolls away", async ({ page, isMobile }) => {
    test.skip(!isMobile, "The sticky bar is mobile-only");
    const { current, past } = await findSlugs(page);
    const slug = current ?? past;
    test.skip(!slug, "No published events in this database");
    await signedOut(page);
    await page.goto(`/events/${slug}`);
    const bar = page.getByTestId("sticky-event-bar");
    await expect(bar).toHaveAttribute("aria-hidden", "true");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await expect(bar).toHaveAttribute("aria-hidden", "false");
  });
});
