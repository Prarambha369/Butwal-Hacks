"use client";

import { useEffect } from "react";
import { Menu, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { roleConfig, type Role } from "@/components/sidebar-config";
import { OPEN_PALETTE_EVENT } from "@/components/dashboard-command-palette";

/**
 * The dashboard topbar.
 *
 * The dashboard previously had none -- every page inherited the marketing
 * navbar and then rolled its own `h1` block, so there was nowhere to put
 * global search or identity. This is the sticky bar the reference layout leads
 * with: menu toggle, search, then the person.
 *
 * `onOpenNav` is only needed by layouts that render their own sidebar rail.
 * When it is omitted the bar still renders, and the mobile sidebar is driven
 * by the sidebar component's own button.
 */
export function DashboardTopbar({
  role,
  title,
  slugId,
  onOpenNav,
  className,
}: {
  role: Role;
  title?: string;
  slugId?: string;
  onOpenNav?: () => void;
  className?: string;
}) {
  const config = roleConfig[role];

  // `/` is the palette's shortcut. Mirroring it into a visible field means the
  // affordance and the shortcut cannot drift apart.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) {
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        window.dispatchEvent(new Event(OPEN_PALETTE_EVENT));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openPalette = () => {
    // A focused text field would swallow the "/" the palette listens for, so
    // the event is the reliable path from here.
    window.dispatchEvent(new Event(OPEN_PALETTE_EVENT));
  };

  return (
    <header
      className={cn(
        // Opaque, not translucent. PRODUCT.md rules out backdrop-blur and
        // glass effects outright, and a 95%-opaque bar over scrolling content
        // is the same effect wearing a disguise: content reads through it as a
        // smear. A solid surface with a 1px bottom border is the Kloner.app
        // answer and it also survives forced-colors mode.
        "sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface px-4",
        className,
      )}
    >
      {onOpenNav ? (
        <button
          type="button"
          onClick={onOpenNav}
          aria-label="Open navigation"
          className="-ml-1 rounded-lg p-2 text-secondary hover:bg-surface-hover hover:text-primary md:hidden bh-touch-manipulation"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      ) : null}

      {title ? (
        <h2 className="hidden truncate text-sm font-semibold text-primary sm:block">
          {title}
        </h2>
      ) : null}

      {/* Desktop search opens the command palette, which already filters nav. */}
      <div className="ml-auto hidden max-w-sm flex-1 md:block">
        <button
          type="button"
          onClick={openPalette}
          className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-left text-sm text-text-muted transition-colors hover:border-border-light"
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="flex-1 truncate">Search pages and actions</span>
          <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
            /
          </kbd>
        </button>
      </div>

      {/* Compact trigger for the same palette on small screens. */}
      <button
        type="button"
        onClick={openPalette}
        aria-label="Search pages and actions"
        className="rounded-lg p-2 text-secondary hover:bg-surface-hover hover:text-primary md:hidden bh-touch-manipulation"
      >
        <Search className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="flex items-center gap-2 border-l border-border pl-3">
        <span className="hidden text-right leading-tight sm:block">
          <span className="block font-mono text-xs text-secondary">
            {slugId ?? ""}
          </span>
        </span>
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold",
            config.badge,
          )}
          aria-label={`Signed in as ${role}`}
        >
          {(slugId ?? role).slice(0, 2).toUpperCase()}
        </span>
      </div>
    </header>
  );
}

/** Fallback close affordance rendered inside a mobile drawer. */
export function TopbarClose({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close navigation"
      className={cn(
        "rounded-lg p-2 text-secondary hover:bg-surface-hover hover:text-primary",
        className,
      )}
    >
      <X className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
