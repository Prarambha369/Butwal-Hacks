import * as React from "react";
import { cn } from "@/lib/utils";

/* ponytail: inline SVG so the celebration burst never triggers a network
   request and can be animated inside the welcome card without a sprite sheet. */

export interface BalluCelebrationProps {
  size?: number;
  alt?: string;
  className?: string;
  float?: boolean;
  popOnHover?: boolean;
}

export function BalluCelebration({
  size = 100,
  alt = "",
  className,
  float = false,
  popOnHover = false,
}: BalluCelebrationProps) {
  const wrapperClass = cn(
    "pointer-events-none relative inline-block shrink-0 select-none",
    float && "animate-bh-float",
    popOnHover && "bh-wiggle-hover",
    className,
  );

  return (
    <span
      className={wrapperClass}
      style={{ width: size, height: size }}
      aria-hidden={alt === "" ? true : undefined}
      title={alt}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 224 224"
        width={size}
        height={size}
        aria-hidden={alt === "" ? true : undefined}
        focusable="false"
        role={alt === "" ? undefined : "img"}
      >
        <defs>
          <radialGradient id="bh-c-celebration-grad" cx="50%" cy="40%" r="66%">
            <stop offset="0%" stop-color="#FFFFFF" />
            <stop offset="24%" stop-color="#FE7C7C" />
            <stop offset="62%" stop-color="#FE0000" />
            <stop offset="100%" stop-color="#B10000" />
          </radialGradient>
          <radialGradient id="bh-c-belly-grad" cx="50%" cy="52%" r="60%">
            <stop offset="0%" stop-color="#FFFFFF" />
            <stop offset="70%" stop-color="#F2F2F2" />
            <stop offset="100%" stop-color="#D7D7D7" />
          </radialGradient>
        </defs>

        <g fill="#1A1A1A">
          <path d="M28 30c-4 -5 -2 -11 3 -11c5 0 10 -3 10 -7c0 -3 3 -6 6 -7c7 -2 9 5 7 11c-2 9 -6 15 -14 12c-5 -2 -1 -10 2 -11z" />
          <path d="M72 30c4 -5 2 -11 -3 -11c-5 0 -10 -3 -10 -7c0 -3 -3 -6 -6 -7c-7 -2 -9 5 -7 11c2 9 6 15 14 12c5 -2 1 -10 -2 -11z" />
          <path d="M44 59c6 -1 15 -1 24 -7c7 -6 11 -18 10 -31c2 -11 9 -23 19 -24c9 -1 15 5 18 13c2 9 1 16 -2 23c4 5 7 9 14 13z" />
          <path d="M99 59c-6 -1 -15 -1 -24 -7c-7 -6 -11 -18 -10 -31c-2 -11 -9 -23 -19 -24c-9 -1 -15 5 -18 13c-2 9 -1 16 2 23c-4 5 -7 9 -14 13z" />
          <path d="M50 103c8 -3 14 -8 14 -17c0 -15 10 -24 23 -25c10 0 18 6 20 15c1 9 0 17 -2 24c3 4 4 8 4 10 5 -5 8 -14 7 -27c-1 -10 -4 -18 7 -20z" />
          <path d="M114 103c-8 -3 -14 -8 -14 -17c0 -15 -10 -24 -23 -25c-10 0 -18 6 -20 15c-1 9 0 17 2 24c3 4 4 8 4 10 -5 -5 -8 -14 -7 -27c1 -10 4 -18 -7 -20z" />
        </g>

        <g>
          <g fill="url(#bh-c-celebration-grad)">
            <ellipse cx="64" cy="114" rx="68" ry="57" />
            <circle cx="64" cy="58" r="38" />
            <ellipse cx="64" cy="72" rx="22" ry="16" />
            <circle cx="46" cy="40" r="12" />
            <circle cx="82" cy="40" r="12" />
            <ellipse cx="44" cy="96" rx="14" ry="29" transform="rotate(-18 44 96)" />
            <ellipse cx="84" cy="92" rx="14" ry="29" transform="rotate(18 84 92)" />
            <ellipse cx="52" cy="140" rx="15" ry="18" />
            <ellipse cx="76" cy="140" rx="15" ry="18" />
            <path d="M64 31c-4 -5 2 -10 7 -9c7 1 10 5 9 11c0 9 -5 11 -9 12c-5 1 -8 0 -7 -2z" />
          </g>

          <ellipse cx="64" cy="117" rx="41" ry="29" fill="url(#bh-c-belly-grad)" />
          <circle cx="64" cy="102" r="11" fill="#FFFFFF" opacity="0.92" />
          <circle cx="64" cy="102" r="8" fill="#FE0000" opacity="0.95" />

          <circle cx="46" cy="42" r="12" fill="#2A2A2A" />
          <circle cx="46" cy="42" r="6.5" fill="#4A4A4A" />
          <circle cx="82" cy="42" r="12" fill="#2A2A2A" />
          <circle cx="82" cy="42" r="6.5" fill="#4A4A4A" />

          <ellipse cx="54" cy="54" rx="5" ry="4" fill="#1A1A1A" />
          <ellipse cx="74" cy="54" rx="5" ry="4" fill="#1A1A1A" />
          <circle cx="54" cy="55" r="3" fill="#FFFFFF" />
          <circle cx="74" cy="55" r="3" fill="#FFFFFF" />
          <circle cx="55" cy="56" r="1.6" fill="#1A1A1A" />
          <circle cx="75" cy="56" r="1.6" fill="#1A1A1A" />
          <circle cx="53.5" cy="54" r="0.6" fill="#FFFFFF" />
          <circle cx="73.5" cy="54" r="0.6" fill="#FFFFFF" />

          <ellipse cx="64" cy="63" rx="4" ry="3" fill="#1A1A1A" />
          <ellipse cx="63" cy="62" rx="1.2" ry="0.8" fill="#FFFFFF" opacity="0.5" />

          <ellipse cx="48" cy="58" rx="5" ry="2.5" fill="#FFB3B3" opacity="0.5" />
          <ellipse cx="80" cy="58" rx="5" ry="2.5" fill="#FFB3B3" opacity="0.5" />

          <g fill="#FF8A8A">
            <circle cx="64" cy="22" r="3.5" />
            <circle cx="64" cy="16" r="2" />
            <path
              d="M50 32c-1.5 -3 1 -5 4 -4c3 1 5 4 4 7c-1 3 -5 4 -8 3c-3 1 -5 0 -6 -2c-1 -3 -1 -6 2 -8z"
              fill="#FF8A8A"
            />
            <path
              d="M78 32c1.5 -3 -1 -5 -4 -4c-3 1 -5 4 -4 7c1 3 5 4 8 3c3 1 5 0 6 -2c1 -3 1 -6 -2 -8z"
              fill="#FF8A8A"
            />
          </g>
          <circle cx="64" cy="126" r="24" fill="#000000" opacity="0.1" />
        </g>
      </svg>
    </span>
  );
}
