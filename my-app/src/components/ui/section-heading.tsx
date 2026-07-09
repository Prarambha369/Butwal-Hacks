import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HeadingVariant = "accent" | "icon" | "badge" | "dot" | "plain";

type HeadingColor = "red" | "green" | "yellow" | "blue" | "orange";

interface SectionHeadingProps {
  /** Visual treatment for the heading */
  variant: HeadingVariant;
  /** Heading text */
  children: ReactNode;
  /** Icon component (required for icon variant) */
  icon?: ReactNode;
  /** Badge text (required for badge variant) */
  badge?: string;
  /** Accent color — defaults to red */
  color?: HeadingColor;
  /** Whether the dot pulses (dot variant only) */
  animate?: boolean;
  /** Optional className override */
  className?: string;
  /** Heading level override (default: h3) */
  as?: "h2" | "h3" | "h4";
}

const colorMap: Record<HeadingColor, { accent: string; bg: string; text: string; dot: string }> = {
  red: {
    accent: "bg-bh-red-500",
    bg: "bg-primary-red/10",
    text: "text-primary-red",
    dot: "bg-bh-red-500",
  },
  green: {
    accent: "bg-status-green",
    bg: "bg-status-green/10",
    text: "text-status-green",
    dot: "bg-status-green",
  },
  yellow: {
    accent: "bg-status-yellow",
    bg: "bg-status-yellow/10",
    text: "text-status-yellow",
    dot: "bg-status-yellow",
  },
  blue: {
    accent: "bg-status-blue",
    bg: "bg-status-blue/10",
    text: "text-status-blue",
    dot: "bg-status-blue",
  },
  orange: {
    accent: "bg-status-orange",
    bg: "bg-status-orange/10",
    text: "text-status-orange",
    dot: "bg-status-orange",
  },
};

const headingStyles = {
  h2: "text-lg font-bold text-primary",
  h3: "text-base font-bold text-primary",
  h4: "text-sm font-bold text-primary",
};

function HeadingTag({
  as: Tag = "h3",
  children,
  className,
}: {
  as?: "h2" | "h3" | "h4";
  children: ReactNode;
  className?: string;
}) {
  return <Tag className={cn(headingStyles[Tag], className)}>{children}</Tag>;
}

/**
 * SectionHeading — reusable section header with visual variety.
 *
 * Variants:
 *   accent — thin colored vertical bar on the left
 *   icon   — icon inside a small badge container
 *   badge  — small colored pill label + heading
 *   dot    — colored circle that can pulse
 *   plain  — just the heading text, no decoration
 *
 * Examples:
 *   <SectionHeading variant="accent">Your Chapters</SectionHeading>
 *   <SectionHeading variant="icon" icon={<LayoutDashboard size={14} />}>
 *     Recent Activity
 *   </SectionHeading>
 *   <SectionHeading variant="badge" badge="Milestones">Next Up</SectionHeading>
 *   <SectionHeading variant="dot" color="green" animate>
 *     Live Community Activity
 *   </SectionHeading>
 *   <SectionHeading variant="plain">Quick Links</SectionHeading>
 */
export function SectionHeading({
  variant,
  children,
  icon,
  badge,
  color = "red",
  animate = false,
  className,
  as = "h3",
}: SectionHeadingProps) {
  const colors = colorMap[color];

  switch (variant) {
    case "accent":
      return (
        <div className={cn("flex items-center gap-3", className)}>
          <div className={cn("w-1 h-6 rounded-full shrink-0", colors.accent)} />
          <HeadingTag as={as}>{children}</HeadingTag>
        </div>
      );

    case "icon":
      return (
        <div className={cn("flex items-center gap-2.5", className)}>
          <div className={cn("p-1.5 rounded-md", colors.bg, colors.text)}>
            {icon}
          </div>
          <HeadingTag as={as}>{children}</HeadingTag>
        </div>
      );

    case "badge":
      return (
        <div className={cn("flex items-center gap-2.5", className)}>
          {badge && (
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0",
                colors.bg,
                colors.text,
              )}
            >
              {badge}
            </span>
          )}
          <HeadingTag as={as}>{children}</HeadingTag>
        </div>
      );

    case "dot":
      return (
        <div className={cn("flex items-center gap-2", className)}>
          <div
            className={cn(
              "w-2 h-2 rounded-full shrink-0",
              colors.dot,
              animate && "animate-pulse",
            )}
          />
          <HeadingTag as={as}>{children}</HeadingTag>
        </div>
      );

    case "plain":
      return (
        <HeadingTag as={as} className={className}>
          {children}
        </HeadingTag>
      );
  }
}
