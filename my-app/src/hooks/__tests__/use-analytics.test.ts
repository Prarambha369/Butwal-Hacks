// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAnalytics } from "../use-analytics";

// ─── Mock posthog-js ─────────────────────────────────────────────
// Factory must not reference module-level variables (hoisted before init)

vi.mock("posthog-js", () => {
  const mock = {
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    getFeatureFlag: vi.fn(),
    getFeatureFlagPayload: vi.fn(),
  };
  return { default: mock };
});

import posthog from "posthog-js";

// Cast the mock so TypeScript allows mock assertions
const mockPosthog = posthog as unknown as {
  capture: ReturnType<typeof vi.fn>;
  identify: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
  getFeatureFlag: ReturnType<typeof vi.fn>;
  getFeatureFlagPayload: ReturnType<typeof vi.fn>;
};

// ═══════════════════════════════════════════════════════════════════
// useAnalytics
// ═══════════════════════════════════════════════════════════════════

describe("useAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all analytics methods", () => {
    const { result } = renderHook(() => useAnalytics());

    expect(result.current).toHaveProperty("capture");
    expect(result.current).toHaveProperty("identify");
    expect(result.current).toHaveProperty("reset");
    expect(result.current).toHaveProperty("getFeatureFlag");
    expect(result.current).toHaveProperty("getFeatureFlagPayload");
  });

  describe("capture", () => {
    it("calls posthog.capture with event name", () => {
      const { result } = renderHook(() => useAnalytics());
      result.current.capture("button_clicked");

      expect(mockPosthog.capture).toHaveBeenCalledWith("button_clicked", undefined);
    });

    it("calls posthog.capture with event and properties", () => {
      const { result } = renderHook(() => useAnalytics());
      result.current.capture("project_created", { projectId: "abc", teamSize: 3 });

      expect(mockPosthog.capture).toHaveBeenCalledWith("project_created", {
        projectId: "abc",
        teamSize: 3,
      });
    });
  });

  describe("identify", () => {
    it("calls posthog.identify with userId", () => {
      const { result } = renderHook(() => useAnalytics());
      result.current.identify("auth0|12345");

      expect(mockPosthog.identify).toHaveBeenCalledWith("auth0|12345", undefined);
    });

    it("calls posthog.identify with userId and traits", () => {
      const { result } = renderHook(() => useAnalytics());
      result.current.identify("auth0|12345", { email: "test@test.com", role: "hacker" });

      expect(mockPosthog.identify).toHaveBeenCalledWith("auth0|12345", {
        email: "test@test.com",
        role: "hacker",
      });
    });
  });

  describe("reset", () => {
    it("calls posthog.reset", () => {
      const { result } = renderHook(() => useAnalytics());
      result.current.reset();

      expect(mockPosthog.reset).toHaveBeenCalledTimes(1);
    });
  });

  describe("getFeatureFlag", () => {
    it("returns the feature flag value when defined", () => {
      mockPosthog.getFeatureFlag.mockReturnValue("enabled");
      const { result } = renderHook(() => useAnalytics());

      const value = result.current.getFeatureFlag("new-dashboard");
      expect(value).toBe("enabled");
      expect(mockPosthog.getFeatureFlag).toHaveBeenCalledWith("new-dashboard");
    });

    it("returns default value when flag is not defined", () => {
      mockPosthog.getFeatureFlag.mockReturnValue(undefined);
      const { result } = renderHook(() => useAnalytics());

      const value = result.current.getFeatureFlag("unknown-flag", "default-val");
      expect(value).toBe("default-val");
    });

    it("returns false when flag is not defined and no default is given", () => {
      mockPosthog.getFeatureFlag.mockReturnValue(undefined);
      const { result } = renderHook(() => useAnalytics());

      const value = result.current.getFeatureFlag("unknown-flag");
      expect(value).toBe(false);
    });
  });

  describe("getFeatureFlagPayload", () => {
    it("returns the feature flag payload", () => {
      const payload = { color: "red", size: "large" };
      mockPosthog.getFeatureFlagPayload.mockReturnValue(payload);
      const { result } = renderHook(() => useAnalytics());

      const value = result.current.getFeatureFlagPayload("experiment-1");
      expect(value).toEqual(payload);
      expect(mockPosthog.getFeatureFlagPayload).toHaveBeenCalledWith("experiment-1");
    });

    it("returns undefined when no payload exists", () => {
      mockPosthog.getFeatureFlagPayload.mockReturnValue(undefined);
      const { result } = renderHook(() => useAnalytics());

      const value = result.current.getFeatureFlagPayload("no-payload");
      expect(value).toBeUndefined();
    });
  });
});
