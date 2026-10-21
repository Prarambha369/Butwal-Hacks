import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Mr. Ballu — the Butwal Hacks mascot.
 *
 * Mr. Ballu is a sloth bear, the shaggy black bear rare in the forests around
 * Butwal, rendered in brand red with the "bh" chest badge. He ships as
 * transparent 384×384 PNGs in `/public/mascot/`. Every pose is available
 * through the `emotion` prop so a surface can express state (thinking, error,
 * success) instead of always showing the same face.
 *
 * Usage:
 *   <Ballu />                          // decorative, calm, 64px
 *   <Ballu emotion="think-loading" size={48} />
 *   <Ballu emotion="welcome" alt="Mr. Ballu waving hello" />
 *
 * Accessibility: decorative by default (`alt=""`, `aria-hidden`). Pass a real
 * `alt` only when the mascot carries meaning the surrounding copy does not.
 */

/** The ten shipped poses, named after the state they express. */
export type BalluEmotion =
  | "calm-neutral"
  | "happy-excited"
  | "thinking-puzzled"
  | "confused-frustrated"
  | "celebrating-proud"
  | "welcome"
  | "explain"
  | "think-loading"
  | "error-calm"
  | "success"
  /** Mr. Ballu waving the "bh" flag — brand/rally moments. */
  | "flag";

/** Source map — one entry per file in `/public/mascot/`. */
export const BALLU_POSES: Record<BalluEmotion, string> = {
  "calm-neutral": "/mascot/calm-neutral-v2.png",
  "happy-excited": "/mascot/happy-excited-v2.png",
  "thinking-puzzled": "/mascot/thinking-puzzled-v2.png",
  "confused-frustrated": "/mascot/confused-frustrated-v2.png",
  "celebrating-proud": "/mascot/celebrating-proud-v2.png",
  welcome: "/mascot/welcome-v2.png",
  explain: "/mascot/explain-v2.png",
  "think-loading": "/mascot/think-loading-v2.png",
  "error-calm": "/mascot/error-calm-v2.png",
  success: "/mascot/success-v2.png",
  flag: "/mascot/flag-v2.png",
};

export interface BalluProps {
  /** Which pose to show. Defaults to `calm-neutral`. */
  emotion?: BalluEmotion;
  /** Rendered size in px (square). The source is 384×384 so it stays crisp. */
  size?: number;
  /** Accessible alt text. Empty string (decorative) by default. */
  alt?: string;
  /** Eager-load for above-the-fold placements (hero, FAB). */
  priority?: boolean;
  /**
   * Gently bob the mascot. Respects `prefers-reduced-motion` via the
   * `animate-bh-float` utility in globals.css.
   */
  float?: boolean;
  /** Hover pop for interactive placements (buttons, FABs). */
  popOnHover?: boolean;
  className?: string;
}

const SIZE_PRESETS = {
  xs: 20,
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
} as const;

export function Ballu({
  emotion = "calm-neutral",
  size = 64,
  alt = "",
  priority = false,
  float = false,
  popOnHover = false,
  className,
}: BalluProps) {
  return (
    <span
      // The wrapper is a layout box only — it carries the fixed pixel size so
      // next/image has explicit dimensions (CLS guard) and inherits hover/float
      // behaviour without touching the image element itself.
      className={cn(
        "pointer-events-none relative inline-block shrink-0 select-none",
        float && "animate-bh-float",
        popOnHover && "bh-wiggle-hover",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden={alt === "" ? true : undefined}
    >
      <Image
        src={BALLU_POSES[emotion]}
        alt={alt}
        width={size}
        height={size}
        priority={priority}
        draggable={false}
        sizes={`${size}px`}
        className="h-full w-full object-contain"
      />
    </span>
  );
}

export { SIZE_PRESETS as BALLU_SIZE_PRESETS };
