"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { FlipHorizontal, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

/**
 * CameraCapture — a full-screen modal that captures a photo from the
 * device camera and returns it as a JPEG File suitable for the
 * CloudinaryUpload crop dialog pipeline.
 *
 * ponytail: single-use component — no flash, timer, or burst modes.
 */
export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  // Request camera access
  const startCamera = useCallback(async (facing: "user" | "environment") => {
    setLoading(true);
    setError(null);

    // Clean up previous stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1920 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready before removing loading state
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setLoading(false);
        };
      }
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Camera access denied. Please allow camera permissions in your browser settings."
          : err instanceof DOMException && err.name === "NotFoundError"
            ? "No camera found on this device."
            : "Could not access the camera. Please check your permissions.";
      setError(message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [startCamera, facingMode]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Match canvas size to the video's intrinsic dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flip the canvas horizontally if using user-facing camera
    // to match the mirror effect
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to a JPEG blob
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Failed to capture photo");
          return;
        }

        // Create a File so it works with CloudinaryUpload's file validation
        const file = new File([blob], "camera-capture.jpg", {
          type: "image/jpeg",
          lastModified: Date.now(),
        });

        // Clean up the camera stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }

        onCapture(file);
      },
      "image/jpeg",
      0.92,
    );
  }, [facingMode, onCapture]);

  const handleRetry = useCallback(() => {
    startCamera(facingMode);
  }, [startCamera, facingMode]);

  const handleFlipCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label="Camera capture"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 z-10">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          aria-label="Close camera"
        >
          <X className="w-5 h-5" />
          <span className="text-sm font-medium">Cancel</span>
        </button>
        <h2 className="text-sm font-semibold text-white/90">Take a Photo</h2>
        <div className="w-16" /> {/* spacer */}
      </div>

      {/* Camera viewport */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Loading state */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/60">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm font-medium">Accessing camera...</span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary-red/20 flex items-center justify-center">
              <X className="w-6 h-6 text-primary-red" />
            </div>
            <p className="text-white/80 text-sm max-w-sm">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="px-5 py-2 rounded-full bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-all"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-full bg-white/10 text-white/60 text-sm font-medium hover:bg-white/20 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Video element — mirrored for user-facing camera */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "w-full h-full object-cover",
            facingMode === "user" ? "scale-x-[-1]" : "",
            loading || error ? "opacity-0" : "opacity-100",
          )}
        />

        {/* Face oval guide overlay */}
        {!loading && !error && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-64 md:w-80 md:h-80 rounded-full border-2 border-white/30" />
          </div>
        )}

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Bottom controls */}
      {!loading && !error && (
        <div className="flex items-center justify-center gap-12 px-4 py-8">
          {/* Flip camera button */}
          <button
            onClick={handleFlipCamera}
            className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all"
            aria-label="Flip camera"
          >
            <FlipHorizontal className="w-5 h-5" />
          </button>

          {/* Capture button */}
          <button
            onClick={handleCapture}
            className="w-20 h-20 rounded-full bg-white flex items-center justify-center hover:bg-white/90 transition-all active:scale-95 shadow-lg"
            aria-label="Take photo"
          >
            <div className="w-16 h-16 rounded-full border-4 border-black/20" />
          </button>

          {/* Spacer for symmetry */}
          <div className="w-12" />
        </div>
      )}
    </div>
  );
}
