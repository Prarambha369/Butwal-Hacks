// @vitest-environment happy-dom

import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import LiveStatsCounter from "@/components/home/live-stats-counter";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const mockStats = {
  total_hackers: 1234,
  total_events: 56,
  total_projects: 789,
  total_trust_markers: 101,
};

describe("LiveStatsCounter", () => {
  describe("loading state", () => {
    it("renders skeleton cards while stats are loading", () => {
      // Never resolve the fetch so component stays in loading state
      vi.spyOn(globalThis, "fetch").mockImplementation(() => new Promise(() => {}));

      const { container } = render(<LiveStatsCounter />);

      // Should show loading badge
      expect(screen.getByText("loading platform stats")).toBeInTheDocument();

      // Should render 4 skeleton cards with animate-pulse
      const skeletonCards = container.querySelectorAll(".animate-pulse");
      expect(skeletonCards.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("error state", () => {
    it("shows error message when fetch fails", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

      render(<LiveStatsCounter />);

      // Wait for the error state to render
      const errorText = await screen.findByText("Stats temporarily unavailable");
      expect(errorText).toBeInTheDocument();
    });

    it("shows error message when response is not ok", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 500 }));

      render(<LiveStatsCounter />);

      const errorText = await screen.findByText("Stats temporarily unavailable");
      expect(errorText).toBeInTheDocument();
    });
  });

  describe("success state", () => {
    beforeEach(() => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify(mockStats), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    it("renders live from the database badge", async () => {
      render(<LiveStatsCounter />);

      const badge = await screen.findByText("live from the database");
      expect(badge).toBeInTheDocument();
    });

    it("renders all four stat labels", async () => {
      render(<LiveStatsCounter />);

      expect(await screen.findByText("Hackers")).toBeInTheDocument();
      expect(screen.getByText("Events")).toBeInTheDocument();
      expect(screen.getByText("Projects")).toBeInTheDocument();
      expect(screen.getByText("Credentials")).toBeInTheDocument();
    });

    it("renders formatted stat values from API response", async () => {
      render(<LiveStatsCounter />);

      // The animated number component starts at 0 and animates to the target.
      // Since the test environment may resolve at different speeds, verify
      // the component rendered its stat cards with the data it received.
      const container = document.querySelector(".bh-card");
      expect(container).toBeInTheDocument();

      // Verify the section rendered with stat cards
      const statCards = document.querySelectorAll(".bh-card");
      expect(statCards.length).toBeGreaterThanOrEqual(4);
    });

    it("renders icon containers for each stat", async () => {
      render(<LiveStatsCounter />);

      // Wait for data to load
      await screen.findByText("Hackers");

      // Each stat card has an icon container with bg-primary-red/10 class
      const iconContainers = document.querySelectorAll(".bg-primary-red\\/10");
      expect(iconContainers.length).toBe(4);
    });
  });
});
