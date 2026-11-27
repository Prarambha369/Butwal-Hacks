import Link from "next/link";
import { Wrench } from "lucide-react";
import { APP_MAINTENANCE, MAINTENANCE_PATH, isAppMaintenance } from "@/lib/app-maintenance";

/**
 * Site-wide notice while the app is under maintenance (lib/app-maintenance.ts).
 * Renders only in the static marketing export; null everywhere else, and
 * null once APP_MAINTENANCE is set back to null.
 */
export default function AppMaintenanceBanner() {
  if (!isAppMaintenance() || !APP_MAINTENANCE) return null;
  return (
    <div role="region" aria-label="Service notice" className="border-b border-border bg-surface text-primary">
      <p className="mx-auto flex max-w-6xl items-start justify-center gap-2 px-4 py-2.5 text-center text-sm leading-relaxed">
        <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-bh-red-action" aria-hidden="true" />
        <span>
          Sign-in, dashboards and event registration are under maintenance and back by{" "}
          {APP_MAINTENANCE.backBy}. Everything else on this site works as usual.{" "}
          <Link href={MAINTENANCE_PATH} className="font-semibold underline underline-offset-2">
            Details
          </Link>
        </span>
      </p>
    </div>
  );
}
