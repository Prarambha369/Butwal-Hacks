/**
 * UI audit — the accessibility/responsive gate that runs in CI and locally.
 *
 * Loads a route set at a set of viewports and reports, per page-view:
 *   - axe-core violations of impact serious/critical (wcag2a, wcag2aa,
 *     wcag21a, wcag21aa)
 *   - horizontal overflow (document scrollWidth past the viewport, plus
 *     elements painted outside it that are not inside an explicit scroller)
 *   - uncaught page errors
 *   - 5xx responses
 *
 * Exits 1 when any of those fire, 0 otherwise. Screenshots and the JSON
 * report land in --out (default /tmp/bh-ui-audit) for artifact upload.
 *
 * Usage:
 *   node scripts/audit-ui.mjs                       # all routes, all viewports
 *   node scripts/audit-ui.mjs --routes=public        # skip the signed-in set
 *   node scripts/audit-ui.mjs --viewports=mobile,dark
 *   node scripts/audit-ui.mjs --base=http://localhost:3100 --out=/tmp/out
 *
 * The authenticated set needs AUTH0_TEST_EMAIL / AUTH0_TEST_PASSWORD (the
 * same account the Playwright suite uses). Without them — or when the login
 * page cannot be reached — the signed-in routes are skipped with a notice and
 * only the public set is enforced, so a fork without the secrets still gets a
 * useful gate instead of a red build.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);

// ── Options ────────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);

const BASE = args.base || process.env.BASE_URL || 'http://localhost:3100';
const OUT = args.out || process.env.AUDIT_OUT || '/tmp/bh-ui-audit';
const ROUTE_SET = args.routes || 'all';
const VIEWPORT_FILTER = (args.viewports || process.env.AUDIT_VIEWPORTS || '')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);

const PUBLIC_ROUTES = [
  '/',
  '/explore',
  '/events',
  '/projects',
  '/blog',
  '/chapters',
  '/teams',
  '/about',
  '/support',
  '/partners',
  '/governance',
  '/transparency',
  '/transparency?view=report',
  '/learn',
  '/calendar',
  '/festivals',
  '/gallery',
  '/contact',
  '/sitemap',
  '/mentors',
  '/initiatives/hackathon',
  '/initiatives/mini-hackathon',
  '/initiatives/gamejam',
  '/sign-in',
  '/not-a-real-page',
];

/** Detail routes only render when the database has rows; audited when it does. */
const OPTIONAL_PUBLIC_ROUTES = [
  '/events/hackday-butwal',
  '/events/daydream-butwal',
  '/chapters/bhawani-secondary-school',
  '/festivals/dashain-2082',
  '/blog/why-butwal-needs-community-tech',
];

const AUTH_ROUTES = [
  '/dashboard',
  '/dashboard/hacker',
  '/dashboard/hacker/profile',
  '/dashboard/hacker/projects',
  '/dashboard/hacker/skills',
  '/dashboard/hacker/work',
  '/dashboard/hacker/teams',
  '/dashboard/hacker/team-matching',
  '/dashboard/hacker/api-keys',
  '/dashboard/hacker/certificates',
  '/dashboard/hacker/chat',
  '/dashboard/profile',
  '/dashboard/blog',
  '/dashboard/onboarding',
  '/dashboard/projects/new',
  '/dashboard/sponsor-onboarding',
  '/dashboard/organizer',
  '/dashboard/organizer/events',
  '/dashboard/organizer/events/new',
  '/dashboard/organizer/api-keys',
  '/dashboard/organizer/certificates/templates',
  '/dashboard/organizer/issue-marker',
  '/dashboard/organizer/work',
  '/dashboard/maintainer',
  '/dashboard/maintainer/users',
  '/dashboard/maintainer/chapters',
  '/dashboard/maintainer/partners',
  '/dashboard/maintainer/blog',
  '/dashboard/maintainer/photos',
  '/dashboard/maintainer/site-config',
  '/dashboard/maintainer/testimonials',
  '/dashboard/maintainer/audit-log',
  '/dashboard/maintainer/trust-override',
  '/dashboard/maintainer/system-check',
  '/dashboard/maintainer/dedicate-school',
  '/portal/bounties',
  '/portal/payouts',
  '/portal/sponsors',
  '/portal/sponsors/company',
  '/portal/recruiters',
  '/portal/bounties/new',
];

const ALL_VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true, colorScheme: 'light' },
  { name: 'tablet', width: 768, height: 1024, isMobile: true, hasTouch: true, colorScheme: 'light' },
  { name: 'desktop', width: 1440, height: 900, isMobile: false, hasTouch: false, colorScheme: 'light' },
  { name: 'dark', width: 1440, height: 900, isMobile: false, hasTouch: false, colorScheme: 'dark' },
];
const viewports = VIEWPORT_FILTER.length
  ? ALL_VIEWPORTS.filter((v) => VIEWPORT_FILTER.includes(v.name))
  : ALL_VIEWPORTS;
if (viewports.length === 0) {
  console.error(`Unknown viewport in --viewports: use ${ALL_VIEWPORTS.map((v) => v.name).join(', ')}`);
  process.exit(2);
}

// ── Preflight ──────────────────────────────────────────────────────────────
async function probe(url) {
  try {
    const res = await fetch(url, { redirect: 'manual' });
    return res.status;
  } catch {
    return 0;
  }
}
const rootStatus = await probe(BASE + '/');
if (rootStatus === 0) {
  console.error(`No server at ${BASE} — start it first (npm run build && npm run start).`);
  process.exit(2);
}

const email = process.env.AUTH0_TEST_EMAIL;
const password = process.env.AUTH0_TEST_PASSWORD;
const wantAuth = ROUTE_SET === 'all' || ROUTE_SET === 'auth';
const wantPublic = ROUTE_SET === 'all' || ROUTE_SET === 'public';
if (ROUTE_SET !== 'all' && ROUTE_SET !== 'auth' && ROUTE_SET !== 'public') {
  console.error(`Unknown --routes=${ROUTE_SET} (use all | public | auth)`);
  process.exit(2);
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const STATE = path.join(OUT, 'auth-state.json');

const browser = await chromium.launch({
  executablePath: fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

// ── Sign in once, reuse the storage state ──────────────────────────────────
// Auth0 runs identifier-first here: the password field only exists after the
// email step has been submitted, so the two inputs are sequential, not one form.
async function signIn(page, emailAddr, passwordSecret) {
  await page.goto(`${BASE}/dashboard/hacker`, { waitUntil: 'load', timeout: 30000 });
  const identifier = page
    .locator('input[name="username"], input#username, input[name="email"], input[type="email"]')
    .first();
  await identifier.waitFor({ state: 'visible', timeout: 20000 });
  await identifier.fill(emailAddr);
  await page.locator('button[type="submit"]').first().click();

  const passwordField = page.locator('input[name="password"], input#password').first();
  await passwordField.waitFor({ state: 'visible', timeout: 20000 });
  await passwordField.fill(passwordSecret);
  await page.locator('button[type="submit"]').first().click();

  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
}

let authRoutes = [];
if (wantAuth) {
  if (!email || !password) {
    console.log('notice: AUTH0_TEST_EMAIL/PASSWORD not set — auditing the public routes only');
  } else {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    try {
      await signIn(page, email, password);
      await ctx.storageState({ path: STATE });
      authRoutes = AUTH_ROUTES;
      console.log(`signed in — auditing ${authRoutes.length} signed-in routes`);
    } catch (err) {
      console.log(`notice: sign-in failed (${err.message.split('\n')[0]}) — auditing the public routes only`);
      await page.screenshot({ path: path.join(OUT, 'signin-failure.png') }).catch(() => {});
    }
    await ctx.close();
  }
  if (ROUTE_SET === 'auth' && authRoutes.length === 0) {
    await browser.close();
    console.error('--routes=auth was requested but no signed-in session could be established');
    process.exit(2);
  }
}

const routes = [
  ...(wantPublic ? [...PUBLIC_ROUTES, ...OPTIONAL_PUBLIC_ROUTES] : []),
  ...authRoutes,
];
if (routes.length === 0) {
  await browser.close();
  console.error('No routes to audit.');
  process.exit(2);
}

// ── Audit ──────────────────────────────────────────────────────────────────
const report = [];
let done = 0;

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.isMobile,
    hasTouch: viewport.hasTouch,
    colorScheme: viewport.colorScheme,
    reducedMotion: 'reduce',
    deviceScaleFactor: 1,
    ...(authRoutes.length ? { storageState: STATE } : {}),
  });

  for (const route of routes) {
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    let status = 0;
    let landed = route;
    try {
      const res = await page.goto(BASE + route, { waitUntil: 'load', timeout: 30000 });
      status = res ? res.status() : 0;
      landed = new URL(page.url()).pathname;
      await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {});
      await page.waitForTimeout(400);
    } catch (err) {
      pageErrors.push(`navigation: ${err.message.split('\n')[0]}`);
    }

    const metrics = await page.evaluate(() => {
      const vw = window.innerWidth;
      const doc = document.documentElement;
      const visible = (el) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05;
      };
      const overflowing = [];
      for (const el of document.querySelectorAll('body *')) {
        if (!visible(el)) continue;
        if (el.closest('[class*="pointer-events-none"]')) continue;
        const r = el.getBoundingClientRect();
        if (r.right > vw + 1 || r.left < -1) {
          let ancestor = el.parentElement;
          let inScroller = false;
          while (ancestor && ancestor !== document.body) {
            const s = getComputedStyle(ancestor);
            if (['auto', 'scroll'].includes(s.overflowX)) { inScroller = true; break; }
            ancestor = ancestor.parentElement;
          }
          if (inScroller) continue;
          const cls = typeof el.className === 'string' ? el.className.split(/\s+/).slice(0, 3).join('.') : '';
          overflowing.push(`${el.tagName.toLowerCase()}${cls ? '.' + cls : ''} right=${Math.round(r.right)}`);
          if (overflowing.length >= 6) break;
        }
      }
      return { overflowX: doc.scrollWidth - vw, overflowing };
    });

    let axe = [];
    try {
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      axe = await page.evaluate(async () => {
        const r = await window.axe.run(document, {
          runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
        });
        return r.violations
          .filter((v) => v.impact === 'critical' || v.impact === 'serious')
          .map((v) => ({
            id: v.id,
            impact: v.impact,
            count: v.nodes.length,
            nodes: v.nodes.slice(0, 3).map((n) => ({
              target: n.target.join(' '),
              summary: (n.failureSummary || '').split('\n').slice(0, 3).join(' | '),
            })),
          }));
      });
    } catch (err) {
      axe = [{ id: 'axe-error', impact: 'critical', count: 1, nodes: [{ target: '', summary: err.message }] }];
    }

    const slug = route.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '_') || 'home';
    await page.screenshot({ path: path.join(OUT, `${viewport.name}-${slug}.png`), fullPage: true }).catch(() => {});

    const bounced = !landed.startsWith(route.split('?')[0]) && route !== '/';
    report.push({
      viewport: viewport.name,
      route,
      status,
      landed,
      bounced,
      ...metrics,
      pageErrors: pageErrors.slice(0, 5),
      axe,
    });
    await page.close();
    done += 1;
    process.stdout.write(`\r${done}/${routes.length * viewports.length} page-views`);
  }
  await context.close();
}
await browser.close();
process.stdout.write('\n');

fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));

// ── Verdict ────────────────────────────────────────────────────────────────
const failures = [];
for (const r of report) {
  const issues = [];
  if (r.axe.length) issues.push(`axe ${r.axe.map((a) => `${a.id}:${a.count}`).join(', ')}`);
  if (r.overflowX > 1) issues.push(`overflow ${r.overflowX}px`);
  if (r.overflowing.length) issues.push(`${r.overflowing.length} overflowing`);
  if (r.pageErrors.length) issues.push(`${r.pageErrors.length} page errors`);
  if (r.status >= 500) issues.push(`status ${r.status}`);
  if (!issues.length) continue;

  failures.push(`${r.viewport} ${r.route}`);
  console.log(`FAIL ${r.viewport.padEnd(8)} ${r.route.padEnd(46)} ${issues.join(' · ')}`);
  for (const o of r.overflowing) console.log(`       overflow: ${o}`);
  for (const e of r.pageErrors) console.log(`       error:    ${e.slice(0, 220)}`);
  for (const a of r.axe) for (const n of a.nodes) console.log(`       ${a.id}: ${n.target} :: ${n.summary.slice(0, 180)}`);
}

const bounced = [...new Set(report.filter((r) => r.bounced).map((r) => `${r.route} -> ${r.landed}`))].sort();
if (bounced.length) {
  console.log(`\nredirected (role-gated or missing data), not audited at that path:`);
  for (const b of bounced) console.log(`  ${b}`);
}

console.log(`\n${report.length} page-views · ${failures.length} failed · report: ${path.join(OUT, 'report.json')}`);
process.exit(failures.length ? 1 : 0);
