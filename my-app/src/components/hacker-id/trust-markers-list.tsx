"use client";

import type { TrustMarker } from "@/lib/supabase-types"
import React, { useState } from "react"
import { ShieldCheck, XCircle, Clock, Award, Copy, Check } from "lucide-react"

interface TrustMarkersListProps {
  markers: TrustMarker[]
}

/** Map marker type to a descriptive icon label. */
function markerIcon(type: string) {
  switch (type) {
    case "achievement":
    case "special_recognition":
      return <Award className="w-3.5 h-3.5" />
    case "verification":
      return <ShieldCheck className="w-3.5 h-3.5" />
    case "participation":
      return <Clock className="w-3.5 h-3.5" />
    default:
      return <ShieldCheck className="w-3.5 h-3.5" />
  }
}

export default function TrustMarkersList({ markers }: TrustMarkersListProps) {
  if (!markers || markers.length === 0) return null

  const active = markers.filter((m) => !m.is_revoked)
  const revoked = markers.filter((m) => m.is_revoked)

  if (active.length === 0 && revoked.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-primary opacity-40">
          Trust Markers
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground opacity-60">
          {active.length} Verified
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Active markers — verified with glow (bh-trust-marker-verified) */}
        {active.map((m) => (
          <ActiveMarker key={m.id} marker={m} />
        ))}

        {/* Revoked markers — greyed out with strikethrough */}
        {revoked.map((m) => (
          <div
            key={m.id}
            className="group relative"
            title={m.revocation_reason || `Revoked — ${m.title}`}
          >
            <span className="bh-trust-marker-revoked">
              <XCircle className="w-3.5 h-3.5" />
              {m.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Whether a marker is issuer-verified (vs. self-reported). */
function isVerified(type: string): boolean {
  return ["achievement", "verification", "special_recognition"].includes(type)
}

function ActiveMarker({ marker }: { marker: TrustMarker }) {
  const [copied, setCopied] = useState(false)
  const m = marker
  const verified = isVerified(m.type)

  const copy = async () => {
    const url = `${window.location.origin}/api/badges/assertions/${m.id}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard unavailable */ }
  }

  return (
    <div className="group relative" title={m.description || m.title}>
      <span className={verified ? "bh-trust-marker-verified" : "bh-trust-marker-self-reported"}>
        <span className="flex items-center gap-1">
          {verified && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary-red shadow-[0_0_6px_rgba(254,0,0,0.4)] shrink-0" />
          )}
          {markerIcon(m.type)}
          {m.title}
        </span>
      </span>
      <button
        onClick={copy}
        className="ml-1 inline-flex items-center gap-1 rounded-full bg-surface-hover px-2 py-0.5 text-[9px] font-mono text-muted-foreground transition-all hover:text-primary-red"
        title="Copy Open Badge 3.0 URL"
      >
        {copied ? (
          <><Check className="h-2.5 w-2.5 text-status-green" /> Copied</>
        ) : (
          <><Copy className="h-2.5 w-2.5" /> OB3</>
        )}
      </button>
    </div>
  )
}
