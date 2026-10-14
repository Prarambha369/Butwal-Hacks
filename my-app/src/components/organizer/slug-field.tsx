"use client";

import { useMemo } from "react";
import { Link2 } from "lucide-react";
import { slugify } from "@/lib/slug";
import { SITE_URL } from "@/lib/constants";

/**
 * Slug input with a live URL preview.
 *
 * The preview is the point. A slug is a URL segment, and the only way an
 * organizer can judge one is by seeing the address it produces -- "Butwal
 * Winter Hack 2026" becoming `butwal-winter-hack-2026` is obvious as a
 * rendered URL and invisible as a slug rule.
 *
 * `value` is always stored already slugified. Letting the organizer type a
 * capital letter or a space and only sanitising on submit produces a stored
 * value that never matched what the preview showed.
 */
export function SlugField({
  value,
  onChange,
  fallbackTitle,
  label = "URL slug",
  hint,
}: {
  value: string;
  onChange: (next: string) => void;
  /** Used for the preview until the organizer types their own slug. */
  fallbackTitle: string;
  label?: string;
  hint?: string;
}) {
  const preview = useMemo(() => {
    const chosen = slugify(value) || slugify(fallbackTitle);
    return chosen ? `${SITE_URL}/events/${chosen}` : null;
  }, [value, fallbackTitle]);

  // Nothing slug-safe anywhere: neither the typed slug nor the title.
  const unusable = !preview;

  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
        <Link2 className="w-4 h-4" /> {label}
      </label>

      <input
        className="w-full px-4 py-3 rounded-lg bg-surface-hover border border-border focus:border-bh-red-500 outline-none transition-all font-mono text-sm"
        value={value}
        placeholder={slugify(fallbackTitle) || "daydream-butwal"}
        onChange={(e) => onChange(slugify(e.target.value))}
        aria-describedby="slug-field-hint"
      />

      {unusable ? (
        <p id="slug-field-hint" className="text-xs text-primary-red">
          This title has no characters usable in a URL. Add a word or a year.
        </p>
      ) : (
        <p id="slug-field-hint" className="text-xs text-muted-foreground break-all">
          <span className="opacity-60">Public URL:</span>{" "}
          <span className="font-mono text-foreground">{preview}</span>
        </p>
      )}

      {!unusable && !value && (
        <p className="text-xs text-muted-foreground">
          Leave blank to derive it from the title. Letters become lowercase, spaces
          become hyphens, and a duplicate gets <span className="font-mono">-2</span>.
        </p>
      )}

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}