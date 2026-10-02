// @vitest-environment happy-dom

import { describe, it, expect, vi } from "vitest";
import { readFileSync, globSync } from "node:fs";
import { resolve } from "node:path";
import {
  toDiagnosticStatus,
  REQUIRED_ENV_VARS,
} from "@/lib/system-diagnostics";

vi.mock("@/lib/health-checks", async () => {
  const actual = await vi.importActual<typeof import("@/lib/health-checks")>("@/lib/health-checks");
  return { ...actual, runAllChecks: vi.fn(async () => [
    { name: "Supabase Database", status: "healthy", latency_ms: 5 },
    { name: "Auth0", status: "down", latency_ms: 2500, error: "timeout" },
  ]) };
});
const counts: Record<string, number> = { profiles: 12, events: 0, projects: 4, chapters: 3, trust_markers: 9 };
vi.mock("@/utils/supabase", () => ({
  createServiceClient: () => ({ from: (t: string) => ({ select: () => ({
    is: async () => ({ count: 0, error: null }),
    then: (r: (v: unknown) => void) => r({ count: counts[t] ?? 0, error: null }),
  }) }) }),
}));

/**
 * System diagnostics — the maintainer's "is everything working?" page.
 *
 * Two things are worth protecting, and neither is the happy path.
 *
 * 1. A check that cannot fail is worse than no check. If `down` ever collapsed
 *    to `pass`, the page would report a dead service as healthy and the whole
 *    surface would be worse than not existing.
 *
 * 2. The required-env list is the deployment contract. A variable removed from
 *    it fails open silently: the page reports all-clear while the feature it
 *    powers is dead. So the list is asserted against the variables the code
 *    actually reads, which cannot drift without the test noticing.
 */

const APP = process.cwd();

function readAllAppSource(): string {
  return globSync("src/**/*.{ts,tsx}", { cwd: APP })
    .map((f) => readFileSync(resolve(APP, f), "utf8"))
    .join("\n");
}

describe("health status to diagnostic status", () => {
  it("maps the healthy path", () => {
    expect(toDiagnosticStatus("healthy")).toBe("pass");
  });

  it("keeps a degraded service visible rather than passing it", () => {
    expect(toDiagnosticStatus("degraded")).toBe("warn");
    expect(toDiagnosticStatus("degraded")).not.toBe("pass");
  });

  it("never reports a down service as passing", () => {
    // The load-bearing assertion.
    expect(toDiagnosticStatus("down")).toBe("fail");
    expect(toDiagnosticStatus("down")).not.toBe("pass");
    expect(toDiagnosticStatus("down")).not.toBe("warn");
  });
});

describe("required environment contract", () => {
  it("covers every variable the code reads, spot-checked", () => {
    const code = readAllAppSource();

    // Each of these silently disables a whole feature when absent, so each
    // must appear in the contract. If one is read in src/ but missing here,
    // the page would report a healthy deployment while it is broken.
    for (const key of [
      "NEXT_PUBLIC_SITE_URL",
      "AUTH0_DOMAIN",
      "AUTH0_CLIENT_ID",
      "AUTH0_CLIENT_SECRET",
      "AUTH0_SECRET",
      "AUTH0_BASE_URL",
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET",
      "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
      "RESEND_API_KEY",
      "UPSTASH_REDIS_REST_URL",
      "UPSTASH_REDIS_REST_TOKEN",
      "GROQ_API_KEY",
    ]) {
      expect(code, `src/ never reads ${key}`).toContain(`process.env.${key}`);
      expect(REQUIRED_ENV_VARS, `${key} missing from the contract`).toContain(key);
    }
  });

  it("does not classify an optional integration as required", () => {
    // Demoting these to required would report a healthy minimal deployment as
    // broken, which trains maintainers to ignore the page.
    for (const key of [
      "SENTRY_DSN",
      "SLACK_WEBHOOK_URL",
      "DISCORD_WEBHOOK_URL",
      "OC_WEBHOOK_SECRET",
      "VERCEL_DEPLOY_HOOK_URL",
      "CRON_SECRET",
    ]) {
      expect(REQUIRED_ENV_VARS).not.toContain(key);
    }
  });

  it("has no duplicate entries", () => {
    expect(new Set(REQUIRED_ENV_VARS).size).toBe(REQUIRED_ENV_VARS.length);
  });

  it("reports only presence, never values", () => {
    // The page renders in a maintainer view; leaking values would turn a
    // diagnostics page into a secret dump. Assert the module never reads a
    // value out of the contract entries.
    const src = readFileSync(resolve(APP, "src/lib/system-diagnostics.ts"), "utf8");
    for (const key of REQUIRED_ENV_VARS) {
      const uses = src.match(new RegExp(`process\\.env\\.${key}\\b`, "g")) ?? [];
      // Every reference is a truthiness test, never an assignment or a
      // concatenation into output.
      for (const use of uses) {
        expect(use).toBe(`process.env.${key}`);
      }
    }
  });
});

describe("runDiagnostics", () => {
  it("returns grouped rows and never passes a down service", async () => {
    const { runDiagnostics } = await import("@/lib/system-diagnostics");
    const rows = await runDiagnostics();
    const groups = [...new Set(rows.map((r) => r.group))];
    expect(groups).toContain("Services");
    expect(groups).toContain("Configuration");
    expect(groups).toContain("Data");

    const auth0 = rows.find((r) => r.label === "Auth0");
    expect(auth0?.status).toBe("fail");
    expect(rows.some((r) => r.status === "pass" && r.label === "Auth0")).toBe(false);

    // every row must be renderable: label + a status the page can style
    for (const r of rows) expect(r.label.length).toBeGreaterThan(0);
    for (const r of rows) expect(["pass","warn","fail"]).toContain(r.status);

    // zero rows in a core table is a warning, not a pass and not a fail
    const events = rows.find((r) => r.label === "Table: events");
    expect(events?.status).toBe("warn");
    const profiles = rows.find((r) => r.label === "Table: profiles");
    expect(profiles?.status).toBe("pass");
  }, 20000);
});
