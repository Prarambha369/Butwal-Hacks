import React from "react";
import { Eye } from "lucide-react";

/**
 * PublicProfileIndicator — honest static indicator.
 * Profile visibility is always public by platform design (no toggle needed).
 * This component communicates that fact clearly instead of pretending to toggle.
 */
export function PublicProfileToggle() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-red/10 border border-primary-red/20">
        <Eye size={14} className="text-primary-red shrink-0" />
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-primary-red">
          Always Public
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground px-1 leading-relaxed">
        Your profile, projects, and trust markers are visible to the community.
        This builds a portable, verifiable identity you carry everywhere.
      </p>
    </div>
  );
}
