"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, X, Ban } from "lucide-react"

interface ExtractedMarker {
  id: string
  title: string
  description: string
  issuer: string | null
  date: string | null
  type: string
}

type Status = "idle" | "uploading" | "extracting" | "done" | "error"

export function CertificateScanner() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status>("idle")
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ExtractedMarker | null>(null)
  const xhrRef = useRef<XMLHttpRequest | null>(null)

  const reset = useCallback(() => {
    setStatus("idle")
    setProgress(0)
    setError(null)
    setResult(null)
    if (inputRef.current) inputRef.current.value = ""
  }, [])

  const handleAbort = useCallback(() => {
    xhrRef.current?.abort()
    xhrRef.current = null
    reset()
  }, [reset])

  const handleFile = useCallback(async (file: File) => {
    reset()

    // Validate file type
    const isImage = file.type.startsWith("image/")
    const isPdf = file.type === "application/pdf"
    if (!isImage && !isPdf) {
      setError("Please upload an image (PNG, JPG, WebP) or a PDF certificate.")
      setStatus("error")
      return
    }

    // Validate file size (15MB max — Cloudinary limit)
    if (file.size > 15 * 1024 * 1024) {
      setError("File is too large. Maximum allowed is 15MB.")
      setStatus("error")
      return
    }

    // ── Step 1: Upload to Cloudinary ──────────────────────────
    setStatus("uploading")
    setProgress(0)

    try {
      const signRes = await fetch("/api/sign-cloudinary", { method: "POST" })
      if (!signRes.ok) throw new Error("Failed to get upload signature")

      const { signature, timestamp, cloudName, apiKey, folder, uploadPreset } = await signRes.json()

      const formData = new FormData()
      formData.append("file", file)
      formData.append("api_key", apiKey)
      formData.append("timestamp", String(timestamp))
      formData.append("signature", signature)
      formData.append("folder", folder)
      if (uploadPreset) formData.append("upload_preset", uploadPreset)

      const cloudinaryUrl = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhrRef.current = xhr

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100))
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText)
              // For PDFs, Cloudinary returns a URL that auto-converts to image on request
              resolve(result.secure_url as string)
            } catch {
              reject(new Error("Failed to parse upload response"))
            }
          } else {
            try {
              const err = JSON.parse(xhr.responseText)
              reject(new Error(err.error?.message || err.error || "Upload failed"))
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`))
            }
          }
        }

        xhr.onerror = () => reject(new Error("Network error during upload"))
        xhr.onabort = () => reject(new Error("Upload aborted"))

        xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`)
        xhr.send(formData)
      })

      // ── Step 2: Extract certificate data via AI ──────────────
      setStatus("extracting")
      setProgress(0)

      const extractRes = await fetch("/api/certificates/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cloudinaryUrl }),
      })

      const extractData = await extractRes.json()

      if (!extractRes.ok) {
        throw new Error(extractData.error || "AI extraction failed")
      }

      setResult(extractData.marker)
      setStatus("done")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong"
      if (msg === "Upload aborted") return
      setError(msg)
      setStatus("error")
    }
  }, [reset])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
            <FileText size={16} />
            AI Certificate Scanner
          </h3>
          <p className="text-[11px] text-secondary/50 mt-0.5">
            Upload a certificate image or PDF — AI extracts the details and creates a trust marker.
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,application/pdf"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Drop zone */}
      {status === "idle" && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => inputRef.current?.click()}
          className="lg-surface rounded-2xl border-2 border-dashed border-glass p-8 text-center cursor-pointer hover:border-bh-red-500/50 hover:bg-surface/5 transition-all group"
        >
          <div className="inline-flex p-3 rounded-xl bg-bh-red-500/10 border border-bh-red-500/20 mb-4 group-hover:scale-110 transition-transform">
            <Upload className="w-6 h-6 text-bh-red-500" />
          </div>
          <p className="text-sm font-bold text-primary">Drop certificate here</p>
          <p className="mt-1 text-xs text-secondary/60">or click to browse — PNG, JPG, WebP, or PDF</p>
          <div className="mt-3 flex justify-center gap-4 text-[10px] text-secondary/40 font-mono">
            <span>Max 15MB</span>
            <span>·</span>
            <span>AI-extracted</span>
          </div>
        </div>
      )}

      {/* Uploading progress */}
      {status === "uploading" && (
        <div className="lg-surface rounded-2xl border border-glass p-6 space-y-3">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-bh-red-500" />
            <span className="text-sm font-medium text-primary">Uploading certificate...</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-surface/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-bh-red-500 transition-all duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <button
            type="button"
            onClick={handleAbort}
            className="flex items-center gap-1 text-[11px] text-secondary/50 hover:text-bh-red-500 transition-colors"
          >
            <Ban className="w-3 h-3" /> Cancel
          </button>
        </div>
      )}

      {/* AI extracting */}
      {status === "extracting" && (
        <div className="lg-surface rounded-2xl border border-glass p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Loader2 className="w-5 h-5 animate-spin text-bh-red-500" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-bh-red-500 animate-pulse" />
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-primary">AI is reading your certificate...</span>
              <p className="text-[11px] text-secondary/50 mt-0.5">Extracting title, issuer, date, and type</p>
            </div>
          </div>
          {/* Animated dots */}
          <div className="flex gap-1 pl-8">
            <span className="w-1.5 h-1.5 rounded-full bg-bh-red-500/40 animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-bh-red-500/40 animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-bh-red-500/40 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      )}

      {/* Result — success */}
      {status === "done" && result && (
        <div className="lg-surface rounded-2xl border border-status-green/30 bg-status-green/5 p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-status-green/10 border border-status-green/20">
                <CheckCircle2 className="w-5 h-5 text-status-green" />
              </div>
              <div>
                <p className="text-sm font-bold text-primary">Trust Marker Created</p>
                <p className="text-[11px] text-secondary/50">Certificate scanned and verified</p>
              </div>
            </div>
            <button
              type="button"
              onClick={reset}
              className="p-1.5 rounded-lg hover:bg-surface/10 text-secondary/50 hover:text-primary transition-all"
              title="Scan another"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 bg-surface/10 rounded-xl p-4 border border-glass">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono text-secondary/50 uppercase tracking-wider">Title</span>
              <span className="px-2 py-0.5 rounded-full bg-bh-red-500/10 border border-bh-red-500/20 text-[9px] font-bold text-bh-red-500 uppercase tracking-wider">
                {result.type}
              </span>
            </div>
            <p className="text-sm font-bold text-primary">{result.title}</p>
            {result.issuer && (
              <p className="text-xs text-secondary/70">Issued by: {result.issuer}</p>
            )}
            {result.date && (
              <p className="text-xs text-secondary/50">{result.date}</p>
            )}
            {result.description && (
              <p className="text-xs text-secondary/60 mt-2 leading-relaxed border-t border-glass pt-2">
                {result.description}
              </p>
            )}
          </div>

          <p className="text-[10px] text-secondary/40">
            This certificate has been added as a trust marker on your profile.
          </p>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="lg-surface rounded-2xl border border-bh-red-500/30 bg-bh-red-500/5 p-6 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-bh-red-500/10 shrink-0">
              <AlertCircle className="w-5 h-5 text-bh-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-primary">Scan Failed</p>
              <p className="text-xs text-bh-red-500/80 mt-1 break-words">{error}</p>
            </div>
            <button
              type="button"
              onClick={handleAbort}
              className="p-1.5 rounded-lg hover:bg-surface/10 text-secondary/50 hover:text-primary transition-all shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-bh-red-500 hover:text-bh-red-400 transition-colors"
          >
            <Upload className="w-3 h-3" /> Try another file
          </button>
        </div>
      )}
    </div>
  )
}
