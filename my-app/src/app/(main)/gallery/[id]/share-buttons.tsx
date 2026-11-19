"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Share2 } from "lucide-react";

/**
 * Copy/share controls for a photo page.
 *
 * Copy is the primary action because it works everywhere, including in-app
 * browsers where the Web Share API is missing or half-implemented. Share is
 * rendered only after mount when `navigator.share` exists: rendering it during
 * SSR and removing it on hydration makes the button flash in and out for
 * every visitor whose browser lacks it.
 *
 * Clipboard writes reject on insecure origins and when the document is not
 * focused. Rather than reporting a dead end, that path reveals a read-only
 * input with the URL selected, which is the one manual copy that works in
 * every browser.
 */
export default function ShareButtons({ url, title }: { url: string; title: string }) {
  const [canShare, setCanShare] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [status, setStatus] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCanShare(typeof navigator.share === "function");
  }, []);

  // Focus and select the fallback the moment it appears, so the user's next
  // keystroke (Ctrl/Cmd+C) copies the whole link.
  useEffect(() => {
    if (!showFallback) return;
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.select();
  }, [showFallback]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setShowFallback(false);
      setStatus("Link copied");
    } catch {
      setShowFallback(true);
      setStatus("Couldn't copy — select the link below");
    }
  }, [url]);

  const handleShare = useCallback(() => {
    // navigator.share() has to be called synchronously from the click handler.
    // Awaiting anything first consumes the transient user activation and the
    // browser rejects the call with NotAllowedError.
    navigator.share({ title, url }).catch((error: unknown) => {
      // The user dismissing the native share sheet is a success, not a
      // failure, so it must not fall through to the copy fallback.
      if (error instanceof DOMException && error.name === "AbortError") return;
      void handleCopy();
    });
  }, [title, url, handleCopy]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="bh-btn-primary"
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
          Copy link
        </button>

        {canShare && (
          <button type="button" onClick={handleShare} className="bh-btn-secondary">
            <Share2 className="h-4 w-4" aria-hidden="true" />
            Share
          </button>
        )}
      </div>

      {showFallback && (
        <input
          ref={inputRef}
          readOnly
          value={url}
          aria-label="Photo link"
          onClick={(event) => event.currentTarget.select()}
          className="bh-input mt-3 font-mono text-sm"
        />
      )}

      <p
        role="status"
        aria-live="polite"
        className="mt-2 min-h-5 text-xs text-muted-foreground"
      >
        {status}
      </p>
    </div>
  );
}
