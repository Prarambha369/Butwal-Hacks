"use client"

import { useEffect, useId, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export interface ConfirmDialogProps {
  /** Dialog heading, phrased as the question the dialog answers ("Delete this chapter?"). */
  title: string
  /** The thing being acted on, surfaced as its own line in the body. */
  entityName?: string
  /**
   * What confirming actually does. Must name what is destroyed or changed
   * ("The chapter is permanently deleted; ..."), never just "Are you sure?".
   */
  consequence: string
  /**
   * Confirm copy that names the action and the entity ("Delete chapter").
   * Never "Yes", "OK", or "Confirm" — the button must be readable with no
   * surrounding context (WCAG 2.5.3 / mobile screen readers).
   */
  confirmLabel: string
  /**
   * True when the action cannot be recovered: the confirm button renders as
   * the red-action fill (--bh-red-action, hover --bh-deep-red). Anything
   * recoverable renders as the neutral ink button (--bh-action-ink). See
   * DESIGN.md — red stays reserved for irreversible actions.
   */
  irreversible?: boolean
  cancelLabel?: string
  /** Runs when the confirm button is activated. Errors belong to the caller. */
  onConfirm: () => void | Promise<unknown>
  /** Called when the dialog closes through any path: confirm resolved, Cancel, Escape key. */
  onClose: () => void
}

/**
 * Accessible replacement for native browser confirmation popups on
 * destructive actions.
 *
 * Uses the native `<dialog>` element, so Esc closes it natively and it works
 * even without JS event plumbing for focus/stacking. Focus is restored to the
 * element that was focused when the dialog opened (the trigger) after close —
 * the browser does this for showModal in most engines, but it is enforced here
 * as well so no path leaves focus on a detached node.
 *
 * Mount conditionally at the call site:
 *
 * ```tsx
 * {pending && (
 *   <ConfirmDialog
 *     title="Delete this chapter?"
 *     entityName={name}
 *     consequence="The chapter is permanently deleted."
 *     confirmLabel="Delete chapter"
 *     irreversible
 *     onConfirm={() => remove(id)}
 *     onClose={() => setPending(null)}
 *   />
 * )}
 * ```
 */
export function ConfirmDialog({
  title,
  entityName,
  consequence,
  confirmLabel,
  irreversible = false,
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  // Latest-value ref so the unmounting close listener never sees a stale prop.
  const onCloseRef = useRef(onClose)
  const [busy, setBusy] = useState(false)
  const titleId = useId()
  const consequenceId = useId()

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    triggerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    const dialog = dialogRef.current
    if (!dialog) return

    const handleClosed = () => {
      const trigger = triggerRef.current
      if (trigger && trigger.isConnected) trigger.focus()
      onCloseRef.current()
    }

    if (!dialog.open) dialog.showModal()
    dialog.addEventListener("close", handleClosed)
    return () => {
      dialog.removeEventListener("close", handleClosed)
      // Fallback for unmounts that bypass the close event (parent removes the
      // dialog while the underlying element disappears). Only steal focus if
      // it is currently sitting somewhere detached from the document.
      if (!document.activeElement || !document.activeElement.isConnected) {
        const trigger = triggerRef.current
        if (trigger && trigger.isConnected) trigger.focus()
      }
    }
  }, [])

  const close = () => dialogRef.current?.close()

  const handleConfirm = async () => {
    if (busy) return
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
      close()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={consequenceId}
      className="backdrop:bg-black/40 m-auto w-[min(26rem,calc(100vw-2rem))] rounded-xl border border-border bg-surface p-6 shadow-lg"
    >
      <h2 id={titleId} className="text-base font-bold text-primary">
        {title}
      </h2>
      {entityName ? (
        <p className="mt-3 break-words text-sm font-semibold text-primary">{entityName}</p>
      ) : null}
      <p
        id={consequenceId}
        className={cn(
          "text-sm leading-relaxed text-muted-foreground",
          entityName ? "mt-1" : "mt-3",
        )}
      >
        {consequence}
      </p>
      <div className="mt-6 flex justify-end gap-2">
        {/* Cancel first: showModal focuses the first focusable element, so the
            safe action gets initial focus on a destructive dialog. */}
        <button
          type="button"
          onClick={close}
          disabled={busy}
          className="bh-btn-ghost text-sm"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={busy}
          className={cn(irreversible ? "bh-btn-primary" : "bh-btn-ink", "text-sm")}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
