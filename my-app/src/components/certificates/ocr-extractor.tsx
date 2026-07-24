"use client";

import React, { useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { FileText, Loader2, CheckCircle2, AlertCircle, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CloudinaryUpload } from "@/components/cloudinary-upload";

interface ExtractedData {
  title: string;
  description: string;
  issuer: string | null;
  date: string | null;
  type: string;
}

type Status = "idle" | "uploading" | "extracting" | "done" | "error";

export function OcrExtractor() {
  const { user } = useUser();
  const [status, setStatus] = useState<Status>("idle");
  const [cloudinaryUrl, setCloudinaryUrl] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpload = (url: string) => {
    setCloudinaryUrl(url);
    setStatus("idle");
    setExtracted(null);
    setErrorMessage(null);
  };

  const handleExtract = async () => {
    if (!cloudinaryUrl) return;
    setStatus("extracting");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/certificates/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cloudinaryUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}`);
      }

      setExtracted({
        title: data.marker.title,
        description: data.marker.description,
        issuer: data.marker.issuer,
        date: data.marker.date,
        type: data.marker.type,
      });
      setStatus("done");
      toast.success("Certificate extracted successfully!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Extraction failed";
      setErrorMessage(msg);
      setStatus("error");
      toast.error(msg);
    }
  };

  const handleReset = () => {
    setCloudinaryUrl(null);
    setExtracted(null);
    setStatus("idle");
    setErrorMessage(null);
  };

  return (
    <div className="bh-card p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-primary-red/10">
          <FileText className="w-5 h-5 text-primary-red" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-primary">Certificate Extractor</h3>
          <p className="text-xs text-muted-foreground">
            Upload a certificate image to extract details and create a trust marker
          </p>
        </div>
      </div>

      {/* Upload area */}
      {!cloudinaryUrl && status === "idle" && (
        <CloudinaryUpload
          onUpload={handleUpload}
          onError={(msg) => toast.error(msg)}
          label="Upload Certificate Image"
          currentImage=""
          entityType="certificate"
          bhId={user?.sub}
          uploaderAuth0Id={user?.sub}
        />
      )}

      {/* Uploaded image preview */}
      {cloudinaryUrl && status !== "done" && (
        <div className="relative rounded-lg overflow-hidden border border-border bg-surface-hover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cloudinaryUrl}
            alt="Uploaded certificate"
            className="w-full h-48 object-contain"
          />
          <button
            onClick={handleReset}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 text-muted-foreground hover:text-primary transition-colors"
            aria-label="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Extract button */}
      {cloudinaryUrl && status !== "done" && (
        <button
          onClick={handleExtract}
          disabled={status === "extracting"}
          className={cn(
            "w-full rounded-full py-3 text-sm font-bold text-white transition-all flex items-center justify-center gap-2",
            status === "extracting"
              ? "bg-primary-red/60 cursor-not-allowed"
              : "bg-primary-red hover:bg-deep-red hover:shadow-[var(--bh-glow-red)]"
          )}
        >
          {status === "extracting" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Extracting...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Extract Certificate Data
            </>
          )}
        </button>
      )}

      {/* Error state */}
      {status === "error" && errorMessage && (
        <div className="p-4 rounded-lg bg-primary-red/10 border border-primary-red/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary-red shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-primary-red">Extraction failed</p>
            <p className="text-xs text-muted-foreground mt-1">{errorMessage}</p>
          </div>
          <button
            onClick={handleReset}
            className="ml-auto text-xs text-primary-red hover:text-deep-red transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* Extracted data display */}
      {status === "done" && extracted && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-status-green" />
            <span className="text-sm font-bold text-status-green">Data extracted successfully</span>
          </div>

          <div className="space-y-3 p-4 rounded-lg bg-surface-hover border border-border">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Title</p>
              <p className="text-sm font-bold text-primary">{extracted.title}</p>
            </div>
            {extracted.issuer && (
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Issuer</p>
                <p className="text-sm text-primary">{extracted.issuer}</p>
              </div>
            )}
            {extracted.date && (
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Date</p>
                <p className="text-sm text-primary">{extracted.date}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Type</p>
              <p className="text-sm text-primary capitalize">{extracted.type}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleReset}
              className="flex-1 rounded-full py-2.5 text-sm font-bold bg-surface-hover border border-border text-primary hover:bg-surface-hover transition-all"
            >
              Extract another
            </button>
            <a
              href="/dashboard/hacker/certificates"
              className="flex-1 rounded-full py-2.5 text-sm font-bold bg-primary-red text-white hover:bg-deep-red transition-all text-center"
            >
              View achievements
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
