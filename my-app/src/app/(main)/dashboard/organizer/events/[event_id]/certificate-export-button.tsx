"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CertificateExportButtonProps {
  eventId: string;
  hasCertificates: boolean;
}

export function CertificateExportButton({
  eventId,
  hasCertificates,
}: CertificateExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/export-certificates`);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg =
          res.status === 404
            ? "No certificates found. Close the event first to issue certificates."
            : body.error ?? "Failed to generate PDF.";
        toast.error(msg);
        return;
      }

      // Trigger file download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Certificates downloaded!");
    } catch {
      toast.error("Failed to download certificates. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!hasCertificates) {
    return (
      <button
        disabled
        className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-muted-foreground cursor-not-allowed"
      >
        Close Event First to Issue Certificates
      </button>
    );
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary-red px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-deep-red disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4" />
      )}
      {loading ? "Generating PDF..." : "Download All Certificates (PDF)"}
    </button>
  );
}
