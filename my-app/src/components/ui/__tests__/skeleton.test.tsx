// @vitest-environment happy-dom

import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import {
  Skeleton,
  CardSkeleton,
  FeedSkeleton,
  TableSkeleton,
} from "@/components/ui/skeleton";

afterEach(() => cleanup());

/* ─── Primitive ──────────────────────────────────────────────────── */

describe("Skeleton primitive", () => {
  it("exports the component", () => {
    expect(typeof Skeleton).toBe("function");
  });

  it("renders a single div by default", () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild;
    expect(el).toBeInTheDocument();
    expect(el?.tagName).toBe("DIV");
    expect(el).toHaveClass("animate-pulse", "bg-muted", "rounded-md");
  });

  it("renders count items in a wrapper when count > 1", () => {
    const { container } = render(<Skeleton count={3} />);
    const wrapper = container.firstElementChild;
    expect(wrapper?.children.length).toBe(3);
  });

  it("applies variant classes", () => {
    const { container: c1 } = render(<Skeleton variant="circle" />);
    expect(c1.firstElementChild).toHaveClass("rounded-full");

    const { container: c4 } = render(<Skeleton variant="card" />);
    expect(c4.firstElementChild).toHaveClass("h-48");
  });

  it("applies custom className", () => {
    const { container } = render(<Skeleton className="w-64" />);
    expect(container.firstElementChild).toHaveClass("w-64");
  });
});

/* ─── CardSkeleton ───────────────────────────────────────────────── */

describe("CardSkeleton", () => {
  it("renders a card with icon placeholder and text lines", () => {
    const { container } = render(<CardSkeleton />);
    const card = container.firstElementChild;
    expect(card).toHaveClass("bh-card");
    expect(card?.querySelectorAll(".animate-pulse").length).toBeGreaterThanOrEqual(3);
  });

  it("renders without body lines when lines=0", () => {
    const { container } = render(<CardSkeleton lines={0} />);
    expect(container.firstElementChild).toHaveClass("bh-card");
  });
});



describe("TableSkeleton", () => {
  it("renders a header + body rows inside a bh-card", () => {
    const { container } = render(<TableSkeleton rows={3} columns={4} />);
    const card = container.firstElementChild;
    expect(card).toHaveClass("bh-card");
    // header row + 3 body rows
    expect(card?.children.length).toBe(4);
  });

  it("defaults to 5 rows", () => {
    const { container } = render(<TableSkeleton />);
    const bodyRows = container.querySelectorAll(".border-b");
    expect(bodyRows.length).toBe(6); // header + 5 data rows
  });
});

/* ─── FeedSkeleton ───────────────────────────────────────────────── */

describe("FeedSkeleton", () => {
  it("renders count items", () => {
    const { container } = render(<FeedSkeleton count={3} />);
    expect(container.firstElementChild?.children.length).toBe(3);
  });

  it("defaults to 5 items", () => {
    const { container } = render(<FeedSkeleton />);
    expect(container.firstElementChild?.children.length).toBe(5);
  });

  it("renders avatar + text lines per item", () => {
    const { container } = render(<FeedSkeleton count={1} />);
    const item = container.firstElementChild?.firstElementChild;
    expect(item?.querySelectorAll(".animate-pulse").length).toBeGreaterThanOrEqual(2);
  });
});
