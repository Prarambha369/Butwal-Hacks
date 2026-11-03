"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** All event child routes, in page order. The first tab is the event page itself. */
const TABS = [
  { suffix: "", label: "Overview" },
  { suffix: "/attendees", label: "Attendees" },
  { suffix: "/teams", label: "Teams" },
  { suffix: "/analytics", label: "Analytics" },
  { suffix: "/certificates", label: "Certificates" },
  { suffix: "/photos", label: "Photos" },
  { suffix: "/qr", label: "QR Codes" },
  { suffix: "/scan", label: "Scan" },
] as const;

/**
 * EventTabs — one tab strip for the event children, replacing the per-page
 * back links and the button row on the event page. Real URLs with
 * `aria-current` for the active tab; active state follows the pathname so no
 * per-page wiring is needed.
 */
export function EventTabs({ eventId }: { eventId: string }) {
  const pathname = usePathname();
  const base = `/dashboard/organizer/events/${eventId}`;

  return (
    <nav
      aria-label="Event sections"
      className="flex gap-1 overflow-x-auto border-b border-border"
    >
      {TABS.map(({ suffix, label }) => {
        const href = `${base}${suffix}`;
        const active =
          suffix === "" ? pathname === base : (pathname ?? "").startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-bh-red-action text-primary"
                : "border-transparent text-muted-foreground hover:text-primary",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
