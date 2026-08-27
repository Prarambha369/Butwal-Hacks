"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  CameraOff,
  Loader2,
  CheckCircle2,
  XCircle,
  Search,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface QrScannerClientProps {
  eventId: string;
}

interface CheckinResult {
  id: string;
  name: string;
  avatar: string | null;
  success: boolean;
  message: string;
}

export function QrScannerClient({ eventId: _eventId }: QrScannerClientProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [barcodeSupported, setBarcodeSupported] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [manualId, setManualId] = useState("");
  const [manualLoading, setManualLoading] = useState(false);

  // History of scan results for this session
  const [results, setResults] = useState<CheckinResult[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const [showResults, setShowResults] = useState(true);

  // Prevent duplicate scans — resets on page refresh (per-session dedup)
  // Privacy: Registration UUIDs are encoded directly in QR codes (no third-party data sent).
  const lastScannedRef = useRef<Set<string>>(new Set());

  // Audio feedback: short beep on successful scan
  const playBeep = useCallback((success: boolean) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = success ? 880 : 330; // High beep for success, low for failure
      osc.type = "sine";
      gain.gain.value = 0.15;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio not available — silent fallback
    }
  }, []);

  // Haptic feedback on mobile
  const vibrate = useCallback((success: boolean) => {
    try {
      if (navigator.vibrate) {
        navigator.vibrate(success ? [50] : [30, 30, 30]);
      }
    } catch {
      // Haptics not available
    }
  }, []);

  // Check BarcodeDetector support
  useEffect(() => {
    const supported =
      "BarcodeDetector" in globalThis &&
      // @ts-expect-error - BarcodeDetector may not be in all TS libs
      typeof BarcodeDetector !== "undefined";
    setBarcodeSupported(supported);
  }, []);

  const performCheckin = useCallback(
    async (registrationId: string) => {
      try {
        const res = await fetch("/api/events/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registration_id: registrationId, attended: true }),
        });

        const data = await res.json();

        if (!res.ok) {
          playBeep(false);
          vibrate(false);
          setResults((prev) => [
            {
              id: registrationId,
              name: "Unknown",
              avatar: null,
              success: false,
              message: data.error ?? "Check-in failed",
            },
            ...prev,
          ]);
          return;
        }

        playBeep(true);
        vibrate(true);
        setResults((prev) => [
          {
            id: registrationId,
            name: data.attended ? "Checked in" : "Check-in removed",
            avatar: null,
            success: true,
            message: data.attended ? "Welcome! ✓" : "Check-in undone",
          },
          ...prev,
        ]);
        setSuccessCount((c) => c + 1);
        router.refresh();
      } catch {
        playBeep(false);
        vibrate(false);
        setResults((prev) => [
          {
            id: registrationId,
            name: "Error",
            avatar: null,
            success: false,
            message: "Network error",
          },
          ...prev,
        ]);
      }
    },
    [router],
  );

  const processFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // @ts-expect-error - BarcodeDetector may not be in all TS libs
      const detector = new BarcodeDetector({ formats: ["qr_code"] });
      const barcodes = await detector.detect(canvas);

      for (const barcode of barcodes) {
        const rawValue = barcode.rawValue.trim();
        if (rawValue && !lastScannedRef.current.has(rawValue)) {
          lastScannedRef.current.add(rawValue);
          await performCheckin(rawValue);
        }
      }
    } catch {
      // BarcodeDetector error — silently retry on next frame
    }
  }, [performCheckin]);

  const startScanLoop = useCallback(() => {
    setScanning(true);
    scanIntervalRef.current = setInterval(() => {
      processFrame();
    }, 1500);
  }, [processFrame]);

  // Camera management
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      startScanLoop();
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Camera permission denied. Allow camera access or use manual entry."
          : "Could not access camera. Use manual entry below.";
      setCameraError(msg);
      toast.error(msg);
    }
  }, [startScanLoop]);

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setScanning(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [stopCamera]);

  // Manual BH-ID check-in
  const handleManualCheckin = useCallback(async () => {
    const id = manualId.trim();
    if (!id) {
      toast.error("Enter a valid registration UUID.");
      return;
    }

    setManualLoading(true);
    try {
      // First, try to find the registration by scanning for BH-ID or registration ID
      const res = await fetch("/api/events/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registration_id: id, attended: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Check-in failed");
        return;
      }

      toast.success("Checked in!");
      setManualId("");
      setSuccessCount((c) => c + 1);
      router.refresh();
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setManualLoading(false);
    }
  }, [manualId, router]);

  return (
    <div className="space-y-6">
      {/* Camera Section */}
      <div className="bh-card border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-primary flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary-red" />
            Camera Scanner
          </h2>
          <div className="flex items-center gap-2">
            {!barcodeSupported && (
              <span className="text-[10px] text-status-yellow font-mono">
                QR scanner not supported in this browser
              </span>
            )}
            {cameraActive ? (
              <button
                onClick={stopCamera}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-hover text-xs font-medium text-muted-foreground hover:text-primary-red transition-all"
              >
                <CameraOff className="w-3.5 h-3.5" />
                Stop Camera
              </button>
            ) : (
              <button
                onClick={startCamera}
                disabled={!barcodeSupported}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-red text-white text-xs font-bold hover:bg-deep-red transition-all disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5" />
                Start Camera
              </button>
            )}
          </div>
        </div>

        {/* Camera feed */}
        {cameraActive ? (
          <div className="relative rounded-xl overflow-hidden bg-black/5 border border-border max-w-xl mx-auto">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-[4/3] object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-primary-red/50 rounded-xl animate-pulse" />
            </div>
            {/* Scanning indicator */}
            <div className="absolute bottom-3 left-3 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md font-mono">
              {scanning ? "Scanning..." : "Ready"}
            </div>
          </div>
        ) : cameraError ? (
          <div className="rounded-xl border border-status-yellow/30 bg-status-yellow/5 p-6 text-center space-y-3">
            <CameraOff className="w-10 h-10 text-status-yellow mx-auto" />
            <p className="text-sm text-muted-foreground">{cameraError}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 bg-surface-hover/30 p-10 text-center space-y-3">
            <Camera className="w-10 h-10 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground/60">
              {barcodeSupported
                ? "Tap 'Start Camera' to scan QR codes. You'll hear a beep on successful check-in."
                : "QR scanning unavailable in this browser. Use manual entry below."}
            </p>
          </div>
        )}
      </div>

      {/* Manual Entry Section */}
      <div className="bh-card border border-border p-6 space-y-4">
        <h2 className="text-sm font-bold text-primary flex items-center gap-2">
          <Search className="w-4 h-4 text-primary-red" />
          Manual Check-in
        </h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleManualCheckin();
            }}
            placeholder="Paste registration UUID or BH-ID..."
            className="flex-1 bg-background/50 border border-border/30 rounded-lg px-4 py-3 outline-none text-sm font-mono transition-all focus:border-primary-red/50 focus:ring-2 focus:ring-primary-red/20"
          />
          <button
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText();
                if (text) setManualId(text.trim());
              } catch {
                // Clipboard not available
              }
            }}
            className="px-3 py-3 rounded-lg border border-border/30 text-xs text-muted-foreground hover:bg-surface-hover transition-all shrink-0"
            title="Paste from clipboard"
          >
            Paste
          </button>
          <button
            onClick={handleManualCheckin}
            disabled={manualLoading || !manualId.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-3 rounded-lg bg-primary-red text-white text-xs font-bold hover:bg-deep-red transition-all disabled:opacity-50 shrink-0"
          >
            {manualLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <User className="w-3.5 h-3.5" />
            )}
            Check In
          </button>
        </div>
      </div>

      {/* Results Feed */}
      {results.length > 0 && (
        <div>
          <button
            onClick={() => setShowResults(!showResults)}
            className="w-full flex items-center justify-between text-xs text-muted-foreground mb-3"
          >
            <span className="font-bold text-primary flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-status-green" />
              {successCount} checked in · {results.length} total scans
            </span>
            <span>{showResults ? "Hide" : "Show"}</span>
          </button>

          {showResults && (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {results.map((r, i) => (
                <div
                  key={`${r.id}-${i}`}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-all",
                    r.success
                      ? "border-status-green/30 bg-status-green/5"
                      : "border-primary-red/20 bg-primary-red/5",
                  )}
                >
                  {r.success ? (
                    <CheckCircle2 className="w-5 h-5 text-status-green shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-primary-red shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-primary truncate">{r.name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground/50">
                      {r.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
