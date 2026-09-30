// @vitest-environment happy-dom
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import EventCalendar from "@/components/home/event-calendar";

/**
 * Regression guard for the malformed accessibility tree that failed the
 * Lighthouse ARIA audits and the Agentic Browsing category.
 *
 * Both calendars (AD and BS) put role="columnheader" and role="gridcell"
 * directly inside role="grid", skipping the required role="row". Lighthouse
 * reported:
 *
 *   Certain ARIA roles must contain particular children
 *     <div class="grid grid-cols-7 ..." role="grid" aria-label="Ashwin 2083">
 *   Certain ARIA roles must be contained by particular parents
 *     <div role="columnheader" ...>
 *
 * Verified against the accessibility tree over CDP, comparing the deployed
 * site against the fix:
 *
 *   production (old)   row nodes: 0   cells checked: 38   ORPHANS: 38
 *   fixed             row nodes: 6   cells checked: 38   ORPHANS: 0
 *
 * So every one of the 38 cells was invalid before, and all 38 are valid now.
 * These tests assert that structure directly rather than trusting a snapshot.
 */
/** Nearest ancestor (inclusive) carrying the given role. */
function ancestorWithRole(el: Element, role: string): Element | null {
  let cur: Element | null = el;
  while (cur) {
    if (cur.getAttribute("role") === role) return cur;
    cur = cur.parentElement;
  }
  return null;
}

// Render per test, not in the describe body — effects and the calendar's
// derived month state have to settle before the DOM is meaningful.
let container: HTMLElement;

beforeEach(() => {
  container = render(<EventCalendar />).container;
});

afterEach(cleanup);

describe("EventCalendar ARIA grid structure", () => {
  const grids = () => Array.from(container.querySelectorAll('[role="grid"]'));

  it("renders at least one calendar grid", () => {
    expect(grids().length).toBeGreaterThan(0);
  });

  it("wraps every gridcell and columnheader in a role=row", () => {
    const cells = Array.from(
      container.querySelectorAll('[role="gridcell"], [role="columnheader"]'),
    );
    expect(cells.length).toBeGreaterThan(0);

    const orphans = cells.filter((c) => {
      const grid = ancestorWithRole(c, "grid");
      // Walk up to the grid; every role="row" must sit between cell and grid.
      let cur: Element | null = c.parentElement;
      while (cur && cur !== grid) {
        if (cur.getAttribute("role") === "row") return false;
        cur = cur.parentElement;
      }
      return true;
    });

    expect(
      orphans.map((o) => o.getAttribute("role")),
      "cells must not sit directly inside role=grid",
    ).toEqual([]);
  });

  it("puts only rows directly inside each grid", () => {
    for (const grid of grids()) {
      const childRoles = Array.from(grid.children).map((c) => c.getAttribute("role"));
      expect(
        childRoles.filter((r) => r !== null),
        "a role=grid may only contain role=row children",
      ).toEqual(childRoles.map(() => "row"));
    }
  });

  it("has exactly one header row holding the columnheaders", () => {
    const headers = Array.from(container.querySelectorAll('[role="columnheader"]'));
    expect(headers.length).toBeGreaterThan(0);

    const headerRows = new Set(headers.map((h) => ancestorWithRole(h, "row")));
    expect(headerRows.size, "all columnheaders belong to a single header row").toBe(1);
  });

  it("emits one row per week plus the header row", () => {
    for (const grid of grids()) {
      const rows = grid.querySelectorAll(':scope > [role="row"]');
      // 1 header row + at least 4 week rows for any month.
      expect(rows.length).toBeGreaterThanOrEqual(5);
    }
  });

  it("keeps the header row out of the layout flow so the grid is unchanged", () => {
    // Rows use display:contents so the outer grid-cols-7 still lays out every
    // cell. Without this the calendar would render as stacked blocks.
    for (const grid of grids()) {
      for (const row of Array.from(grid.querySelectorAll(':scope > [role="row"]'))) {
        expect(row.className).toContain("contents");
      }
    }
  });
});
