"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, X, Loader2, Crop as CropIcon, RefreshCw, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import ImageCropDialog from "@/components/image-crop-dialog";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export type CloudinaryEntityType =
  | "avatar"
  | "event_banner"
  | "project_cover"
  | "blog_cover"
  | "gallery_photo";

interface CloudinaryUploadProps {
  onUpload: (url: string) => void;
  onError?: (message: string) => void;
  label?: string;
  currentImage?: string;

  // Cloudinary structured metadata for backend moderation & filtering
  entityType?: CloudinaryEntityType;
  bhId?: string;
  eventSlug?: string;
  projectId?: string;
  uploaderAuth0Id?: string;
}

interface UploadProgress {
  pct: number;
  speedKBps: number;
}

/** Upload a blob/file to Cloudinary via the signed API endpoint. Returns the secure_url. */
async function uploadToCloudinary(
  blob: Blob,
  metadata: Record<string, string | undefined>,
  onProgress?: (progress: UploadProgress) => void,
  xhrRef?: { current: XMLHttpRequest | null },
): Promise<string> {
  // Fetch signature with metadata
  const res = await fetch("/api/cloudinary-signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      entity_type: metadata.entityType,
      bh_id: metadata.bhId,
      event_slug: metadata.eventSlug,
      project_id: metadata.projectId,
      uploader_auth0_id: metadata.uploaderAuth0Id,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to get upload signature");
  }

  const { signature, timestamp, cloudName, apiKey, folder, uploadPreset, metadata: metadataStr } = await res.json();

  const formData = new FormData();
  formData.append("file", blob);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);
  if (uploadPreset) formData.append("upload_preset", uploadPreset);
  if (metadataStr) formData.append("metadata", metadataStr);

  // Use XHR for upload progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    if (xhrRef) xhrRef.current = xhr;

    let lastLoaded = 0;
    let lastTime = Date.now();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const pct = Math.round((e.loaded / e.total) * 100);
        const now = Date.now();
        const elapsed = now - lastTime;
        // Calculate speed over this chunk (bytes per second)
        const loadedDelta = e.loaded - lastLoaded;
        const speedKBps = elapsed > 0 ? (loadedDelta / elapsed) : 0;
        lastLoaded = e.loaded;
        lastTime = now;
        onProgress({ pct, speedKBps: Math.round(speedKBps) });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);
          resolve(result.secure_url as string);
        } catch {
          reject(new Error("Failed to parse upload response"));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error?.message || err.error || "Cloudinary upload failed"));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Upload aborted"));

    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);
    xhr.send(formData);
  });
}

export function CloudinaryUpload({
  onUpload,
  onError,
  label = "Upload",
  currentImage,
  entityType,
  bhId,
  eventSlug,
  projectId,
  uploaderAuth0Id,
}: CloudinaryUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const pendingBlobRef = useRef<Blob | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  // Collect metadata once at render time (stable across retries)
  const metadataRef = useRef({ entityType, bhId, eventSlug, projectId, uploaderAuth0Id });
  metadataRef.current = { entityType, bhId, eventSlug, projectId, uploaderAuth0Id };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side file size validation
    if (file.size > MAX_FILE_SIZE) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      onError?.(`File is ${mb}MB — maximum allowed is 10MB`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    // Validate image type
    if (!file.type.startsWith("image/")) {
      onError?.("Please select an image file");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    // Show crop dialog instead of immediately uploading
    setCropFile(file);
  };

  const startUpload = useCallback(async (blob: Blob) => {
    setUploadError(null);
    setUploading(true);
    setUploadProgress(0);
    setUploadSpeed(0);
    pendingBlobRef.current = blob;
    try {
      const url = await uploadToCloudinary(blob, metadataRef.current, (p) => {
        setUploadProgress(p.pct);
        setUploadSpeed(p.speedKBps);
      }, xhrRef);
      onUpload(url);
      pendingBlobRef.current = null;
      xhrRef.current = null;
    } catch (error) {
      if ((error as Error)?.message === "Upload aborted") return;
      const msg = error instanceof Error ? error.message : "Upload failed";
      setUploadError(msg);
      onError?.(msg);
      console.error("Cloudinary upload error:", error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadSpeed(0);
    }
  }, [onUpload, onError]);

  const handleCropConfirm = useCallback((croppedBlob: Blob) => {
    setCropFile(null);
    startUpload(croppedBlob);
  }, [startUpload]);

  const handleRetry = useCallback(() => {
    if (pendingBlobRef.current) {
      startUpload(pendingBlobRef.current);
    }
  }, [startUpload]);

  const handleAbort = useCallback(() => {
    xhrRef.current?.abort();
    xhrRef.current = null;
    pendingBlobRef.current = null;
    setUploading(false);
    setUploadProgress(0);
    setUploadSpeed(0);
    setUploadError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const handleDismissError = useCallback(() => {
    setUploadError(null);
    pendingBlobRef.current = null;
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const handleCropCancel = useCallback(() => {
    setCropFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      {currentImage ? (
        <div className="relative w-full h-32 rounded-xl overflow-hidden border border-border">
          <Image src={currentImage} alt="Uploaded" fill className="object-cover" />
          <button
            type="button"
            onClick={uploading ? handleAbort : () => onUpload("")}
            className="absolute top-2 right-2 p-1 rounded-full bg-background/80 text-primary hover:bg-background/90 transition-colors"
            title={uploading ? "Cancel upload" : "Remove image"}
          >
            {uploading ? <Ban className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
          {uploading && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "w-full h-32 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2",
            "text-secondary hover:text-primary hover:border-primary-red/50 transition-all",
            uploading && "opacity-50 cursor-not-allowed",
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 w-full px-6">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs font-medium">Uploading {uploadProgress}%</span>
              {uploadSpeed > 0 && (
                <span className="text-[10px] font-mono text-secondary">
                  {uploadSpeed < 1000
                    ? `${uploadSpeed} KB/s`
                    : `${(uploadSpeed / 1024).toFixed(1)} MB/s`}
                </span>
              )}
              <div className="w-full h-1.5 rounded-full bg-surface/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-bh-red-500 transition-all duration-200 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <button
                type="button"
                onClick={handleAbort}
                className="px-2 py-1 rounded-lg bg-surface/10 hover:bg-primary-red/20 text-secondary hover:text-primary-red text-[10px] font-medium transition-all flex items-center gap-1"
              >
                <Ban className="w-3 h-3" /> Cancel
              </button>
            </div>
          ) : uploadError ? (
            <div className="flex flex-col items-center gap-2 w-full px-6">
              <div className="w-8 h-8 rounded-full bg-primary-red/20 flex items-center justify-center">
                <X className="w-4 h-4 text-primary-red" />
              </div>
              <span className="text-xs text-primary-red font-medium text-center max-w-[200px]">{uploadError}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="px-3 py-1.5 rounded-lg bg-bh-red-600 hover:bg-primary-red text-primary text-xs font-bold transition-all flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
                <button
                  type="button"
                  onClick={handleDismissError}
                  className="px-3 py-1.5 rounded-lg bg-surface/10 hover:bg-surface/20 text-secondary text-xs font-medium transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <Upload className="w-6 h-6" />
              <span className="text-xs font-medium">{label}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface/10 border border-border text-[10px] text-secondary font-mono">
                <CropIcon className="w-3 h-3" /> {entityType === "avatar" ? "1:1" : "16:9"} — crop after select
              </span>
            </>
          )}
        </button>
      )}

      {/* Crop dialog — aspect ratio adapts to entity type (1:1 for avatars, 16:9 for banners/covers) */}
      {cropFile && (
        <ImageCropDialog
          file={cropFile}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
          aspectRatio={entityType === "avatar" ? 1 : 16 / 9}
        />
      )}
    </div>
  );
}
