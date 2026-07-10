"use client";

import type { TrustMarker } from "@/lib/supabase-types"
import { GlassBadge } from "@/components/ui/glass-badge"
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

function CopyBadgeUrl({ markerId }: { markerId: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    const url = `${window.location.origin}/api/badges/assertions/${markerId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard unavailable */ }
  }

  return (
    <button
      onClick={copy}
      className="ml-1 inline-flex items-center gap-1 rounded-full bg-surface/10 px-2 py-0.5 text-[9px] font-mono text-secondary opacity-0 transition-opacity hover:text-bh-red-500 group-hover:opacity-100"
      title="Copy Open Badge 3.0 URL"
    >
      {copied ? (
        <><Check className="h-2.5 w-2.5 text-status-green" /> Copied</>
      ) : (
        <><Copy className="h-2.5 w-2.5" /> OB3</>
      )}
    </button>
  )
}

export default function TrustMarkersList({ markers }: TrustMarkersListProps) {
  if (!markers || markers.length === 0) return null

  // Separate active and revoked markers
  const active = markers.filter((m) => !m.is_revoked)
  const revoked = markers.filter((m) => m.is_revoked)

  if (active.length === 0 && revoked.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-primary opacity-40">
          Trust Markers
        </h3>
        <span className="text-[10px] font-mono text-secondary opacity-60">
          {active.length} Verified
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Active markers — red glass */}
        {active.map((m) => (
          <div
            key={m.id}
            className="group relative"
            title={m.description || m.title}
          >
            <GlassBadge tier="verified" dot="red">
              <span className="flex items-center gap-1">
                {markerIcon(m.type)}
                {m.title}
              </span>
            </GlassBadge>
            <CopyBadgeUrl markerId={m.id} />
          </div>
        ))}

        {/* Revoked markers — greyed out with strikethrough */}
        {revoked.map((m) => (
          <div
            key={m.id}
            className="group relative"
            title={m.revocation_reason || `Revoked — ${m.title}`}
          >
            <GlassBadge tier="revoked">
              <span className="flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" />
                {m.title}
              </span>
            </GlassBadge>
          </div>
        ))}
      </div>
    </div>
  )
}
