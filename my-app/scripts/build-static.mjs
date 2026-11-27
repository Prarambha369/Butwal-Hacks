#!/usr/bin/env node
// Builds the static marketing site (butwalhacks.com) for Cloudflare Workers
// static assets. The app (auth, dashboards, API, user-edited pages) stays on
// Vercel at app.butwalhacks.com. See docs/CLOUDFLARE.md.
//
//   node scripts/build-static.mjs [--app-origin URL] [--site-url URL] [--noindex]
//
// How: copy this app to <repo>/.static-build (one level under the repo root,
// like my-app, so the Turbopack root and node_modules resolution are the
// same), delete the app-only routes listed in src/lib/static-site.ts, and run
// `next build` with BUILD_TARGET=static (output: "export"). Then write the
// _redirects and _headers files Cloudflare applies to the static files.
//
// Data pages (events, gallery, chapters, ...) are rendered at build time
// from Supabase, so the build needs read access. It refuses to run without
// it and fails if any page reports that Supabase is not configured: a
// scheduled rebuild must never publish an empty site.

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build as esbuild } from "esbuild";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
};
const appOrigin = opt("--app-origin", "https://app.butwalhacks.com").replace(/\/$/, "");
const siteUrl = opt("--site-url", "https://butwalhacks.com").replace(/\/$/, "");
const noindex = args.includes("--noindex");

const FREE_PLAN_ASSET_FILES = 20_000;
const HEADER_LINE_LIMIT = 2_000;
const EMPTY_DATA_MARKERS = ["SUPABASE_NOT_CONFIGURED", "Service-role config missing", "Supabase not configured"];

const appDir = process.cwd();
const repoRoot = path.resolve(appDir, "..");
const work = path.join(repoRoot, ".static-build");
const outDir = path.join(work, "out");

function fail(message) {
  console.error(`✘ ${message}`);
  process.exit(1);
}

// ── 0. Data access ────────────────────────────────────────────────────
const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
const hasKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY);
if (!hasUrl || !hasKey) {
  fail(
    "Supabase URL and service key must be set in the environment (not a .env file); " +
      "refusing to build a static site with empty data pages.",
  );
}

// ── 1. Load the route split from src/lib/static-site.ts ─────────────────
const bundled = path.join(repoRoot, ".static-build-meta.mjs");
await esbuild({
  entryPoints: [path.join(appDir, "src/lib/static-site.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: bundled,
  logLevel: "error",
});
const site = await import(`${pathToFileURL(bundled).href}?t=${Date.now()}`);
fs.rmSync(bundled, { force: true });

// ── 2. Working copy without app-only routes ─────────────────────────────
const SKIP = new Set(["node_modules", ".next", ".open-next", ".wrangler", "out", "e2e", "test-results", ".vercel"]);
fs.rmSync(work, { recursive: true, force: true });
fs.cpSync(appDir, work, {
  recursive: true,
  filter: (src) => {
    const rel = path.relative(appDir, src);
    if (!rel) return true;
    const top = rel.split(path.sep)[0];
    if (SKIP.has(top)) return false;
    const base = path.basename(src);
    if (base.startsWith(".env")) return false; // values come from the process env only
    if (base === "__tests__" || /\.test\.tsx?$/.test(base)) return false;
    return true;
  },
});
const appModules = path.join(appDir, "node_modules");
if (fs.existsSync(appModules)) fs.symlinkSync(appModules, path.join(work, "node_modules"), "dir");

for (const dir of site.STATIC_EXCLUDED_ROUTE_DIRS) {
  fs.rmSync(path.join(work, "src/app", dir), { recursive: true, force: true });
}
fs.rmSync(path.join(work, "src/proxy.ts"), { force: true }); // no per-request code on a static site

// ── 3. Static export ────────────────────────────────────────────────────
const logLines = [];
const code = await new Promise((resolve) => {
  const child = spawn("npx", ["next", "build"], {
    cwd: work,
    env: {
      ...process.env,
      BUILD_TARGET: "static",
      NEXT_PUBLIC_APP_ORIGIN: appOrigin,
      NEXT_PUBLIC_SITE_URL: siteUrl,
      VERCEL: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  for (const stream of [child.stdout, child.stderr]) {
    stream.on("data", (chunk) => {
      process.stdout.write(chunk);
      logLines.push(chunk.toString());
    });
  }
  child.on("close", resolve);
});
if (code !== 0) fail(`next build exited with ${code}`);
const log = logLines.join("");
const marker = EMPTY_DATA_MARKERS.find((m) => log.includes(m));
if (marker) fail(`a page rendered without Supabase data ("${marker}"); not publishing an empty site.`);

// ── 4. _redirects and _headers ──────────────────────────────────────────
const headers = site.staticHeadersFile({ appOrigin, noindex });
const longLine = headers.split("\n").find((l) => l.length > HEADER_LINE_LIMIT);
if (longLine) fail(`_headers line over ${HEADER_LINE_LIMIT} characters: ${longLine.slice(0, 60)}…`);
fs.writeFileSync(path.join(outDir, "_headers"), headers);
// BUILD_TARGET=static here too, so lib/app-maintenance.ts applies to _redirects
// exactly as it did to the pages (banner and maintenance page).
process.env.BUILD_TARGET = "static";
fs.writeFileSync(path.join(outDir, "_redirects"), site.staticRedirectsFile(appOrigin));
if (site.isAppMaintenance() && !fs.existsSync(path.join(outDir, "maintenance.html"))) {
  fail("app maintenance is on but the export has no maintenance.html");
}

// ── 5. Free-plan checks ─────────────────────────────────────────────────
let files = 0;
(function count(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) count(path.join(dir, entry.name));
    else files++;
  }
})(outDir);
if (files > FREE_PLAN_ASSET_FILES) fail(`${files} files is over the ${FREE_PLAN_ASSET_FILES}-file Workers Free asset limit`);

console.log(`\n✔ Static site in ${path.relative(repoRoot, outDir)}: ${files} files, app origin ${appOrigin}${noindex ? ", noindex" : ""}`);
