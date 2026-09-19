"use client";

import { Component, type ReactNode } from "react";
import Link from "next/link";

/** Catches calendar render crashes (e.g. date-engine range errors)
 * so one bad month never takes down the homepage. */
export default class CalendarErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  render(): ReactNode {
    if (this.state.failed) {
      return (
        <section className="bg-surface border-border border-b py-20">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-3">
            <h2 className="text-2xl font-bold text-primary">Events Calendar</h2>
            <p className="text-sm text-muted-foreground">
              The calendar hit a date it can&apos;t show. Browse all events instead.
            </p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-2.5 text-sm font-bold text-primary hover:bg-surface-hover transition-all"
            >
              All events
            </Link>
          </div>
        </section>
      );
    }
    return this.props.children;
  }
}
