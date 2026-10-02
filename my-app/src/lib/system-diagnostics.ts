/**
 * Maintainer system diagnostics — "is every part of this actually working?"
 *
 * `health-checks.ts` answers one narrow question: are the five services the
 * command-centre header depends on reachable right now? That is the right
 * budget for a badge that must not delay first paint, and the wrong budget for
 * a maintainer trying to work out why uploads stopped.
 *
 * This module is the wider net. Three groups:
 *
 *   Services      — live probes to everything the app calls out to.
 *   Configuration — required env present, optional integrations wired.
 *   Data          — row counts and integrity, so "0 events" is visible as a
 *                    fact rather than inferred from an empty page.
 *
 * Split deliberately rather than folded into `runAllChecks`: the header badge
 * must stay cheap, and these checks are not. Nothing here is imported by the
 * dashboard shell.
 */
import { createServiceClient } from "@/utils/supabase";
import {
  runAllChecks,
  PROBE_TIMEOUT_MS,
  type HealthCheck,
} from "@/lib/health-checks";
import { SITE_URL } from "@/lib/constants";

export type DiagnosticStatus = "pass" | "warn" | "fail";

export interface DiagnosticResult {
  group: "Services" | "Configuration" | "Data";
  label: string;
  status: DiagnosticStatus;
  /** What a maintainer should read, not a stack trace. */
  detail: string;
  latency_ms: number | null;
}

const ms = (start: number) => Math.round(performance.now() - start);

/**
 * Health status -> diagnostic status.
 *
 * Exported because this mapping is the whole trustworthiness of the page: if
 * `down` ever collapsed to `pass`, the page would report a dead service as
 * healthy and be worse than no page at all.
 */
export function toDiagnosticStatus(status: HealthCheck["status"]): DiagnosticStatus {
  return status === "healthy" ? "pass" : status === "degraded" ? "warn" : "fail";
}

function fromHealthCheck(c: HealthCheck): DiagnosticResult {
  return {
    group: "Services",
    label: c.name,
    status: toDiagnosticStatus(c.status),
    detail: c.error ? c.error : "Responded",
    latency_ms: c.latency_ms,
  };
}

/**
 * Env the app cannot boot without. Any of these missing is a deployment
 * mistake, so they are a hard fail rather than a warning.
 */
export const REQUIRED_ENV_VARS = [
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
 ] as const;

/**
 * Optional integrations. Absent is not a fault — a maintainer needs to see
 * which capabilities are actually live in this environment, because "the
 * Discord integration is not posting" and "it was never configured" look
 * identical from outside.
 */
const OPTIONAL_ENV: readonly { key: string; label: string }[] = [
  { key: "SENTRY_DSN", label: "Error monitoring (Sentry)" },
  { key: "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", label: "Analytics (PostHog)" },
  { key: "SLACK_WEBHOOK_URL", label: "Slack notifications" },
  { key: "DISCORD_WEBHOOK_URL", label: "Discord notifications" },
  { key: "OC_WEBHOOK_SECRET", label: "Open Collective webhook" },
  { key: "VERCEL_DEPLOY_HOOK_URL", label: "Deploy hook" },
  { key: "CRON_SECRET", label: "Cron authorisation" },
  { key: "GOOGLE_CLIENT_ID", label: "Google sign-in" },
  { key: "GOOGLE_CLIENT_SECRET", label: "Google sign-in (secret)" },
  { key: "CALENDAR_BASE_URL", label: "Calendar sync" },
];

async function checkResend(): Promise<DiagnosticResult> {
  const start = performance.now();
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return {
      group: "Services",
      label: "Resend (email)",
      status: "fail",
      detail: "RESEND_API_KEY not set — no email can be sent",
      latency_ms: null,
    };
  }
  try {
    // Listing domains authenticates without sending anything, so this probe
    // cannot email a real person or leak into a customer's inbox.
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    const latency = ms(start);
    if (res.ok) {
      return {
        group: "Services",
        label: "Resend (email)",
        status: "pass",
        detail: "API key accepted",
        latency_ms: latency,
      };
    }
    return {
      group: "Services",
      label: "Resend (email)",
      status: res.status === 401 || res.status === 403 ? "fail" : "warn",
      detail:
        res.status === 401 || res.status === 403
          ? "API key rejected"
          : `Responded ${res.status}`,
      latency_ms: latency,
    };
  } catch (err) {
    return {
      group: "Services",
      label: "Resend (email)",
      status: "fail",
      detail: err instanceof Error ? err.message.slice(0, 160) : "Unreachable",
      latency_ms: ms(start),
    };
  }
}

async function checkSite(): Promise<DiagnosticResult> {
  const start = performance.now();
  try {
    const res = await fetch(SITE_URL, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    const latency = ms(start);
    // 2xx/3xx only. A 404 on the canonical host means the deployment is up but
    // serving the wrong build, which is exactly the failure worth surfacing.
    return {
      group: "Services",
      label: "Canonical site",
      status: res.ok || (res.status >= 300 && res.status < 400) ? "pass" : "fail",
      detail: `${new URL(SITE_URL).host} responded ${res.status}`,
      latency_ms: latency,
    };
  } catch (err) {
    return {
      group: "Services",
      label: "Canonical site",
      status: "fail",
      detail: err instanceof Error ? err.message.slice(0, 160) : "Unreachable",
      latency_ms: ms(start),
    };
  }
}

function checkConfiguration(): DiagnosticResult[] {
  const missing = REQUIRED_ENV_VARS.filter((k) => !process.env[k]);
  const out: DiagnosticResult[] = [
    {
      group: "Configuration",
      label: "Required environment",
      status: missing.length === 0 ? "pass" : "fail",
      detail:
        missing.length === 0
          ? `All ${REQUIRED_ENV_VARS.length} required variables set`
          : `Missing ${missing.length}: ${missing.join(", ")}`,
      latency_ms: null,
    },
  ];

  for (const { key, label } of OPTIONAL_ENV) {
    const set = Boolean(process.env[key]);
    // Only ever reports whether the variable is present, never its value --
    // this renders in a maintainer page, and the point is to confirm wiring
    // without turning the page into a secret dump.
    out.push({
      group: "Configuration",
      label,
      status: set ? "pass" : "warn",
      detail: set ? "Configured" : "Not configured",
      latency_ms: null,
    });
  }
  return out;
}

/** Tables a maintainer expects to be non-empty, with the pages they drive. */
const CORE_TABLES = [
  { table: "profiles", drives: "All dashboards" },
  { table: "events", drives: "Public events page" },
  { table: "projects", drives: "Public projects page" },
  { table: "chapters", drives: "Chapters page" },
  { table: "trust_markers", drives: "Profile trust badges" },
] as const;

async function checkData(): Promise<DiagnosticResult[]> {
  const out: DiagnosticResult[] = [];
  try {
    const db = createServiceClient();

    // Counts are independent, so one round-trip for all of them.
    const counts = await Promise.all(
      CORE_TABLES.map(({ table }) =>
        db.from(table).select("*", { count: "exact", head: true }),
      ),
    );

    CORE_TABLES.forEach(({ table, drives }, i) => {
      const { count, error } = counts[i];
      if (error) {
        out.push({
          group: "Data",
          label: `Table: ${table}`,
          status: "fail",
          detail: error.message.slice(0, 160),
          latency_ms: null,
        });
        return;
      }
      // Zero rows in a core table is not an outage, but it is worth stating:
      // it is indistinguishable from a broken query at a glance.
      out.push({
        group: "Data",
        label: `Table: ${table}`,
        status: count === 0 ? "warn" : "pass",
        detail: `${count ?? 0} rows — drives ${drives}`,
        latency_ms: null,
      });
    });

    // Integrity: a profile without a slug_id breaks every route that resolves
    // by slug, so it is worth counting rather than discovering from a 404.
    const { count: orphanProfiles, error: orphanErr } = await db
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .is("slug_id", null);
    out.push({
      group: "Data",
      label: "Profiles with no slug_id",
      status: orphanErr ? "warn" : (orphanProfiles ?? 0) === 0 ? "pass" : "fail",
      detail: orphanErr
        ? orphanErr.message.slice(0, 160)
        : `${orphanProfiles ?? 0} — these break slug-based routes`,
      latency_ms: null,
    });
  } catch (err) {
    out.push({
      group: "Data",
      label: "Data integrity",
      status: "fail",
      detail: err instanceof Error ? err.message.slice(0, 160) : "Query failed",
      latency_ms: null,
    });
  }
  return out;
}

/**
 * Run every diagnostic. Slow by design — this is the page a maintainer opens
 * when something is wrong, not a header badge.
 */
export async function runDiagnostics(): Promise<DiagnosticResult[]> {
  const services = await Promise.all([
    runAllChecks().then((cs) => cs.map(fromHealthCheck)),
    checkResend(),
    checkSite(),
  ]);

  return [...services.flat(), ...checkConfiguration(), ...(await checkData())];
}