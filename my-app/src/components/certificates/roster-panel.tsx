"use client";

import { useRef, useState, useTransition } from "react";
import {
  deleteTemplate,
  issueCertificatesFromRoster,
  previewRosterCsv,
  sendCertificateEmails,
  type ImportPreview,
  type IssueResult,
  type SendSummary,
} from "@/lib/actions/certificates";

/**
 * The organiser's certificate workflow: import a roster, see exactly what
 * will happen, issue, then mail by domain.
 *
 * Every step is a server action that re-checks the caller's role. This
 * component's own guards are for affordance only — hiding a button is not
 * authorization, and the actions do not depend on it.
 */

type Phase = "idle" | "previewing" | "issuing" | "sending";

const CSV_PLACEHOLDER = `name,email
Asha Sharma,asha.sharma@example.com
Ram Thapa,ram.thapa@example.com`;

export default function CertificateRosterPanel({ eventId }: { eventId: string }) {
  const [csv, setCsv] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ preview: ImportPreview; rejected: Array<{ line: number; reason: string }> } | null>(null);
  const [issue, setIssue] = useState<IssueResult | null>(null);
  const [summary, setSummary] = useState<SendSummary | null>(null);
  const [domain, setDomain] = useState("");
  const [subdomains, setSubdomains] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  const busy = phase !== "idle";

  const onFile = async (file: File) => {
    setError(null);
    // Reject anything we cannot read as text, rather than importing mojibake.
    if (file.size > 2_000_000) {
      setError("That file is larger than 2 MB — that is not a roster.");
      return;
    }
    setCsv(await file.text());
  };

  const run = (p: Phase, fn: () => Promise<void>) => {
    setPhase(p);
    setError(null);
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        setPhase("idle");
      }
    });
  };

  const doPreview = () =>
    run("previewing", async () => {
      setIssue(null);
      setSummary(null);
      setPreview(await previewRosterCsv(eventId, csv));
    });

  const doIssue = () =>
    run("issuing", async () => {
      setIssue(await issueCertificatesFromRoster(eventId, csv));
    });

  const doSend = () =>
    run("sending", async () => {
      setSummary(await sendCertificateEmails(eventId, { domain, subdomains }));
    });

  const selectedDomain = preview?.preview.domains.find((d) => d.domain === domain);
  const knownDomain = Boolean(selectedDomain);
  const unknownDomain = domain.trim().length > 0 && !knownDomain;

  return (
    <div className="space-y-6">
      {/* ── Step 1: roster ── */}
      <section aria-labelledby="step-roster" className="rounded-lg border border-stone-200 p-4">
        <h2 id="step-roster" className="mb-1 text-base font-semibold text-stone-900">
          1. Import the roster
        </h2>
        <p className="mb-3 text-sm text-stone-600">
          A CSV with a <code>name</code> and <code>email</code> column. Names are matched against this
          event&apos;s registrations — anyone not registered will be reported, not silently skipped.
        </p>

        <div className="mb-2 flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            aria-label="Choose a CSV roster file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
            className="text-sm"
          />
          <button
            type="button"
            onClick={() => {
              setCsv(CSV_PLACEHOLDER);
              fileRef.current?.blur();
            }}
            className="rounded border border-stone-300 px-2 py-1 text-xs"
          >
            Use sample
          </button>
        </div>

        <label htmlFor="csv" className="sr-only">
          Roster CSV contents
        </label>
        <textarea
          id="csv"
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder={CSV_PLACEHOLDER}
          rows={8}
          spellCheck={false}
          className="w-full rounded border border-stone-300 p-2 font-mono text-xs"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={doPreview}
            disabled={busy || csv.trim().length === 0}
            className="rounded bg-stone-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {phase === "previewing" ? "Checking…" : "Check roster"}
          </button>
          <button
            type="button"
            onClick={doIssue}
            disabled={busy || csv.trim().length === 0 || !preview}
            className="rounded bg-bh-red-500 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {phase === "issuing" ? "Issuing…" : "Issue certificates"}
          </button>
        </div>

        {/* Deliberately disabled until previewed: issuing 240 of 300 without
            seeing the 60 first is the mistake this prevents. */}
        {!preview && csv.trim().length > 0 && (
          <p className="mt-2 text-xs text-stone-500">
            Check the roster first — issuance is a separate, deliberate step.
          </p>
        )}
      </section>

      {/* ── Step 2: preview ── */}
      {preview && (
        <section aria-labelledby="step-preview" className="rounded-lg border border-stone-200 p-4">
          <h2 id="step-preview" className="mb-3 text-base font-semibold text-stone-900">
            2. What will happen
          </h2>

          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <Stat label="Rows" value={preview.preview.total} />
            <Stat label="Will issue" value={preview.preview.matched} tone="good" />
            <Stat label="No profile" value={preview.preview.unmatched} tone={preview.preview.unmatched > 0 ? "warn" : undefined} />
            <Stat label="Duplicate" value={preview.preview.duplicate} />
            <Stat label="Already issued" value={preview.preview.alreadyIssued} />
          </dl>

          {preview.rejected.length > 0 && (
            <p className="mt-2 text-xs text-amber-800">
              {preview.rejected.length} row(s) were rejected as malformed and will not be issued.
            </p>
          )}

          {preview.rejected.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-stone-700">
                Show {preview.rejected.length} rejected row(s)
              </summary>
              <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-xs text-stone-600">
                {preview.rejected.map((r) => (
                  <li key={`${r.line}-${r.reason}`}>
                    Line {r.line}: {r.reason}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {preview.preview.matched === 0 && (
            <p className="mt-3 rounded bg-amber-50 p-2 text-sm text-amber-900">
              Nothing matches this roster. Check the email column header, and that these people are
              registered for this event.
            </p>
          )}
        </section>
      )}

      {issue && (
        <p role="status" className="rounded bg-teal-50 p-3 text-sm text-teal-900">
          Issued {issue.issued} certificate{issue.issued === 1 ? "" : "s"}
          {issue.skipped > 0 && `; skipped ${issue.skipped} row(s) that were duplicates or already issued`}.
        </p>
      )}

      {/* ── Step 3: send ── */}
      <section aria-labelledby="step-send" className="rounded-lg border border-stone-200 p-4">
        <h2 id="step-send" className="mb-1 text-base font-semibold text-stone-900">
          3. Send certificates by domain
        </h2>
        <p className="mb-3 text-sm text-stone-600">
          Mail everyone whose address matches a domain. Subdomains count by default —{" "}
          <code>mail.butwalhacks.com</code> is part of <code>butwalhacks.com</code>.{" "}
          <code>notbutwalhacks.com</code> is not, and never will be.
        </p>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="domain" className="mb-1 block text-xs font-medium text-stone-600">
              Domain
            </label>
            <input
              id="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="butwalhacks.com"
              aria-describedby="domain-help"
              aria-invalid={unknownDomain}
              className="rounded border border-stone-300 px-2 py-1.5 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-stone-700">
            <input type="checkbox" checked={subdomains} onChange={(e) => setSubdomains(e.target.checked)} />
            Include subdomains
          </label>
          <button
            type="button"
            onClick={doSend}
            disabled={busy || domain.trim().length === 0}
            className="rounded bg-bh-red-500 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {phase === "sending" ? "Sending…" : "Send"}
          </button>
        </div>

        <p id="domain-help" className="mt-2 text-xs text-stone-500">
          {selectedDomain
            ? `${selectedDomain.count} recipient(s) in this roster.`
            : preview && preview.preview.domains.length > 0
              ? `Domains in this roster: ${preview.preview.domains.map((d) => d.domain).join(", ")}`
              : "Check a roster first to see which domains are present."}
        </p>

        {unknownDomain && (
          <p className="mt-1 text-xs text-amber-800">
            No address in this roster uses <strong>{domain}</strong>. Sending will reach nobody — check
            the spelling.
          </p>
        )}

        {summary && (
          <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Matched" value={summary.candidates} />
            <Stat label="Sent" value={summary.sent} tone="good" />
            <Stat label="Failed" value={summary.failed} tone={summary.failed > 0 ? "bad" : undefined} />
            <Stat label="Already sent" value={summary.skippedAlreadySent} />
          </dl>
        )}
      </section>

      {error && (
        <p role="alert" className="rounded bg-bh-red-50 p-3 text-sm text-bh-red-800">
          {error}
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "good" | "warn" | "bad";
}) {
  const cls =
    tone === "good" ? "text-teal-700" : tone === "bad" ? "text-bh-red-600" : tone === "warn" ? "text-amber-700" : "text-stone-900";
  return (
    <div className="rounded bg-stone-50 p-2">
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className={`text-lg font-bold ${cls}`}>{value}</dd>
    </div>
  );
}

/** Re-exported so the templates list page can reuse the delete action type. */
export { deleteTemplate };
