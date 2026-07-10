"use client";

import SwaggerUI from "swagger-ui-react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useIsClient } from "@/hooks/use-is-client";

export default function ApiDocsPage() {
  const mounted = useIsClient();

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav bar */}
      <div className="sticky top-0 z-50 border-b border-glass bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-primary hover:text-bh-red-500 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-bh-red-500">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              <span className="text-lg font-bold">Butwal Hacks</span>
            </Link>
            <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-bh-red-500/30 bg-bh-red-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-bh-red-500">
              API Docs
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-primary/40 font-mono">v1.0.0</span>
            <Link
              href="/"
              className="rounded-lg border border-glass bg-surface/10 px-4 py-2 text-xs font-bold text-primary/60 hover:text-primary hover:bg-surface/10 transition-all inline-flex items-center gap-1.5"
            >
              <ExternalLink className="w-3 h-3" />
              Home
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-primary">
            API Reference
          </h1>
          <p className="text-base text-primary/50 max-w-3xl">
            Complete documentation for all 18 internal API endpoints on the Butwal Hacks platform.
            Most endpoints require a valid session (logged-in user via Clerk). Public endpoints require no auth.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-status-green/30 bg-status-green/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-status-green">
              <span className="h-1.5 w-1.5 rounded-full bg-status-green" aria-hidden="true" />
              3 Public
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-status-blue/30 bg-status-blue/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-status-blue">
              <span className="h-1.5 w-1.5 rounded-full bg-status-blue" aria-hidden="true" />
              15 Auth Required
            </span>
          </div>
        </div>

        {/* Swagger UI */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"
        />

        <div className="rounded-2xl border border-glass bg-background/[0.02] overflow-hidden">
          {mounted && (
            <SwaggerUI
              url="/swagger.json"
              docExpansion="list"
              defaultModelsExpandDepth={1}
              defaultModelExpandDepth={1}
              tryItOutEnabled={false}
              filter={true}
              displayRequestDuration={true}
              persistAuthorization={true}
            />
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-glass py-6 text-center">
          <p className="text-xs text-primary/30">
            Butwal Hacks API &mdash; For developer reference.
            Need help? Open an issue on{" "}
            <a
              href="https://github.com/Prarambha369/Butwal-Hacks"
              target="_blank"
              rel="noopener noreferrer"
              className="text-bh-red-500 hover:text-bh-red-400 underline"
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </div>

      {/* Dark theme overrides for Swagger UI */}
      <style jsx global>{`
        .swagger-ui { color: var(--color-swagger-text); }
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin: 0; padding: 24px; }
        .swagger-ui .info .title { color: var(--color-swagger-text); }
        .swagger-ui .info .description p { color: var(--color-swagger-text-muted); }
        .swagger-ui .info .base-url { color: var(--color-text-secondary); }
        .swagger-ui .scheme-container {
          background: transparent; padding: 12px 24px; border-bottom: 1px solid var(--color-swagger-border);
        }
        .swagger-ui .opblock-tag { color: var(--color-swagger-text); border-bottom: 1px solid var(--color-swagger-border); }
        .swagger-ui .opblock-tag:hover { background: var(--color-swagger-bg-hover); }
        .swagger-ui .opblock {
          border-radius: 12px; border: 1px solid var(--color-swagger-border); margin: 0 0 16px;
        }
        .swagger-ui .opblock .opblock-summary { padding: 12px 16px; }
        .swagger-ui .opblock .opblock-summary-description { color: var(--color-swagger-text-muted); }
        .swagger-ui .opblock .opblock-summary-path { font-family: 'JetBrains Mono', monospace; font-size: 13px; }
        .swagger-ui .opblock .opblock-summary-path a { color: var(--color-swagger-text); }
        .swagger-ui .opblock .opblock-summary-method {
          border-radius: 8px; font-size: 11px; font-weight: 700; padding: 4px 10px; min-width: 60px; text-align: center;
        }
        .swagger-ui .opblock.opblock-get { border-color: var(--color-swagger-get-glow); background: var(--glow-status-blue); }
        .swagger-ui .opblock.opblock-get .opblock-summary-method { background: var(--color-swagger-get); }
        .swagger-ui .opblock.opblock-post { border-color: var(--color-swagger-post-glow); background: var(--glow-status-green); }
        .swagger-ui .opblock.opblock-post .opblock-summary-method { background: var(--color-swagger-post); }
        .swagger-ui .opblock-body { background: transparent; }
        .swagger-ui .opblock-body .opblock-description-wrapper p { color: var(--color-swagger-text-muted); }
        .swagger-ui .opblock-section-header { background: var(--color-swagger-bg-hover); border: none; padding: 12px 16px; }
        .swagger-ui .opblock-section-header h4 { color: var(--color-swagger-text); }
        .swagger-ui table thead tr th { color: var(--color-swagger-text-muted); border-bottom: 1px solid var(--color-swagger-border); }
        .swagger-ui table tbody tr td { color: var(--color-swagger-text); }
        .swagger-ui .parameter__name { color: var(--color-swagger-text); }
        .swagger-ui .parameter__type { color: var(--color-swagger-text-muted); }
        .swagger-ui .model { color: var(--color-swagger-text); }
        .swagger-ui .model-title { color: var(--color-swagger-text); }
        .swagger-ui .model-box .model .prop-name { color: var(--color-swagger-text-muted); }
        .swagger-ui .model-box .model .prop-type { color: var(--color-swagger-get); }
        .swagger-ui section.models { border: 1px solid var(--color-swagger-border); border-radius: 12px; }
        .swagger-ui section.models h4 { color: var(--color-swagger-text); border-radius: 12px; }
        .swagger-ui section.models h4:hover { background: var(--color-swagger-bg-hover); }
        .swagger-ui .btn { border-radius: 8px; font-weight: 600; }
        .swagger-ui .response-col_status { color: var(--color-swagger-text); }
        .swagger-ui .response-col_description { color: var(--color-swagger-text-muted); }
        .swagger-ui select { background: var(--color-swagger-bg-subtle); color: var(--color-swagger-text); border: 1px solid var(--color-swagger-border); border-radius: 8px; }
        .swagger-ui .markdown p, .swagger-ui .markdown li { color: var(--color-swagger-text-muted); }
        .swagger-ui .markdown code { color: var(--color-swagger-text); background: var(--color-swagger-bg-subtle); border-radius: 4px; }
      `}</style>
    </div>
  );
}
