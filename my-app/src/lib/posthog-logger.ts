/**
 * posthog-logger — PostHog Logs helper via OpenTelemetry
 *
 * Typed wrapper around the global OTel logger set up by instrumentation.ts.
 * Provides .info(), .warn(), .error() methods for structured logging.
 *
 * Usage:
 *   posthogLog.info("User signed up", { email, bhId })
 *   posthogLog.warn("Rate limit exceeded", { ip })
 *   posthogLog.error("Payment failed", { error: err.message, userId })
 *
 * ponytail: Direct global access — no dependency injection or logger abstraction.
 * Upgrade path: Replace with Pino + OTel transport if more log levels needed.
 */

import { SeverityNumber } from "@opentelemetry/api-logs";

type OTelLogger = {
  emit: (record: {
    severityNumber: SeverityNumber;
    severityText: string;
    body: string;
    attributes?: Record<string, unknown>;
  }) => void;
};

function getLogger(): OTelLogger | undefined {
  return (globalThis as Record<string, unknown>).__posthogLogger as
    | OTelLogger
    | undefined;
}

export const posthogLog = {
  info: (body: string, attributes?: Record<string, unknown>) => {
    getLogger()?.emit({
      severityNumber: SeverityNumber.INFO,
      severityText: "INFO",
      body,
      attributes: { ...attributes, timestamp: new Date().toISOString() },
    });
  },

  warn: (body: string, attributes?: Record<string, unknown>) => {
    getLogger()?.emit({
      severityNumber: SeverityNumber.WARN,
      severityText: "WARN",
      body,
      attributes: { ...attributes, timestamp: new Date().toISOString() },
    });
  },

  error: (body: string, attributes?: Record<string, unknown>) => {
    getLogger()?.emit({
      severityNumber: SeverityNumber.ERROR,
      severityText: "ERROR",
      body,
      attributes: { ...attributes, timestamp: new Date().toISOString() },
    });
  },
};
