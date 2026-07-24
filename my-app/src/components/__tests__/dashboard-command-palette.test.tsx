// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { DashboardCommandPalette, type DashboardNavItem } from "@/components/dashboard-command-palette";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockLinks: DashboardNavItem[] = [
  { href: "/dashboard/hacker", label: "Overview", shortcut: "h", icon: <span data-testid="icon-overview" /> },
  { href: "/dashboard/hacker/profile", label: "My Profile", shortcut: "r", icon: <span data-testid="icon-profile" /> },
  { href: "/dashboard/hacker/work", label: "Work", shortcut: "w", icon: <span data-testid="icon-work" /> },
  { href: "/dashboard/hacker/projects", label: "Projects", shortcut: "p", icon: <span data-testid="icon-projects" /> },
];

function renderPalette() {
  return render(<DashboardCommandPalette links={mockLinks} />);
}

describe("DashboardCommandPalette", () => {
  beforeEach(() => {
    cleanup();
    mockPush.mockClear();
  });

  it("renders nothing by default", () => {
    const { container } = renderPalette();
    expect(container.firstChild).toBeNull();
  });

  it("opens on Alt+K press", () => {
    renderPalette();
    fireEvent.keyDown(window, { key: "k", altKey: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Jump to...")).toBeInTheDocument();
  });

  it("opens on / key press", () => {
    renderPalette();
    fireEvent.keyDown(window, { key: "/" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes on Escape", () => {
    renderPalette();
    fireEvent.keyDown(window, { key: "k", altKey: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes when clicking backdrop", () => {
    renderPalette();
    fireEvent.keyDown(window, { key: "k", altKey: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Click the backdrop (it has aria-hidden="true")
    const backdrop = document.querySelector('[aria-hidden="true"]');
    expect(backdrop).toBeInTheDocument();
    if (backdrop) fireEvent.click(backdrop);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("toggles with consecutive Alt+K presses", () => {
    renderPalette();
    // Open
    fireEvent.keyDown(window, { key: "k", altKey: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Close
    fireEvent.keyDown(window, { key: "k", altKey: true });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Open again
    fireEvent.keyDown(window, { key: "k", altKey: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows all links by default when opened", () => {
    renderPalette();
    fireEvent.keyDown(window, { key: "k", altKey: true });

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("My Profile")).toBeInTheDocument();
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
  });

  it("filters links when typing a query", () => {
    renderPalette();
    fireEvent.keyDown(window, { key: "k", altKey: true });

    const input = screen.getByPlaceholderText("Jump to...");
    fireEvent.change(input, { target: { value: "profile" } });

    expect(screen.getByText("My Profile")).toBeInTheDocument();
    expect(screen.queryByText("Overview")).not.toBeInTheDocument();
    expect(screen.queryByText("Work")).not.toBeInTheDocument();
    expect(screen.queryByText("Projects")).not.toBeInTheDocument();
  });

  it("shows all links unfiltered by default", () => {
    renderPalette();
    fireEvent.keyDown(window, { key: "k", altKey: true });

    const input = screen.getByPlaceholderText("Jump to...");
    // Default state — all links visible
    expect(screen.getAllByRole("button").length).toBeGreaterThan(3);
    expect(input).toHaveValue("");
  });

  it("shows no-results state when query matches nothing", () => {
    renderPalette();
    fireEvent.keyDown(window, { key: "k", altKey: true });

    const input = screen.getByPlaceholderText("Jump to...");
    fireEvent.change(input, { target: { value: "zzz_nonexistent" } });

    expect(screen.getByText(/No pages match/i)).toBeInTheDocument();
  });

  it("navigates down with ArrowDown and selects with Enter", () => {
    renderPalette();
    fireEvent.keyDown(window, { key: "k", altKey: true });

    const input = screen.getByPlaceholderText("Jump to...");

    // Arrow down once = index 1 (My Profile), then Enter
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockPush).toHaveBeenCalledWith("/dashboard/hacker/profile");
  });

  it("navigates up with ArrowUp and selects with Enter", () => {
    renderPalette();
    fireEvent.keyDown(window, { key: "k", altKey: true });

    const input = screen.getByPlaceholderText("Jump to...");

    // Arrow down to index 3 (Projects), then ArrowUp to index 2 (Work)
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockPush).toHaveBeenCalledWith("/dashboard/hacker/work");
  });

  it("stays at last item when pressing ArrowDown beyond list end", () => {
    renderPalette();
    fireEvent.keyDown(window, { key: "k", altKey: true });

    const input = screen.getByPlaceholderText("Jump to...");

    // Navigate to end and try going further
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockPush).toHaveBeenCalledWith("/dashboard/hacker/projects");
  });

  it("stays at first item when pressing ArrowUp at start", () => {
    renderPalette();
    fireEvent.keyDown(window, { key: "k", altKey: true });

    const input = screen.getByPlaceholderText("Jump to...");

    // Try going up when already at index 0
    fireEvent.keyDown(input, { key: "ArrowUp" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockPush).toHaveBeenCalledWith("/dashboard/hacker");
  });

  it("selects item on click", () => {
    renderPalette();
    fireEvent.keyDown(window, { key: "k", altKey: true });

    const workButton = screen.getByText("Work");
    fireEvent.click(workButton);

    expect(mockPush).toHaveBeenCalledWith("/dashboard/hacker/work");
  });

  it("highlights item on hover", () => {
    renderPalette();
    fireEvent.keyDown(window, { key: "k", altKey: true });

    const workButton = screen.getByText("Work");
    fireEvent.mouseEnter(workButton);

    // Hovered item gets the selected class
    const button = workButton.closest("button");
    expect(button).toHaveClass("bg-primary-red/10");
  });

  it("does not intercept typing in inputs outside the palette", () => {
    renderPalette();
    // Simulate typing in an input — should not open palette
    const outsideInput = document.createElement("input");
    document.body.appendChild(outsideInput);
    outsideInput.focus();

    fireEvent.keyDown(outsideInput, { key: "/" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    document.body.removeChild(outsideInput);
  });
});
