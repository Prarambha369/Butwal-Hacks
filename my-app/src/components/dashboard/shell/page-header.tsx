import { cn } from "@/lib/utils";

/**
 * The page header the reference layout puts at the top of every screen:
 * an eyebrow, a title, a short description, and a slot for actions.
 *
 * Replaces the ad-hoc `h1` block each role page was rolling for itself, which
 * is why spacing and type size drifted between dashboards.
 */

export interface PageHeaderProps {
  /**
   * Small uppercase label above the title, e.g. "ORGANIZER". Typed as a node
   * because the dashboards pass a role pill here rather than plain text, and
   * the organizer/maintainer pages all want a status or role chip in that
   * slot.
   */
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary-red">
            {eyebrow}
          </p>
        ) : null}
        {/* `break-words`, not `truncate`. The maintainer header passes a title
            containing a flex span with its health badge, and `truncate` is
            overflow:hidden + white-space:nowrap -- so on a narrow screen the
            badge was clipped and the status it reports simply vanished. Long
            single-word titles still wrap rather than overflowing. */}
        <h1 className="break-words text-2xl font-bold tracking-tight text-primary sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-secondary">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

/**
 * A titled panel. The reference layout's content blocks are all "card with a
 * title row and an optional right-hand action", so this is that shape.
 */
export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-xl border border-border bg-surface",
        className,
      )}
    >
      {title || action ? (
        <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            {title ? (
              <h2 className="truncate text-sm font-semibold text-primary">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-0.5 text-xs text-text-muted">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className={cn("flex-1 p-4", bodyClassName)}>{children}</div>
    </section>
  );
}
