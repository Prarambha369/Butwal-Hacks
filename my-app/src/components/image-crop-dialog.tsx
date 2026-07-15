"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ZoomIn, ZoomOut, Check, X, Crop } from "lucide-react";

// ponytail: Image optimization skipped for crop preview — img ref is required for canvas drawImage()
/* eslint-disable @next/next/no-img-element */

interface ImageCropDialogProps {
  file: File;
  /** Called with the cropped blob when user confirms */
  onConfirm: (croppedBlob: Blob) => void;
  /** Called when user cancels */
  onCancel: () => void;
  /** Aspect ratio for the crop box. Defaults to 16/9 for banners/covers. */
  aspectRatio?: number;
}

export default function ImageCropDialog({ file, onConfirm, onCancel, aspectRatio = 16 / 9 }: ImageCropDialogProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Image natural dimensions
  const [natW, setNatW] = useState(0);
  const [natH, setNatH] = useState(0);
  // Image object URL
  const [src, setSrc] = useState("");

  // Pan offset (px relative to the image top-left, before scale)
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  // Zoom (1 = fit-to-width of the crop box)
  const [zoom, setZoom] = useState(1);
  // Drag state
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Derive the aspect ratio from the prop (defaults to 16/9 for banners)
  const ASPECT = aspectRatio;

  // Compute the crop-box dimensions in the container
  const [boxPx, setBoxPx] = useState({ w: 480, h: 270 });
  const containerRefCallback = useCallback((el: HTMLDivElement | null) => {
    // store in a ref-like way so the effect below can read the latest value
    if (el) {
      const maxW = Math.min(el.clientWidth - 48, 640);
      setBoxPx({ w: maxW, h: maxW / ASPECT });
    }
  }, []);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    const img = new Image();
    img.onload = () => {
      setNatW(img.naturalWidth);
      setNatH(img.naturalHeight);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Reset zoom/pan when image loads
  useEffect(() => {
    if (natW && natW > 0) {
      // Initial zoom: fit the image width to the crop box width
      const fit = boxPx.w / natW;
      setZoom(fit);
      setPanX(0);
      setPanY(0);
    }
  }, [natW, natH, boxPx.w]);

  // --- Mouse/Touch pan handlers ---
  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, panX, panY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPanX(dragStart.current.panX + dx);
    setPanY(dragStart.current.panY + dy);
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  // --- Zoom ---
  const handleZoomIn = () => setZoom(z => Math.min(z * 1.2, 5));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.2, 0.1));

  // --- Confirm: render cropped region to canvas ---
  const handleConfirm = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    // The displayed image dimensions
    const dispW = natW * zoom;
    const dispH = natH * zoom;

    // The crop box is centered in the container
    const container = containerRef.current;
    if (!container) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const boxW = boxPx.w;
    const boxH = boxPx.h;
    const boxLeft = (cw - boxW) / 2;
    const boxTop = (ch - boxH) / 2;

    // Image top-left position (centered + panned)
    const imgLeft = (cw - dispW) / 2 + panX;
    const imgTop = (ch - dispH) / 2 + panY;

    // Intersection of crop box with image bounds
    const cropLeft = Math.max(0, boxLeft - imgLeft);
    const cropTop = Math.max(0, boxTop - imgTop);
    const cropRight = Math.min(dispW, boxLeft + boxW - imgLeft);
    const cropBottom = Math.min(dispH, boxTop + boxH - imgTop);
    const cropW = Math.max(1, cropRight - cropLeft);
    const cropH = Math.max(1, cropBottom - cropTop);

    // Map to source coordinates
    const srcX = cropLeft / zoom;
    const srcY = cropTop / zoom;
    const srcW = cropW / zoom;
    const srcH = cropH / zoom;

    // Output at 1200px wide
    const outW = 1200;
    const outH = outW / ASPECT;

    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outW, outH);

    canvas.toBlob(
      (blob) => {
        if (blob) onConfirm(blob);
      },
      file.type,
      0.92,
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80">
      <div
        className="bh-card shadow-2xl w-full max-w-2xl overflow-hidden animate-[fadeInUp_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Crop className="w-5 h-5 text-primary-red" />
            <h3 className="text-lg font-bold">{ASPECT === 1 ? "Adjust Profile Photo" : "Adjust Cover Image"}</h3>
          </div>
          <span className="text-[10px] font-mono text-secondary uppercase tracking-wider">
            {natW}×{natH}px
          </span>
        </div>

        {/* Image preview area */}
        <div
          ref={containerRefCallback}
          className="relative w-full overflow-hidden bg-black/40 select-none aspect-video max-h-[50vh] min-h-[240px]"
        >
          {src && (
            <img
              ref={imgRef}
              src={src}
              alt="Crop preview"
              draggable={false}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              className="absolute top-0 left-0 cursor-grab active:cursor-grabbing"
              style={{
                width: natW * zoom,
                height: natH * zoom,
                transform: `translate(${panX}px, ${panY}px)`,
                left: `calc(50% - ${(natW * zoom) / 2}px)`,
                top: `calc(50% - ${(natH * zoom) / 2}px)`,
              }}
            />
          )}

          {/* 16:9 crop overlay — dark outside, clear inside */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${boxPx.w} ${boxPx.h}`} preserveAspectRatio="xMidYMid meet">
            <defs>
              <mask id="cropMask">
                <rect width="100%" height="100%" fill="white" />
                <rect x={0} y={0} width={boxPx.w} height={boxPx.h} fill="black" rx={12} ry={12} />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.5)" mask="url(#cropMask)" />
          </svg>

          {/* Crop box border */}
          <div
            className="absolute pointer-events-none border-2 border-white/60 rounded-xl"
            style={{
              width: boxPx.w,
              height: boxPx.h,
              left: `calc(50% - ${boxPx.w / 2}px)`,
              top: `calc(50% - ${boxPx.h / 2}px)`,
            }}
          />

          {/* Guides */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: boxPx.w,
              height: boxPx.h,
              left: `calc(50% - ${boxPx.w / 2}px)`,
              top: `calc(50% - ${boxPx.h / 2}px)`,
            }}
          >
            {/* Rule-of-thirds grid */}
            <svg viewBox={`0 0 ${boxPx.w} ${boxPx.h}`} className="w-full h-full opacity-30">
              <line x1={boxPx.w / 3} y1={0} x2={boxPx.w / 3} y2={boxPx.h} stroke="white" strokeWidth={1} />
              <line x1={(boxPx.w * 2) / 3} y1={0} x2={(boxPx.w * 2) / 3} y2={boxPx.h} stroke="white" strokeWidth={1} />
              <line x1={0} y1={boxPx.h / 3} x2={boxPx.w} y2={boxPx.h / 3} stroke="white" strokeWidth={1} />
              <line x1={0} y1={(boxPx.h * 2) / 3} x2={boxPx.w} y2={(boxPx.h * 2) / 3} stroke="white" strokeWidth={1} />
            </svg>
            {/* "16:9" label */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/40 text-[10px] font-mono text-white/80 border border-white/20">
              {ASPECT === 1 ? "1:1" : ASPECT >= 1.7 ? "16:9" : "4:3"}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4 p-4 border-t border-border">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-2 rounded-lg hover:bg-surface/10 text-secondary hover:text-primary transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min={10}
              max={200}
              value={Math.round(zoom * 100)}
              onChange={(e) => setZoom(Number(e.target.value) / 100)}
              className="w-24 h-1 accent-bh-red-500 cursor-pointer"
            />
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-2 rounded-lg hover:bg-surface/10 text-secondary hover:text-primary transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono text-secondary w-12 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl bg-surface/10 hover:bg-surface/20 text-secondary font-medium transition-all text-sm"
            >
              <X className="w-4 h-4 inline mr-1" /> Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 rounded-xl bg-bh-red-600 hover:bg-primary-red text-primary font-bold transition-all text-sm flex items-center gap-1"
            >
              <Check className="w-4 h-4" /> Apply &amp; Upload
            </button>
          </div>
        </div>

        {/* Hidden canvas for crop output */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
