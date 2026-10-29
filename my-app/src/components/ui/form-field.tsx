"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * FormField — label, control, and error wiring for a single field, wired
 * correctly once instead of ad hoc per form:
 *
 * - the label points at the control via `htmlFor`/`id`
 * - `aria-invalid` is set while the error string is non-empty
 * - `aria-describedby` points at the error id (and hint id) so screen
 *   readers read the failure with the field it belongs to
 * - the error renders with `role="alert"` and stays visible until the
 *   caller clears it (callers clear when the field is valid again, not
 *   merely when the user starts typing)
 *
 * Usage — spread the render-prop object onto the control:
 *
 *   <FormField label="Title" error={errors.title}>
 *     {({ id, "aria-describedby": describedBy, "aria-invalid": invalid }) => (
 *       <input id={id} aria-describedby={describedBy} aria-invalid={invalid} ... />
 *     )}
 *   </FormField>
 */

/** Props a FormField hands its control. Spread them onto the input. */
export interface FormFieldControlProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid": boolean;
}

/** Focus the first field flagged `aria-invalid` inside `container`. */
export function focusFirstInvalidField(
  container: HTMLElement | null,
): boolean {
  if (!container) return false;
  const first = container.querySelector<HTMLElement>('[aria-invalid="true"]');
  if (!first) return false;
  first.focus();
  return true;
}

interface FormFieldProps {
  label: React.ReactNode;
  /**
   * Render-prop: receives the a11y wiring to spread onto the control.
   * Works for input, textarea, select, or any custom control.
   */
  children: (control: FormFieldControlProps) => React.ReactNode;
  /**
   * Field-level error. Keep it set until the field is valid again — not
   * merely until the user starts typing — so the failure message and the
   * `aria-invalid` flag do not flicker away while the field is still wrong.
   */
  error?: string | null;
  /** Static helper copy, shown when the field is not in error. */
  hint?: React.ReactNode;
  /** Renders the required asterisk after the label. */
  required?: boolean;
  /** Always-present node after the error slot (e.g. a character counter). */
  extra?: React.ReactNode;
  id?: string;
  className?: string;
  labelClassName?: string;
  errorClassName?: string;
  hintClassName?: string;
}

export function FormField({
  label,
  children,
  error,
  hint,
  required,
  extra,
  id,
  className,
  labelClassName,
  errorClassName,
  hintClassName,
}: FormFieldProps): React.ReactElement {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const errorId = `${controlId}-error`;
  const hintId = `${controlId}-hint`;
  const hasError = typeof error === "string" && error.trim().length > 0;

  const describedBy = [
    hint && !hasError ? hintId : null,
    hasError ? errorId : null,
  ]
    .filter((value): value is string => value !== null)
    .join(" ") || undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={controlId}
        className={cn(
          "text-xs font-bold uppercase tracking-wider text-secondary",
          labelClassName,
        )}
      >
        {label}
        {required && <span className="text-primary-red">*</span>}
      </label>
      {children({
        id: controlId,
        "aria-describedby": describedBy,
        "aria-invalid": hasError,
      })}
      {hasError ? (
        <p
          id={errorId}
          role="alert"
          className={cn("text-xs text-status-red", errorClassName)}
        >
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className={cn("text-xs text-muted-foreground", hintClassName)}>
          {hint}
        </p>
      ) : null}
      {extra}
    </div>
  );
}
