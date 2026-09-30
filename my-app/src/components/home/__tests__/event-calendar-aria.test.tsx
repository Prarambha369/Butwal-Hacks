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

interface GridInfo {
  grid: Element;
  /** Direct role="row" children of the grid. */
  rows: Element[];
  /** Weekday headings, per grid rather than document-wide. */
  headers: Element[];
  /** All gridcells, including the aria-hidden leading pads. */
  cells: Element[];
  /** Leading pad cells, which have no day number. */
  pads: Element[];
}

/** Every grid with the pieces each assertion needs, scoped per grid. */
function gridInfos(): GridInfo[] {
  return Array.from(container.querySelectorAll('[role="grid"]')).map((grid) => {
    const rows = Array.from(grid.querySelectorAll(':scope > [role="row"]'));
    const headers = Array.from(grid.querySelectorAll('[role="columnheader"]'));
    const cells = Array.from(grid.querySelectorAll('[role="gridcell"]'));
    return { grid, rows, headers, cells, pads: cells.filter((c) => c.getAttribute("aria-hidden") === "true") };
  });
}

describe("EventCalendar ARIA grid structure", () => {
  const infos = () => gridInfos();

  it("renders a grid with a row structure", () => {
    expect(infos().length).toBeGreaterThan(0);
    // Guard against vacuous passes: with no rows at all, several assertions
    // below would iterate zero times and hold trivially.
    for (const { rows } of infos()) {
      expect(rows.length, "each grid must have role=row children").toBeGreaterThan(0);
    }
  });

  it("wraps every gridcell and columnheader in a role=row", () => {
    for (const { grid, headers, cells } of infos()) {
      const all = [...cells, ...headers];
      expect(all.length, "grid must contain cells").toBeGreaterThan(0);

      const orphans = all.filter((c) => {
        // Walk up to this grid; a role="row" must sit between cell and grid.
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
    }
  });

  it("puts only rows directly inside each grid", () => {
    for (const { grid } of infos()) {
      const childRoles = Array.from(grid.children).map((c) => c.getAttribute("role"));
      expect(
        childRoles,
        "a role=grid may only contain role=row children, each with an explicit role",
      ).toEqual(Array.from({ length: childRoles.length }, () => "row"));
    }
  });

  it("puts every columnheader in one real header row", () => {
    for (const { headers } of infos()) {
      expect(headers.length, "grid must have weekday headings").toBe(7);

      // Assert the ancestor exists AND that they all share it. Checking only
      // the Set size passes vacuously when every ancestor is null, which is
      // exactly what the pre-fix markup produced.
      const headerRows = headers.map((h) => ancestorWithRole(h, "row"));
      expect(
        headerRows.filter((r) => r === null),
        "each columnheader must sit inside a role=row",
      ).toEqual([]);
      expect(new Set(headerRows).size, "all columnheaders share one header row").toBe(1);
    }
  });

  it("emits exactly one row per week plus the header row", () => {
    for (const { rows, cells } of infos()) {
      const headerRow = rows.filter((r) => r.querySelector('[role="columnheader"]'));
      const weekRows = rows.filter((r) => !r.querySelector('[role="columnheader"]'));

      expect(headerRow, "exactly one header row").toHaveLength(1);
      // 7 columns, so the number of week rows follows from the cell count.
      expect(weekRows, "one row per 7 cells").toHaveLength(Math.ceil(cells.length / 7));
      expect(rows.length).toBe(weekRows.length + 1);
    }
  });

  it("gives every cell row exactly seven slots", () => {
    for (const { rows } of infos()) {
      expect(rows.length, "guarded against vacuous iteration").toBeGreaterThan(0);
      for (const row of rows) {
        expect(row.querySelectorAll('[role="gridcell"], [role="columnheader"]'), "row width")
          .toHaveLength(7);
      }
    }
  });

  it("hides only the leading pad cells, and never a day cell", () => {
    for (const { cells, pads } of infos()) {
      expect(pads.length, "pads exist").toBeGreaterThan(0);
      expect(pads.length, "pads only ever lead a row").toBeLessThan(7);
      for (const pad of pads) {
        expect(pad.children.length, "pads contain no day number").toBe(0);
      }
      expect(cells.length).toBeGreaterThan(pads.length);
    }
  });

  it("keeps rows out of the layout flow so the grid is unchanged", () => {
    for (const { rows } of infos()) {
      expect(rows.length, "guarded against vacuous iteration").toBeGreaterThan(0);
      for (const row of rows) {
        // display:contents, so the outer grid-cols-7 still lays out every cell.
        expect(Array.from(row.classList)).toContain("contents");
      }
    }
  });
});
