import Link from "next/link";
import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { createServiceClient } from "@/utils/supabase";
import { roleRedirect } from "@/lib/role-gate";
import { runDiagnostics, type DiagnosticResult } from "@/lib/system-diagnostics";
import {
  PageHeader,
  SectionCard,
} from "@/components/dashboard/shell/page-header";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

/**
 * Maintainer system check — "is every part of this actually working?"
 *
 * Answers the question the header badge cannot. The badge only reports five
 * services and only has a couple of seconds to do it; this page probes every
 * external integration, confirms the configuration contract, and surfaces row
 * counts and integrity problems that present as an empty page rather than an
 * error.
 *
 * Maintainer-only, via the same fail-closed gate as the rest of the section.
 * Data is not sensitive but the surface area is: it reports which
 * integrations are configured, which is deployment information.
 */

const STATUS_STYLE: Record<
  DiagnosticResult["status"],
  { icon: typeof CheckCircle2; className: string; word: string }
> = {
  pass: {
    icon: CheckCircle2,
    className: "text-status-green",
    word: "OK",
  },
  warn: {
    icon: AlertTriangle,
    className: "text-status-yellow",
    word: "Check",
  },
  fail: {
    icon: XCircle,
    className: "text-primary-red",
    word: "Failing",
  },
};

const GROUPS = ["Services", "Configuration", "Data"] as const;

export default async function SystemCheckPage() {
  const session = await auth0.getSession();
  const userId = session?.user?.sub ?? "none";

  const db = createServiceClient();
  const { data: profile } = await db
    .from("profiles")
    .select("role")
    .eq("auth0_user_id", userId)
    .single();

  const blocked = roleRedirect(profile?.role, ["maintainer"]);
  if (blocked) redirect(blocked);

  const results = await runDiagnostics();

  const failing = results.filter((r) => r.status === "fail");
  const warning = results.filter((r) => r.status === "warn");

  return (
    <>
      <PageHeader
        title="System Check"
        description="Live status of every external service, the configuration contract, and core data integrity."
        actions={
          // asChild so this stays a real link: re-running is a GET on a
          // force-dynamic route, so it survives a middle-click and needs no
          // client state to look right.
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/maintainer/system-check">
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Re-run checks
            </Link>
          </Button>
        }
      />

      <div
        className={cn(
          "bh-card mb-6 p-4",
          failing.length > 0
            ? "border-primary-red/40"
            : warning.length > 0
              ? "border-status-yellow/40"
              : "border-status-green/40",
        )}
      >
        <p className="text-sm font-semibold text-primary">
          {failing.length > 0
            ? `${failing.length} of ${results.length} check${results.length === 1 ? "" : "s"} failing`
            : warning.length > 0
              ? `All systems responding, ${warning.length} worth a look`
              : `All ${results.length} checks passing`}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Checks run live on every load. Nothing here is cached, so a stale
          result cannot be mistaken for a current one.
        </p>
      </div>

      <div className="space-y-6">
        {GROUPS.map((group) => {
          const rows = results.filter((r) => r.group === group);
          if (rows.length === 0) return null;

          return (
            <SectionCard
              key={group}
              title={group}
              description={`${rows.filter((r) => r.status === "pass").length} of ${rows.length} healthy`}
            >
              {/* A table, not cards: this is reference data a maintainer
                  scans column-wise looking for the single failing row, and
                  row-per-card destroys that comparison. */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">
                    {group} diagnostic results
                  </caption>
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th scope="col" className="py-2 pr-3 font-semibold text-secondary">
                        Check
                      </th>
                      <th scope="col" className="py-2 pr-3 font-semibold text-secondary">
                        Status
                      </th>
                      <th scope="col" className="py-2 pr-3 font-semibold text-secondary">
                        Detail
                      </th>
                      <th scope="col" className="py-2 text-right font-semibold text-secondary">
                        Latency
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const { icon: Icon, className, word } = STATUS_STYLE[row.status];
                      return (
                        <tr key={row.label} className="border-b border-border/50 last:border-0">
                          <th scope="row" className="py-2.5 pr-3 text-left font-medium text-primary">
                            {row.label}
                          </th>
                          <td className="py-2.5 pr-3">
                            <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold", className)}>
                              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                              {word}
                            </span>
                          </td>
                          <td className="py-2.5 pr-3 text-muted-foreground break-words">
                            {row.detail}
                          </td>
                          <td className="py-2.5 text-right font-mono text-xs text-muted-foreground tabular-nums">
                            {row.latency_ms === null ? "—" : `${row.latency_ms}ms`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          );
        })}
      </div>
    </>
  );
}