/**
 * Instrumentation — PostHog Logs via OpenTelemetry
 *
 * Loads at startup when NEXT_RUNTIME=nodejs and configures an OTLP log exporter
 * that sends structured logs to PostHog's OTLP endpoint.
 *
 * The logger is available globally as globalThis.__posthogLogger and is used
 * by the `posthogLog` helper in src/lib/posthog-logger.ts.
 *
 * Docs: https://posthog.com/docs/cdp/logs
 *
 * ponytail: BatchLogRecordProcessor batches logs in memory and flushes
 * every 2s or every 100 records, whichever comes first. Far fewer HTTP calls
 * than SimpleLogRecordProcessor (which sends one HTTP request per log event).
 */
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { LoggerProvider, BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";

const POSTHOG_PROJECT_TOKEN =
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ?? "";
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const exporter = new OTLPLogExporter({
      url: `${POSTHOG_HOST}/otlp/v1/logs`,
      headers: {
        Authorization: `Bearer ${POSTHOG_PROJECT_TOKEN}`,
      },
    });

    const loggerProvider = new LoggerProvider({
      resource: resourceFromAttributes({
        "service.name": "butwal-hacks",
        "service.version": process.env.VERCEL_GIT_COMMIT_SHA ?? "dev",
        "deployment.environment":
          process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
      }),
      processors: [
        new BatchLogRecordProcessor({
          exporter,
          // ponytail: 100 records or 2s — reasonable for a community site's traffic.
          // Tradeoff: logs in the buffer are lost if the function terminates before the
          // 2s window (cold start timeout, abrupt shutdown). Acceptable for a community site.
          // For higher traffic, increase maxExportBatchSize and decrease scheduledDelayMillis.
          maxExportBatchSize: 100,
          scheduledDelayMillis: 2_000,
        }),
      ],
    });

    // Make available globally for API routes and server components
    (globalThis as Record<string, unknown>).__posthogLogger =
      loggerProvider.getLogger("butwal-hacks");
  }
}
