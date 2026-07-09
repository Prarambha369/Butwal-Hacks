// @vitest-environment happy-dom

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { SectionHeading } from "@/components/ui/section-heading";

/* ─── Smoke test: component exports correctly ────────────────────── */

describe("SectionHeading", () => {
  it("exports a function component", () => {
    expect(typeof SectionHeading).toBe("function");
  });
});

/* ─── Cleanup guard: prevent DOM accumulation between tests ──────── */

afterEach(() => cleanup());

/* ─── Variant: accent ────────────────────────────────────────────── */

describe("variant: accent", () => {
  it("renders heading text", () => {
    render(<SectionHeading variant="accent">Chapters</SectionHeading>);
    expect(screen.getByText("Chapters")).toBeInTheDocument();
  });

  it("renders as h3 by default", () => {
    render(<SectionHeading variant="accent">Title</SectionHeading>);
    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("Title");
  });

  it("renders an accent bar with the default red color", () => {
    const { container } = render(<SectionHeading variant="accent">Title</SectionHeading>);
    const accentBars = container.querySelectorAll(".bg-bh-red-500");
    expect(accentBars.length).toBeGreaterThanOrEqual(1);
  });

  it("applies the wrapper class with flex items-center gap-3", () => {
    const { container } = render(<SectionHeading variant="accent">Title</SectionHeading>);
    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveClass("flex", "items-center", "gap-3");
  });

  it("has a shrink-0 rounded-full accent bar", () => {
    const { container } = render(<SectionHeading variant="accent">Title</SectionHeading>);
    const bar = container.querySelector(".w-1.h-6");
    expect(bar).toHaveClass("shrink-0", "rounded-full");
  });
});

/* ─── Variant: icon ──────────────────────────────────────────────── */

describe("variant: icon", () => {
  it("renders heading text", () => {
    render(
      <SectionHeading variant="icon" icon={<span data-testid="test-icon">★</span>}>
        Activity
      </SectionHeading>,
    );
    expect(screen.getByText("Activity")).toBeInTheDocument();
  });

  it("renders the icon inside a badge container", () => {
    render(
      <SectionHeading variant="icon" icon={<span data-testid="test-icon">★</span>}>
        Title
      </SectionHeading>,
    );
    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });

  it("applies color-specific background and text to the icon container", () => {
    const { container } = render(
      <SectionHeading variant="icon" icon={<span>★</span>} color="green">
        Title
      </SectionHeading>,
    );
    const iconContainer = container.querySelector('[class*="p-1"][class*="rounded-md"]');
    expect(iconContainer).toHaveClass("bg-status-green/10", "text-status-green");
  });

  it("defaults to red when no color specified", () => {
    const { container } = render(
      <SectionHeading variant="icon" icon={<span>★</span>}>
        Title
      </SectionHeading>,
    );
    const iconContainer = container.querySelector('[class*="p-1"][class*="rounded-md"]');
    expect(iconContainer).toHaveClass("bg-primary-red/10", "text-primary-red");
  });
});

/* ─── Variant: badge ─────────────────────────────────────────────── */

describe("variant: badge", () => {
  it("renders heading text alongside badge", () => {
    render(<SectionHeading variant="badge" badge="New">Updates</SectionHeading>);
    expect(screen.getByText("Updates")).toBeInTheDocument();
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("applies the badge prop as visible pill text", () => {
    render(<SectionHeading variant="badge" badge="Milestones">Next Up</SectionHeading>);
    const badge = screen.getByText("Milestones");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toMatch(/rounded-full/);
  });

  it("gives the badge the correct color classes", () => {
    render(<SectionHeading variant="badge" badge="Daily" color="yellow">Stats</SectionHeading>);
    const badge = screen.getByText("Daily");
    expect(badge).toHaveClass("bg-status-yellow/10", "text-status-yellow");
  });

  it("does not render a badge span when badge prop is omitted", () => {
    const { container } = render(<SectionHeading variant="badge">Plain</SectionHeading>);
    const wrapper = container.firstElementChild;
    const badgeSpans = wrapper?.querySelectorAll("span");
    expect(badgeSpans?.length ?? 0).toBeLessThanOrEqual(1);
  });
});

/* ─── Variant: dot ───────────────────────────────────────────────── */

describe("variant: dot", () => {
  it("renders heading text", () => {
    render(<SectionHeading variant="dot" color="green">Live</SectionHeading>);
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("renders a colored dot", () => {
    const { container } = render(<SectionHeading variant="dot" color="blue">Live</SectionHeading>);
    const dot = container.querySelector(".w-2.h-2");
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveClass("bg-status-blue");
  });

  it("does not animate by default", () => {
    const { container } = render(<SectionHeading variant="dot" color="red">Live</SectionHeading>);
    const dot = container.querySelector(".w-2.h-2");
    expect(dot).not.toHaveClass("animate-pulse");
  });

  it("adds animate-pulse when animate is true", () => {
    const { container } = render(<SectionHeading variant="dot" color="red" animate>Live</SectionHeading>);
    const dot = container.querySelector(".w-2.h-2");
    expect(dot).toHaveClass("animate-pulse");
  });

  it("applies shrink-0 to the dot", () => {
    const { container } = render(<SectionHeading variant="dot">Live</SectionHeading>);
    const dot = container.querySelector(".w-2.h-2");
    expect(dot).toHaveClass("shrink-0", "rounded-full");
  });
});

/* ─── Variant: plain ─────────────────────────────────────────────── */

describe("variant: plain", () => {
  it("renders heading text with no decoration", () => {
    render(<SectionHeading variant="plain">Quick Links</SectionHeading>);
    expect(screen.getByText("Quick Links")).toBeInTheDocument();
  });

  it("renders as h3 by default", () => {
    render(<SectionHeading variant="plain">Title</SectionHeading>);
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Title");
  });

  it("renders a raw heading element without a wrapper div", () => {
    const { container } = render(<SectionHeading variant="plain">Title</SectionHeading>);
    expect(container.firstElementChild?.tagName).toBe("H3");
  });

  it("applies className directly to the heading", () => {
    render(
      <SectionHeading variant="plain" className="text-lg font-extrabold">
        Title
      </SectionHeading>,
    );
    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toHaveClass("text-lg", "font-extrabold");
  });
});

/* ─── Heading Levels ─────────────────────────────────────────────── */

describe("heading level (as prop)", () => {
  it('renders as h2 when as="h2"', () => {
    render(<SectionHeading variant="accent" as="h2">Heading</SectionHeading>);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Heading");
  });

  it('renders as h3 when as="h3"', () => {
    render(<SectionHeading variant="accent" as="h3">Heading</SectionHeading>);
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Heading");
  });

  it('renders as h4 when as="h4"', () => {
    render(<SectionHeading variant="accent" as="h4">Heading</SectionHeading>);
    expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent("Heading");
  });

  it("applies correct font size for each heading level", () => {
    const { container: c2 } = render(<SectionHeading variant="plain" as="h2">H2</SectionHeading>);
    expect(c2.firstElementChild).toHaveClass("text-lg");

    const { container: c3 } = render(<SectionHeading variant="plain" as="h3">H3</SectionHeading>);
    expect(c3.firstElementChild).toHaveClass("text-base");

    const { container: c4 } = render(<SectionHeading variant="plain" as="h4">H4</SectionHeading>);
    expect(c4.firstElementChild).toHaveClass("text-sm");
  });
});

/* ─── Colors ─────────────────────────────────────────────────────── */

describe("color combinations", () => {
  const colors = [
    { name: "red", accent: "bg-bh-red-500", bg: "bg-primary-red/10", text: "text-primary-red" },
    { name: "green", accent: "bg-status-green", bg: "bg-status-green/10", text: "text-status-green" },
    { name: "yellow", accent: "bg-status-yellow", bg: "bg-status-yellow/10", text: "text-status-yellow" },
    { name: "blue", accent: "bg-status-blue", bg: "bg-status-blue/10", text: "text-status-blue" },
    { name: "orange", accent: "bg-status-orange", bg: "bg-status-orange/10", text: "text-status-orange" },
  ] as const;

  describe.each(colors)("color: $name", ({ name, accent, bg, text }) => {
    it("accent variant uses correct accent bar color", () => {
      const { container } = render(
        <SectionHeading variant="accent" color={name}>Title</SectionHeading>,
      );
      const bar = container.querySelector(".w-1.h-6");
      expect(bar).toHaveClass(accent);
    });

    it("icon variant uses correct background and text color", () => {
      const { container } = render(
        <SectionHeading variant="icon" icon={<span>★</span>} color={name}>
          Title
        </SectionHeading>,
      );
      const iconContainer = container.querySelector('[class*="p-1"][class*="rounded-md"]');
      expect(iconContainer).toHaveClass(bg, text);
    });

    it("badge variant uses correct badge color", () => {
      const { container } = render(
        <SectionHeading variant="badge" badge="Tag" color={name}>
          Title
        </SectionHeading>,
      );
      const badge = container.querySelector('[class*="rounded-full"]');
      expect(badge).toHaveClass(bg, text);
    });

    it("dot variant uses correct dot color", () => {
      const { container } = render(
        <SectionHeading variant="dot" color={name}>Title</SectionHeading>,
      );
      const dot = container.querySelector(".w-2.h-2");
      expect(dot).toHaveClass(accent);
    });
  });
});

/* ─── Edge Cases ─────────────────────────────────────────────────── */

describe("edge cases", () => {
  it("accepts custom className on the wrapper", () => {
    const { container } = render(
      <SectionHeading variant="accent" className="mb-6">
        Title
      </SectionHeading>,
    );
    expect(container.firstElementChild).toHaveClass("mb-6");
  });

  it("renders complex children (JSX)", () => {
    render(
      <SectionHeading variant="accent">
        <span data-testid="complex">Complex <em>child</em></span>
      </SectionHeading>,
    );
    expect(screen.getByTestId("complex")).toBeInTheDocument();
    expect(screen.getByText("child").tagName).toBe("EM");
  });

  it("handles empty children gracefully", () => {
    const { container } = render(<SectionHeading variant="plain">{""}</SectionHeading>);
    expect(container.firstElementChild).toBeInTheDocument();
  });

  it("applies color default (red) when color prop is omitted", () => {
    const { container } = render(
      <SectionHeading variant="icon" icon={<span>★</span>}>
        Title
      </SectionHeading>,
    );
    const iconContainer = container.querySelector('[class*="p-1"][class*="rounded-md"]');
    expect(iconContainer).toHaveClass("bg-primary-red/10", "text-primary-red");
  });

  it("plain variant ignores color prop entirely", () => {
    const { container } = render(
      <SectionHeading variant="plain" color="green">Title</SectionHeading>,
    );
    expect(container.firstElementChild?.tagName).toBe("H3");
    expect(container.firstElementChild).not.toHaveClass("bg-status-green");
  });

  it("omits badge span when badge prop is an empty string", () => {
    const { container } = render(
      <SectionHeading variant="badge" badge="">Title</SectionHeading>,
    );
    const wrapper = container.firstElementChild;
    expect(wrapper?.children.length).toBe(1);
  });
});
