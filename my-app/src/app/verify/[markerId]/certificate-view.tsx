import type { VerifiedCertificate } from "@/lib/verify/resolve";
import { isCertificateActive } from "@/lib/verify/resolve";
import { ShieldCheck, XCircle, UserCheck, Award, CalendarDays, Download } from "lucide-react";
import Link from "next/link";
import { formatDualDate } from "@/lib/nepali-date";

/**
 * Public view of a certificate -- the page a participant lands on after
 * scanning the code printed on their PDF.
 *
 * Deliberately mirrors MarkerView's structure so the two credential types look
 * and behave the same to a third party checking authenticity.
 */
export function CertificateView({ certificate }: { certificate: VerifiedCertificate }) {
  const active = isCertificateActive(certificate.status);
  const profile = certificate.profile as { full_name?: string; bh_id?: string } | null;
  const holderName = profile?.full_name ?? null;
  const holderBhId = profile?.bh_id ?? null;
  const eventTitle = (certificate.events as { title?: string })?.title ?? null;

  return (
    <main className="min-h-dvh bg-background pt-24 pb-16 px-6 md:px-20">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div
            className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
              active
                ? "bg-primary-red/10 text-primary-red border-primary-red shadow-[0_0_15px_rgba(254,0,0,0.2)]"
                : "bg-surface/10 text-muted-foreground border-border"
            } border`}
          >
            {active ? <ShieldCheck className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
          </div>
          <h1
            className={`text-3xl font-black tracking-tight ${
              active ? "text-primary" : "text-muted-foreground line-through"
            }`}
          >
            Certificate of Participation
          </h1>
          {eventTitle && <p className="text-text-body max-w-md mx-auto">{eventTitle}</p>}

          {/* Only offered while the certificate is live. The PDF route 410s a
              revoked certificate, but not offering the button is clearer than
              offering one that fails. */}
          {active && (
            <p className="pt-2">
              <a
                href={`/api/certificates/${certificate.id}/pdf`}
                className="inline-flex items-center gap-2 rounded-full bg-primary-red px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <Download size={16} aria-hidden="true" />
                Download certificate
              </a>
            </p>
          )}
        </div>

        <div
          className={`bh-card p-6 space-y-4 ${
            active ? "border-bh-red-500/30 shadow-[0_0_15px_rgba(254,0,0,0.15)]" : "opacity-70"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Status
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                active
                  ? "bg-primary-red/10 border-primary-red/30 text-primary-red"
                  : "bg-surface/10 border-border text-muted-foreground"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-bh-red-500" : "bg-text-muted"}`} />
              {active ? "Active / Verified" : "Revoked"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bh-card p-5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Issued To
            </p>
            {holderName ? (
              <>
                <p className="text-sm font-bold text-primary">{holderName}</p>
                {holderBhId && (
                  <Link
                    href={`/p/${holderBhId}`}
                    className="inline-flex items-center gap-1 text-xs font-mono text-primary-red hover:text-primary-red transition-colors"
                  >
                    <UserCheck className="w-3 h-3" />
                    {holderBhId}
                  </Link>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground italic">Recipient no longer on record</p>
            )}
          </div>

          <div className="bh-card p-5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Issued By
            </p>
            <p className="text-sm font-bold text-primary">Butwal Hacks</p>
          </div>

          <div className="bh-card p-5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Credential
            </p>
            <div className="flex items-center gap-2">
              <span className="text-primary-red">
                <Award className="w-5 h-5" />
              </span>
              <p className="text-sm font-bold text-primary capitalize">
                {(certificate.status ?? "issued").replace(/_/g, " ")}
              </p>
            </div>
          </div>

          <div className="bh-card p-5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Associated Event
            </p>
            {eventTitle ? (
              <p className="text-sm font-bold text-primary">{eventTitle}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">None</p>
            )}
          </div>

          <div className="bh-card p-5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Issued At
            </p>
            <p className="text-sm font-bold text-primary">
              {formatDualDate(new Date(certificate.issue_date))}
            </p>
          </div>

          <div className="bh-card p-5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Certificate ID
            </p>
            <p className="text-[11px] font-mono text-muted-foreground break-all">
              {certificate.id}
            </p>
          </div>
        </div>

        <div className="text-center flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="w-3.5 h-3.5" />
          This page is the canonical record for this certificate.
        </div>
      </div>
    </main>
  );
}
