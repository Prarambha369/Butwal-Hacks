"use client";

import { cn } from "@/lib/utils";

/**
 * AsyncStatus — the shared async-operation feedback pattern.
 *
 * Codified from what certificates/template-editor.tsx already got right:
 *
 * - The pending state is conveyed with `aria-busy` on the pending
 *   control/container (use `ariaBusy()` for the plain boolean).
 * - ONE `role="status"` region for success and ONE `role="alert"` region
 *   for failure. Both are rendered from first paint with their text
 *   swapped in later: a live region inserted into the DOM together with
 *   its content is not announced by screen readers. `empty:hidden` keeps
 *   the always-present regions out of the layout while they are empty.
 *
 * The component renders two adjacent regions, so place it where inline
 * status text would go (next to a submit button, under a heading).
 */

export type AsyncState = "idle" | "pending" | "success" | "error";

/** The boolean for `aria-busy` on the control that is doing the work. */
export function ariaBusy(state: AsyncState): boolean {
  return state === "pending";
}

/** Narrow an `AsyncState` (or a derived ternary) to "is it working right now". */
export function isPending(state: AsyncState): boolean {
  return state === "pending";
}

interface AsyncStatusProps {
  state: AsyncState;
  /** Success copy. Preferrably a "what happens next" line, not just "Saved". */
  success?: React.ReactNode;
  /** Failure copy — one actionable sentence, no stack traces. */
  error?: React.ReactNode;
  /** Classes for the success region; ride over the default text styles. */
  successClassName?: string;
  /** Classes for the error region; ride over the default text styles. */
  errorClassName?: string;
}

export function AsyncStatus({
  state,
  success,
  error,
  successClassName,
  errorClassName,
}: AsyncStatusProps): React.ReactElement {
  return (
    <>
      {/* Rendered from first paint, with the text swapped. A live region
          inserted together with its content is not announced. */}
      <span
        role="status"
        aria-live="polite"
        className={cn("empty:hidden text-sm text-status-green", successClassName)}
      >
        {state === "success" && success != null ? success : null}
      </span>
      <span
        role="alert"
        className={cn("empty:hidden text-sm text-status-red", errorClassName)}
      >
        {state === "error" && error != null ? error : null}
      </span>
    </>
  );
}
