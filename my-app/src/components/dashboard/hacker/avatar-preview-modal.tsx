"use client"

import { useEffect, useState } from "react"
import { X, ExternalLink } from "lucide-react"
import Image from "next/image"
import { getAvatarUrl } from "@/lib/utils"

interface AvatarPreviewModalProps {
  avatarUrl: string | null | undefined
  seed: string | null | undefined
  fullName: string | null | undefined
  onClose: () => void
}

export default function AvatarPreviewModal({
  avatarUrl,
  seed,
  fullName,
  onClose,
}: AvatarPreviewModalProps) {
  const [imgSrc] = useState(getAvatarUrl(avatarUrl, seed))

  // Lock body scroll & handle Escape
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = prev
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${fullName || "Avatar"} preview`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/60 hover:text-white transition-colors p-2"
          aria-label="Close preview"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Avatar image */}
        <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden ring-4 ring-white/20 shadow-2xl bg-white/5">
          {imgSrc.includes("dicebear") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgSrc}
              alt={`${fullName || "User"}\u2019s avatar`}
              className="w-full h-full object-cover"
            />
          ) : (
            <Image
              src={imgSrc}
              alt={`${fullName || "User"}\u2019s avatar`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 256px, 320px"
            />
          )}
        </div>

        {/* Label */}
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-white">{fullName || "User"}</p>
          {avatarUrl && (
            <a
              href={avatarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-white/50 hover:text-white/80 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Open original
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
