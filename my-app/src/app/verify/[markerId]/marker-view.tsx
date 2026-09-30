import type { VerifiedMarker } from "@/lib/verify/resolve";
import { ShieldCheck, XCircle, Award, Clock, UserCheck } from "lucide-react";
import Link from "next/link";
import { formatDualDate } from "@/lib/nepali-date";

/** Icons per marker type. Moved verbatim out of page.tsx when /verify/[id] was
 *  taught to resolve certificates as well as markers. */
export function markerIcon(type: string) {
  switch (type) {
    case "achievement":
    case "special_recognition":
      return <Award className="w-5 h-5" />;
    case "verification":
      return <ShieldCheck className="w-5 h-5" />;
    case "participation":
      return <Clock className="w-5 h-5" />;
    default:
      return <ShieldCheck className="w-5 h-5" />;
  }
}

export function MarkerView({ marker }: { marker: VerifiedMarker }) {
  const isActive = !marker.is_revoked;
  const issuerName = (marker.issuer as { full_name?: string })?.full_name ?? "Unknown";
  const issuerBhId = (marker.issuer as { bh_id?: string })?.bh_id ?? "";
  const holderName = (marker.profile as { full_name?: string })?.full_name ?? null;
  const holderBhId = (marker.profile as { bh_id?: string })?.bh_id ?? null;
  const eventTitle = (marker.events as { title?: string })?.title ?? null;

  return (
    <main className="min-h-dvh bg-background pt-24 pb-16 px-6 md:px-20">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div
            className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
              isActive
                ? "bg-primary-red/10 text-primary-red border-primary-red shadow-[0_0_15px_rgba(254,0,0,0.2)]"
                : "bg-surface/10 text-muted-foreground border-border"
            } border`}
          >
            {isActive ? (
              <ShieldCheck className="w-8 h-8" />
            ) : (
              <XCircle className="w-8 h-8" />
            )}
          </div>
          <h1 className={`text-3xl font-black tracking-tight ${isActive ? "text-primary" : "text-muted-foreground line-through"}`}>
            {marker.title}
          </h1>
          {marker.description && (
            <p className="text-text-body max-w-md mx-auto">{marker.description}</p>
          )}
        </div>

        {/* Status card */}
        <div
          className={`bh-card p-6 space-y-4 ${
            isActive
              ? "border-bh-red-500/30 shadow-[0_0_15px_rgba(254,0,0,0.15)]"
              : "opacity-70"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                isActive
                  ? "bg-primary-red/10 border-primary-red/30 text-primary-red"
                  : "bg-surface/10 border-border text-muted-foreground"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-bh-red-500" : "bg-text-muted"}`} />
              {isActive ? "Active / Verified" : "Revoked"}
            </span>
          </div>

          {marker.revocation_reason && (
            <div className="p-3 rounded-xl bg-surface/10 border border-border">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Revocation Reason</p>
              <p className="text-sm text-text-body">{marker.revocation_reason}</p>
            </div>
          )}

          {marker.crypto_signature && (
            <div className="p-3 rounded-xl bg-surface/10 border border-border">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Cryptographic Signature</p>
              <p className="text-[10px] font-mono text-muted-foreground break-all leading-relaxed">
                {marker.crypto_signature}
              </p>
            </div>
          )}
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Holder */}
          <div className="bh-card p-5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Issued To</p>
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
              <p className="text-sm text-muted-foreground italic">Unclaimed / Ghost Marker</p>
            )}
          </div>

          {/* Issuer */}
          <div className="bh-card p-5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Issued By</p>
            <p className="text-sm font-bold text-primary">{issuerName}</p>
            {issuerBhId && (
              <Link
                href={`/p/${issuerBhId}`}
                className="inline-flex items-center gap-1 text-xs font-mono text-primary-red hover:text-primary-red transition-colors"
              >
                <UserCheck className="w-3 h-3" />
                {issuerBhId}
              </Link>
            )}
          </div>

          {/* Type */}
          <div className="bh-card p-5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Type</p>
            <div className="flex items-center gap-2">
              <span className="text-primary-red">{markerIcon(marker.type)}</span>
              <p className="text-sm font-bold text-primary capitalize">{marker.type.replace(/_/g, " ")}</p>
            </div>
          </div>

          {/* Event */}
          <div className="bh-card p-5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Associated Event</p>
            {eventTitle ? (
              <p className="text-sm font-bold text-primary">{eventTitle}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">None</p>
            )}
          </div>

          {/* Date */}
          <div className="bh-card p-5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Issued At</p>
            <p className="text-sm font-bold text-primary">
              {formatDualDate(new Date(marker.created_at))}
            </p>
          </div>

          {/* Marker ID */}
          <div className="bh-card p-5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Marker ID</p>
            <p className="text-[11px] font-mono text-muted-foreground break-all">{marker.id}</p>
          </div>
        </div>

        {/* OB3 assertion link */}
        <div className="text-center">
          <Link
            href={`/api/badges/assertions/${marker.id}`}
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary-red transition-colors underline underline-offset-4"
          >
            <Award className="w-3.5 h-3.5" />
            View Open Badges 3.0 Credential
          </Link>
        </div>
      </div>
    </main>
  );
}
