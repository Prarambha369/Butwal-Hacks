// @vitest-environment happy-dom

import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useOnboardingProgress } from "../use-onboarding-progress";

// ═══════════════════════════════════════════════════════════════════
// useOnboardingProgress
// ═══════════════════════════════════════════════════════════════════

describe("useOnboardingProgress", () => {
  it("returns 0% progress with empty profile and no activity", () => {
    const { result } = renderHook(() =>
      useOnboardingProgress(null, 0, 0),
    );

    expect(result.current.completedCount).toBe(0);
    expect(result.current.totalCount).toBe(4);
    expect(result.current.progress).toBe(0);
    expect(result.current.allComplete).toBe(false);
    expect(result.current.currentStepIndex).toBe(0);
  });

  it("completes profile step when name, bio, and socials are present", () => {
    const profile = {
      full_name: "Test User",
      bio: "A bio",
      socials: { github: "testuser" },
    };
    const { result } = renderHook(() =>
      useOnboardingProgress(profile, 0, 0),
    );

    expect(result.current.steps[0].isComplete).toBe(true);
    expect(result.current.steps[0].id).toBe("profile");
    expect(result.current.completedCount).toBe(1);
    expect(result.current.progress).toBe(25);
  });

  it("does not complete profile step with default name 'New Hacker'", () => {
    const profile = {
      full_name: "New Hacker",
      bio: "A bio",
      socials: { github: "testuser" },
    };
    const { result } = renderHook(() =>
      useOnboardingProgress(profile, 0, 0),
    );

    expect(result.current.steps[0].isComplete).toBe(false);
  });

  it("does not complete profile step when bio is missing", () => {
    const profile = {
      full_name: "Test User",
      bio: null,
      socials: { github: "testuser" },
    };
    const { result } = renderHook(() =>
      useOnboardingProgress(profile, 0, 0),
    );

    expect(result.current.steps[0].isComplete).toBe(false);
  });

  it("does not complete profile step when socials are empty", () => {
    const profile = {
      full_name: "Test User",
      bio: "A bio",
      socials: {},
    };
    const { result } = renderHook(() =>
      useOnboardingProgress(profile, 0, 0),
    );

    expect(result.current.steps[0].isComplete).toBe(false);
  });

  it("completes chapter step when chapterCount > 0", () => {
    const { result } = renderHook(() =>
      useOnboardingProgress(null, 2, 0),
    );

    expect(result.current.steps[1].id).toBe("chapter");
    expect(result.current.steps[1].isComplete).toBe(true);
    expect(result.current.completedCount).toBe(1);
  });

  it("does not complete chapter step with zero chapters", () => {
    const { result } = renderHook(() =>
      useOnboardingProgress(null, 0, 0),
    );

    expect(result.current.steps[1].isComplete).toBe(false);
  });

  it("completes project step when projectCount > 0", () => {
    const { result } = renderHook(() =>
      useOnboardingProgress(null, 0, 3),
    );

    expect(result.current.steps[2].id).toBe("project");
    expect(result.current.steps[2].isComplete).toBe(true);
    expect(result.current.completedCount).toBe(1);
  });

  it("does not complete project step with zero projects", () => {
    const { result } = renderHook(() =>
      useOnboardingProgress(null, 0, 0),
    );

    expect(result.current.steps[2].isComplete).toBe(false);
  });

  it("completes marker step when trust_markers exist", () => {
    const profile = { trust_markers: [{ id: "m1" }] };
    const { result } = renderHook(() =>
      useOnboardingProgress(profile, 0, 0),
    );

    expect(result.current.steps[3].id).toBe("marker");
    expect(result.current.steps[3].isComplete).toBe(true);
    expect(result.current.completedCount).toBe(1);
  });

  it("does not complete marker step with empty trust_markers", () => {
    const profile = { trust_markers: [] };
    const { result } = renderHook(() =>
      useOnboardingProgress(profile, 0, 0),
    );

    expect(result.current.steps[3].isComplete).toBe(false);
  });

  it("does not complete marker step when trust_markers is null", () => {
    const profile = { trust_markers: null };
    const { result } = renderHook(() =>
      useOnboardingProgress(profile, 0, 0),
    );

    expect(result.current.steps[3].isComplete).toBe(false);
  });

  it("returns 100% when all steps complete", () => {
    const profile = {
      full_name: "Complete User",
      bio: "Everything done",
      socials: { twitter: "user" },
      trust_markers: [{ id: "m1" }],
    };
    const { result } = renderHook(() =>
      useOnboardingProgress(profile, 1, 1),
    );

    expect(result.current.allComplete).toBe(true);
    expect(result.current.completedCount).toBe(4);
    expect(result.current.progress).toBe(100);
    expect(result.current.currentStepIndex).toBe(-1);
  });

  it("points currentStepIndex to the first incomplete step", () => {
    const profile = {
      full_name: "Partial User",
      bio: "Has profile",
      socials: { github: "user" },
    };
    const { result } = renderHook(() =>
      useOnboardingProgress(profile, 0, 0),
    );

    // Profile step complete (step 0), first incomplete is chapter (step 1)
    expect(result.current.currentStepIndex).toBe(1);
  });

  it("returns 25% progress per completed step", () => {
    const profile = {
      full_name: "User",
      bio: "bio",
      socials: { web: "site" },
      trust_markers: [{ id: "m1" }],
    };
    const { result } = renderHook(() =>
      useOnboardingProgress(profile, 1, 0),
    );

    // 3 of 4 complete = 75%
    expect(result.current.completedCount).toBe(3);
    expect(result.current.progress).toBe(75);
  });
});
