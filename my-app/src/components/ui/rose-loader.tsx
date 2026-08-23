"use client";

import { cn } from "@/lib/utils";

interface RoseSpinnerProps {
  size?: "lg" | "md" | "sm";
  className?: string;
  color?: string;
}

function SpinnerSvg({ size, color }: { size: number; color: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
      className="animate-[spin_1.5s_linear_infinite]"
    >
      <circle
        cx="50" cy="50" r="40"
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="210"
        strokeDashoffset="60"
        opacity="0.25"
      />
      <circle
        cx="50" cy="50" r="40"
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="60"
        strokeDashoffset="0"
        className="animate-[loader-dash_1.5s_ease-in-out_infinite]"
      />
    </svg>
  );
}

export function RoseSpinner({
  size = "md",
  className,
  color,
}: RoseSpinnerProps) {
  const strokeColor = color ?? "var(--color-bh-red-500, var(--color-bh-red-500))";
  const dim = size === "lg" ? 48 : size === "sm" ? 16 : 28;

  return (
    <span className={cn("inline-flex items-center justify-center", className)}>
      <SpinnerSvg size={dim} color={strokeColor} />
    </span>
  );
}
