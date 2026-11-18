#!/usr/bin/env node
/**
 * CI security gate: fail on any high or critical advisory in the deployed
 * dependency tree, except the advisories explicitly allowlisted below.
 *
 * Reads `npm audit --omit=dev --json` from stdin (or from the file named as
 * the first argument) and exits 1 if anything not allowlisted is high or
 * critical. It fails closed: an npm error, an unknown report format, or an
 * advisory without an id all fail the gate.
 *
 * Every allowlist entry must say why it is unexploitable here and when to
 * remove it. An entry is a stopgap for an advisory with no published fix,
 * not a way to silence a fixable one.
 */

import { readFileSync } from "node:fs";

/** @type {Record<string, string>} GHSA id -> justification */
export const ALLOWLIST = {
  // picomatch <= 4.0.7: ReDoS through single-branch repeated extglobs.
  // No patched picomatch is published (4.0.7 is the latest release), and the
  // only path in the prod tree is @sentry/nextjs -> @rollup/plugin-commonjs
  // (Sentry 11 pins the same plugin, so a Sentry upgrade does not remove it).
  // That plugin runs during the build with glob patterns from configuration,
  // never on request input, so the ReDoS is not reachable at runtime.
  // REMOVE once picomatch ships a fix: `npm update picomatch` and delete this.
  "GHSA-fc5q-39xc-vjpf":
    "picomatch ReDoS, build-time only via @sentry/nextjs, no upstream fix yet",
};

const BLOCKING = new Set(["high", "critical"]);

/**
 * @param {unknown} report parsed `npm audit --json` output
 * @returns {{ blocking: string[], allowed: string[] }}
 */
export function evaluate(report) {
  if (!report || typeof report !== "object") {
    throw new Error("npm audit produced no JSON object");
  }
  const r = /** @type {Record<string, any>} */ (report);
  if (r.error) {
    throw new Error(`npm audit failed: ${r.error.code ?? ""} ${r.error.summary ?? ""}`.trim());
  }
  if (r.auditReportVersion !== 2 || !r.vulnerabilities || typeof r.vulnerabilities !== "object") {
    throw new Error(`unrecognised npm audit report (auditReportVersion=${r.auditReportVersion})`);
  }

  const blocking = new Set();
  const allowed = new Set();
  for (const [name, vuln] of Object.entries(r.vulnerabilities)) {
    // Every vulnerable chain bottoms out in an advisory object in some
    // package's `via`; string entries just point at another package. Judge
    // the advisories themselves, by their own severity.
    for (const via of vuln.via ?? []) {
      if (typeof via !== "object" || via === null) continue;
      if (!BLOCKING.has(via.severity)) continue;
      const id = typeof via.url === "string" ? via.url.split("/").pop() : undefined;
      if (!id || !id.startsWith("GHSA-")) {
        blocking.add(`${name}: ${via.severity} advisory without a GHSA id (${via.title ?? "untitled"})`);
      } else if (Object.hasOwn(ALLOWLIST, id)) {
        allowed.add(`${id} (${name}): ${ALLOWLIST[id]}`);
      } else {
        blocking.add(`${id} (${name}, ${via.severity}): ${via.title ?? ""}`);
      }
    }
  }
  return { blocking: [...blocking].sort(), allowed: [...allowed].sort() };
}

function main() {
  const source = process.argv[2] ? readFileSync(process.argv[2], "utf8") : readFileSync(0, "utf8");
  let result;
  try {
    result = evaluate(JSON.parse(source));
  } catch (error) {
    console.error(`npm audit gate: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
  for (const line of result.allowed) console.log(`allowlisted  ${line}`);
  if (result.blocking.length > 0) {
    for (const line of result.blocking) console.error(`BLOCKING     ${line}`);
    console.error(`npm audit gate: ${result.blocking.length} high/critical advisory(ies) not allowlisted.`);
    process.exit(1);
  }
  console.log("npm audit gate: no high or critical advisories outside the allowlist.");
}

if (import.meta.url === `file://${process.argv[1]}`) main();
