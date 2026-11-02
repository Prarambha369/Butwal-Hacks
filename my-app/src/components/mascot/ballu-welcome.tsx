import * as React from "react";
import { cn } from "@/lib/utils";

/* ponytail: inline SVG so onboarding never waits on a mascot PNG and the card
   can animate the welcome illustration without an extra image request. */

export interface BalluWelcomeProps {
  /** Layout size in px; the viewBox is 384×384 and scales down crisply. */
  size?: number;
  /** Accessible label when the illustration carries meaning. */
  alt?: string;
  className?: string;
  float?: boolean;
  popOnHover?: boolean;
}

export function BalluWelcome({
  size = 120,
  alt = "",
  className,
  float = false,
  popOnHover = false,
}: BalluWelcomeProps) {
  const wrapperClass = cn(
    "pointer-events-none relative inline-block shrink-0 select-none",
    float && "animate-bh-float",
    popOnHover && "bh-wiggle-hover",
    className,
  );

  const svgAttrs = {
    xmlns: "http://www.w3.org/2000/svg" as const,
    viewBox: "0 0 384 384",
    width: size,
    height: size,
    "aria-hidden": alt === "" ? true : undefined,
    focusable: "false" as const,
    role: alt === "" ? undefined : "img" as const,
    ...(alt ? { title: alt } : { title: undefined }),
  } as const;

  return (
    <span
      className={wrapperClass}
      style={{ width: size, height: size }}
      aria-hidden={alt === "" ? true : undefined}
    >
      <svg {...svgAttrs}>
        <defs>
          <radialGradient id="bh-body-grad" cx="50%" cy="42%" r="62%">
            <stop offset="0%" stop-color="#FFFFFF" />
            <stop offset="28%" stop-color="#FE7C7C" />
            <stop offset="62%" stop-color="#FE0000" />
            <stop offset="100%" stop-color="#B10000" />
          </radialGradient>
          <radialGradient id="bh-mask-grad" cx="50%" cy="60%" r="70%">
            <stop offset="0%" stop-color="#2A2A2A" />
            <stop offset="100%" stop-color="#0D0D0D" />
          </radialGradient>
          <radialGradient id="bh-belly-grad" cx="50%" cy="52%" r="60%">
            <stop offset="0%" stop-color="#FFFFFF" />
            <stop offset="70%" stop-color="#F2F2F2" />
            <stop offset="100%" stop-color="#D7D7D7" />
          </radialGradient>
        </defs>

        <g fill="#1A1A1A">
          <path
            d="M158 74c-6 -8 -3 -18 5 -18c7 0 13 -4 13 -11c0 -4 4 -9 9 -10c11 -3 13 7 11 17c-3 14 -9 24 -21 18c-7 -4 -1 -17 4 -17z"
          />
          <path
            d="M226 74c6 -8 3 -18 -5 -18c-7 0 -13 -4 -13 -11c0 -4 -4 -9 -9 -10c-11 -3 -13 7 -11 17c3 14 9 24 21 18c7 -4 1 -17 -4 -17z"
          />
          <path
            d="M98 150c-9 -2 -22 -1 -34 -11c-12 -12 -20 -30 -18 -52c3 -22 17 -40 34 -42c17 -1 29 9 33 24c4 16 1 30 -7 41c-7 10 -14 20 -28 29z"
          />
          <path
            d="M286 150c9 -2 22 -1 34 -11c12 -12 20 -30 18 -52c-3 -22 -17 -40 -34 -42c-17 -1 -29 9 -33 24c-4 16 -1 30 7 41c7 10 14 20 28 29z"
          />
          <path
            d="M86 238c-13 -4 -23 -14 -22 -30c4 -28 22 -46 42 -47c18 -1 32 9 38 26c5 15 4 30 -2 43c-5 10 -7 18 -7 19 7 -11 12 -25 11 -39c-1 -17 -6 -30 11 -32z"
          />
          <path
            d="M298 238c13 -4 23 -14 22 -30c-4 -28 -22 -46 -42 -47c-18 -1 -32 9 -38 26c-5 15 -4 30 2 43c5 10 7 18 7 19 -7 -11 -12 -25 -11 -39c1 -17 6 -30 -11 -32z"
          />
        </g>

        <g>
          <g fill="url(#bh-body-grad)">
            <ellipse cx="192" cy="252" rx="116" ry="98" />
            <circle cx="192" cy="132" r="66" />
            <ellipse cx="192" cy="158" rx="38" ry="28" />
            <circle cx="142" cy="92" r="20" />
            <circle cx="242" cy="92" r="20" />
            <ellipse
              cx="126"
              cy="222"
              rx="26"
              ry="52"
              transform="rotate(-18 126 222)"
            />
            <ellipse
              cx="258"
              cy="214"
              rx="26"
              ry="52"
              transform="rotate(18 258 214)"
            />
            <ellipse cx="150" cy="320" rx="26" ry="32" />
            <ellipse cx="234" cy="320" rx="26" ry="32" />
            <path
              d="M192 62c-7 -8 2 -18 12 -16c11 2 17 9 16 18c-1 14 -8 19 -16 21c-8 2 -12 -1 -12 -23z"
            />
          </g>

          {/* Cheek blush */}
          <g fill="#7B0000" opacity="0.55">
            <path
              d="M150 92c-18 -3 -32 7 -31 25c2 -6 5 -11 10 -13c4 -1 13 1 19 2c4 -15 16 -25 32 -23c6 -3 1 -16 -10 -11z"
            />
            <path
              d="M234 92c18 -3 32 7 31 25c-2 -6 -5 -11 -10 -13c-4 -1 -13 1 -19 2c-4 -15 -16 -25 -32 -23c-6 -3 -1 -16 10 -11z"
            />
            <path
              d="M120 206c-2 -6 3 -12 11 -12c13 -1 22 -9 23 -21c2 -16 -5 -30 -14 -36c-21 -12 -40 -8 -45 5c-1 2 -1 5 -1 8c-1 5 0 11 3 16c-7 21 4 46 21 52z"
            />
            <path
              d="M264 206c2 -6 -3 -12 -11 -12c-13 -1 -22 -9 -23 -21c-2 -16 5 -30 14 -36c21 -12 40 -8 45 5c1 2 1 5 1 8c1 5 0 11 -3 16c7 21 -4 46 -21 52z"
            />
          </g>

          {/* Belly */}
          <ellipse cx="192" cy="258" rx="72" ry="52" fill="url(#bh-belly-grad)" />

          {/* Face mask */}
          <path
            d="M156 150c0 -14 16 -26 36 -26s36 12 36 26c0 12 -8 22 -20 28s-34 10 -42 0c-5 -6 -10 -10 -16 -10 -7 0 -14 4 -16 10z"
            fill="#2A2A2A"
          />
          <circle cx="192" cy="228" r="20" fill="#FFFFFF" opacity="0.92" />
          <circle cx="192" cy="228" r="15" fill="#FE0000" opacity="0.95" />

          {/* Eyes */}
          <circle cx="142" cy="88" r="20" fill="#2A2A2A" />
          <circle cx="142" cy="88" r="11" fill="#4A4A4A" />
          <circle cx="242" cy="88" r="20" fill="#2A2A2A" />
          <circle cx="242" cy="88" r="11" fill="#4A4A4A" />

          {/* Eye highlights */}
          <ellipse cx="168" cy="124" rx="9" ry="8" fill="#1A1A1A" />
          <ellipse cx="216" cy="124" rx="9" ry="8" fill="#1A1A1A" />
          <circle cx="168" cy="125" r="5.5" fill="#FFFFFF" />
          <circle cx="216" cy="125" r="5.5" fill="#FFFFFF" />
          <circle cx="169" cy="126" r="3" fill="#1A1A1A" />
          <circle cx="217" cy="126" r="3" fill="#1A1A1A" />
          <circle cx="167.5" cy="124" r="1.1" fill="#FFFFFF" />
          <circle cx="215.5" cy="124" r="1.1" fill="#FFFFFF" />

          {/* Eyebrows */}
          <path
            d="M158 117c3 -3 11 -3 14 0c2 -4 8 -5 11 -2c-2 -5 -11 -4 -17 1c-3 -6 -14 -4 -14 1z"
            fill="#2A2A2A"
          />
          <path
            d="M226 117c-3 -3 -11 -3 -14 0c-2 -4 -8 -5 -11 -2c2 -5 11 -4 17 1c3 -6 14 -4 14 1z"
            fill="#2A2A2A"
          />

          {/* Nose */}
          <ellipse cx="192" cy="146" rx="7" ry="5" fill="#1A1A1A" />
          <ellipse cx="190" cy="144" rx="2" ry="1.2" fill="#FFFFFF" opacity="0.55" />

          {/* Mouth */}
          <path
            d="M180 162c2 3 6 4 12 4s10 -1 12 -4"
            fill="none"
            stroke="#1A1A1A"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M180 162c2 5 6 7 12 7s10 -2 12 -4"
            fill="none"
            stroke="#2A2A2A"
            strokeWidth="1"
            opacity="0.45"
          />

          {/* Forehead blush */}
          <ellipse cx="150" cy="142" rx="9" ry="5" fill="#FFB3B3" opacity="0.5" />
          <ellipse cx="234" cy="142" rx="9" ry="5" fill="#FFB3B3" opacity="0.5" />
        </g>

        {/* Right arm */}
        <g>
          <ellipse
            cx="258"
            cy="214"
            rx="26"
            ry="52"
            transform="rotate(18 258 214)"
            fill="url(#bh-body-grad)"
          />
          <path
            d="M282 184c14 -10 28 -6 38 4c2 1 4 1 5 0c9 -9 18 -14 27 -14c7 -1 9 -7 5 -12c-3 -5 -12 -8 -22 -7c-10 1 -19 6 -22 15c-1 4 -5 6 -9 4c-4 2 -8 4 -12 2c-2 6 -8 11 -16 13z"
            fill="url(#bh-body-grad)"
          />
          <g transform="translate(326 176)">
            <circle cx="0" cy="0" r="17" fill="url(#bh-body-grad)" />
            <ellipse cx="0" cy="6" rx="9" ry="6" fill="#2A2A2A" opacity="0.7" />
            <circle cx="-8" cy="-4" r="4" fill="#FFFFFF" opacity="0.85" />
            <circle cx="-1" cy="-7" r="4" fill="#FFFFFF" opacity="0.85" />
            <circle cx="6" cy="-5" r="4" fill="#FFFFFF" opacity="0.85" />
            <circle cx="-8" cy="-9" r="1.2" fill="#1A1A1A" />
            <circle cx="-1" cy="-12" r="1.2" fill="#1A1A1A" />
            <circle cx="6" cy="-10" r="1.2" fill="#1A1A1A" />
          </g>
          <path
            d="M250 168c-2 -8 3 -14 11 -14c7 0 13 4 14 11c1 5 -1 10 -5 11c-5 1 -9 1 -12 -2c-1 -4 -1 -7 2 -8z"
            fill="#2A2A2A"
          />
        </g>

        {/* Left arm */}
        <g>
          <ellipse
            cx="126"
            cy="222"
            rx="26"
            ry="52"
            transform="rotate(-18 126 222)"
            fill="url(#bh-body-grad)"
          />
          <g transform="translate(102 252)">
            <circle cx="0" cy="0" r="12" fill="#FFFFFF" opacity="0.9" />
            <path
              d="M0 -8c2 -2 6 -2 8 0c2 -2 6 -2 8 0c4 4 4 10 0 14c-4 4 -10 4 -14 0c-4 -4 -4 -10 0 -14z"
              fill="#FFB3B3"
            />
            <path
              d="M0 -4c1 -1 3 -1 4 0c1 -1 3 -1 4 0c2 2 2 5 0 7c-2 2 -5 2 -6 0c-1 -2 -1 -5 0 -7z"
              fill="#FFFFFF"
            />
            <circle cx="0" cy="2" r="9" fill="url(#bh-body-grad)" />
          </g>
          <path
            d="M134 168c2 -8 -3 -14 -11 -14c-7 0 -13 4 -14 11c-1 5 1 10 5 11c5 1 9 1 12 -2c1 -4 1 -7 -2 -8z"
            fill="#2A2A2A"
          />
        </g>

        {/* Feet */}
        <g>
          <ellipse cx="150" cy="320" rx="26" ry="32" fill="url(#bh-body-grad)" />
          <ellipse cx="234" cy="320" rx="26" ry="32" fill="url(#bh-body-grad)" />
          <ellipse cx="150" cy="348" rx="12" ry="6" fill="#2A2A2A" opacity="0.65" />
          <ellipse cx="234" cy="348" rx="12" ry="6" fill="#2A2A2A" opacity="0.65" />
          <circle cx="144" cy="352" r="1.2" fill="#1A1A1A" />
          <circle cx="150" cy="353" r="1.2" fill="#1A1A1A" />
          <circle cx="156" cy="352" r="1.2" fill="#1A1A1A" />
          <circle cx="228" cy="352" r="1.2" fill="#1A1A1A" />
          <circle cx="234" cy="353" r="1.2" fill="#1A1A1A" />
          <circle cx="240" cy="352" r="1.2" fill="#1A1A1A" />
        </g>

        {/* Ground shadow */}
        <ellipse cx="192" cy="360" rx="120" ry="10" fill="#000000" opacity="0.12" />
      </svg>
    </span>
  );
}
