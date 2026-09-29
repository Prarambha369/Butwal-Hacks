// @vitest-environment happy-dom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import Hero from "@/components/sections/Hero";
import LiveStatsCounter from "@/components/home/live-stats-counter";

// AuthAwareCta reads an auth context that has no default, so it throws when
// rendered outside a provider. It is irrelevant to the regressions below.
vi.mock("@/components/auth-aware-cta", () => ({
  default: () => <a href="/get-started">Get started</a>,
}));

/**
 * Regression guard for the site's dominant Cumulative Layout Shift.
 *
 * Lighthouse attributed the shift to `div.bh-bg-grid`, but that overlay is
 * `absolute inset-0` — it only moved because content above it resized after
 * hydration. Two real causes:
 *
 *  1. TerminalTyper rendered a variable number of <p> lines (1, then 2, then 3)
 *     as its `count` advanced, and `w-fit` made the box change width every
 *     frame. Both reflow the Hero, which moves every absolutely-positioned
 *     child. Worse, the typer loops forever (reset to 0 after a 4s hold), so
 *     the shift never settled — CLS was measured at 0.302 on mobile.
 *  2. The stats skeleton omitted the footnote paragraph entirely, so the
 *     section grew ~55px once the real numbers replaced it.
 *
 * The fix makes both layouts structurally invariant rather than pixel-tuned,
 * so these assertions check structure: a constant line count, and a footnote
 * that is present in both states.
 */
function terminalParagraphs(container: HTMLElement): number {
  // Ancestors precede descendants in document order, so the last match is the
  // deepest div wrapping the title-bar text; its parent is the terminal shell.
  const matches = Array.from(container.querySelectorAll("div")).filter((d) =>
    d.textContent?.includes("butwal-hacks"),
  );
  const shell = matches[matches.length - 1]?.parentElement;
  return shell ? shell.querySelectorAll("p").length : -1;
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("homepage layout stability (CLS)", () => {
  it("keeps the terminal line count constant across the entire typing loop", async () => {
    vi.useFakeTimers();
    const { container } = render(<Hero />);

    const observed = new Set<number>();
    // 20s of animation covers multiple full loop iterations
    // (type ~42ms/char, 500ms pause at the newline, 4s hold, then reset).
    for (let i = 0; i < 400; i++) {
      await act(async () => {
        vi.advanceTimersByTime(50);
      });
      observed.add(terminalParagraphs(container));
    }

    expect(observed.size).toBe(1);
    expect([...observed]).toEqual([3]);
  });

  it("reserves the stats footnote line box while the skeleton is showing", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    const { container } = render(<LiveStatsCounter />);

    expect(container.querySelectorAll("p.mt-10")).toHaveLength(1);
  });

  it("does not mount or unmount the footnote between skeleton and loaded states", async () => {
    const footnotes = () => document.querySelectorAll("p.mt-10").length;

    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    render(<LiveStatsCounter />);
    expect(footnotes()).toBe(1);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          total_hackers: 128,
          total_events: 34,
          total_projects: 7,
          total_trust_markers: 5,
        }),
      }),
    );

    for (let i = 0; i < 10; i++) {
      await act(async () => {
        await Promise.resolve();
      });
    }

    expect(footnotes()).toBe(1);
  });

  it("mirrors the loaded stat's line boxes in the skeleton", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    const { container } = render(<LiveStatsCounter />);

    // Each skeleton card must reuse the loaded markup's line boxes
    // (text-5xl/6xl number, 3px rule, text-sm label) so the swap is a pure
    // paint change with no reflow.
    const cards = container.querySelectorAll(".grid > div");
    expect(cards).toHaveLength(4);
    for (const card of Array.from(cards)) {
      expect(card.querySelectorAll("p")).toHaveLength(2);
      expect(card.querySelector(".h-\\[3px\\]")).not.toBeNull();
    }
  });
});
