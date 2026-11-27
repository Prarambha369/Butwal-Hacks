#!/usr/bin/env node
// Build (and optionally deploy) Butwal Hacks as one Cloudflare Worker.
//
//   node scripts/cf.mjs build                   # OpenNext build + size guard
//   node scripts/cf.mjs deploy [--env preview]  # same, then deploy
//
// The size guard reads wrangler's dry-run "Total Upload", the uncompressed
// bundle size, which is the only Worker size limit (64 MiB on every plan
// since 2026-09-04; the old 3 MiB gzip Free limit is gone). See
// docs/CLOUDFLARE.md#script-size.

import { execFileSync } from "node:child_process";

const LIMIT_KIB = 64 * 1024;
const WARN_KIB = 32 * 1024; // past this, startup time (1 s budget) deserves a look

const [command, ...rest] = process.argv.slice(2);
const envIndex = rest.indexOf("--env");
const envArgs = envIndex === -1 ? [] : ["--env", rest[envIndex + 1]];

if (command !== "build" && command !== "deploy") {
  console.error("usage: node scripts/cf.mjs <build|deploy> [--env preview]");
  process.exit(2);
}

const run = (args, extraEnv = {}) =>
  execFileSync("npx", args, { stdio: "inherit", env: { ...process.env, ...extraEnv } });

run(["opennextjs-cloudflare", "build", ...envArgs], { BUILD_TARGET: "cloudflare" });

const dryRun = execFileSync("npx", ["wrangler", "deploy", "--dry-run", ...envArgs], {
  encoding: "utf8",
  env: process.env,
});
const match = dryRun.match(/Total Upload:\s*([\d.]+)\s*KiB\s*\/\s*gzip:\s*([\d.]+)\s*KiB/);
if (!match) {
  console.error("Could not read the bundle size from `wrangler deploy --dry-run`.");
  process.exit(1);
}
const [kib, gzipKib] = [Number(match[1]), Number(match[2])];
console.log(`Worker bundle: ${(kib / 1024).toFixed(1)} MiB uncompressed (limit 64 MiB), ${(gzipKib / 1024).toFixed(2)} MiB gzip`);
if (kib > LIMIT_KIB) {
  console.error("✘ Over the 64 MiB Worker size limit.");
  process.exit(1);
}
if (kib > WARN_KIB) console.warn("! Over 32 MiB: check startup time with `npx wrangler check startup`.");

if (command === "deploy") run(["opennextjs-cloudflare", "deploy", ...envArgs]);
