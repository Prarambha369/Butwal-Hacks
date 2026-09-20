"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Copy, Check, ExternalLink, User, ShieldCheck } from "lucide-react";

interface BHIDClaimCardProps {
  bhId: string;
  role: string;
  fullName: string;
}

export function BHIDClaimCard({ bhId, role, fullName }: BHIDClaimCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(bhId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [bhId]);

  const roleColors: Record<string, { bg: string; text: string; dot: string }> = {
    hacker: { bg: "bg-status-green/10", text: "text-status-green", dot: "bg-status-green" },
    organizer: { bg: "bg-status-yellow/10", text: "text-status-yellow", dot: "bg-status-yellow" },
    maintainer: { bg: "bg-primary-red/10", text: "text-primary-red", dot: "bg-primary-red" },
    sponsor: { bg: "bg-status-blue/10", text: "text-status-blue", dot: "bg-status-blue" },
  };

  const colors = roleColors[role] ?? roleColors.hacker;

  return (
    <div className="bh-card overflow-hidden">
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Avatar area */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-red/20 to-primary-red/5 border-2 border-primary-red/20 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary-red">
                {fullName?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary-red border-2 border-surface flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          {/* Identity info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-primary truncate">
                {fullName || "New Hacker"}
              </h1>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colors.bg} ${colors.text} border-current/20`}>
                <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                {role}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* BH-ID display */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-hover border border-border group">
                <span className="text-xs font-mono font-bold text-primary tracking-wide">
                  {bhId}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-1 rounded-md hover:bg-surface text-muted-foreground hover:text-primary transition-all"
                  aria-label={copied ? "Copied" : "Copy BH-ID"}
                  title={copied ? "Copied!" : "Copy to clipboard"}
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-status-green" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>


            </div>

            <p className="text-xs text-muted-foreground">
              This is your verified Butwal Hacks identity. Share your BH-ID to receive trust markers, collaborate on projects, and build your reputation.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 shrink-0">
            <Link
              href={`/p/${bhId}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-primary-red text-white text-xs font-bold hover:bg-deep-red transition-all shadow-[--bh-glow-red-soft] hover:shadow-[--bh-glow-red] active:scale-[0.97]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Public Profile
            </Link>
            <Link
              href="/dashboard/hacker/profile"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-border bg-surface text-primary text-xs font-bold hover:bg-surface-hover transition-all active:scale-[0.97]"
            >
              <User className="w-3.5 h-3.5" />
              Edit Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
