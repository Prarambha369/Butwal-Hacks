// @vitest-environment happy-dom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Regression guard for the site's largest layout shift.
 *
 * `AuthAwareCta` rendered a loading state built from `inline-flex items-center
 * gap-2` plus whatever padding `className` contributed, wrapping an `h-11`
 * pulse block. The resolved button uses `baseClasses`, which carries
 * `min-h-[44px]`. The two shells therefore measured differently, and swapping
 * between them collapsed the box.
 *
 * Measured on production with a PerformanceObserver carrying source
 * attribution, the Hero CTA row went 64px -> 46px at ~280ms:
 *
 *   t=   0ms  h=64  <div class="...bh-btn-primary..."><div class="h-11 w-32 ...animate-pulse"></div></div>
 *   t= 282ms  h=46  <a class="...min-h-[44px]..." href="/sign-in?returnTo=...">Sign in to Continue</a>
 *
 * That single 18px collapse measured 0.1168 CLS on its own — it moved the Hero
 * terminal up and re-flowed the nav. The Navbar had the same defect with
 * `w-20`/`w-24` skeletons (192px) against the resolved 206px pair.
 *
 * The fix is structural: the loading state reuses the identical class stack and
 * reserves the real label with `visibility: hidden`, so height *and* width are
 * reserved. These tests assert that invariant so it cannot silently regress —
 * a fixed-width placeholder still shifted the box horizontally (0.0566
 * residual), which is why the label text itself is asserted, not just a width.
 */
let mockAuth: { user: unknown; isLoading: boolean } = { user: null, isLoading: true };

vi.mock("@/components/auth-user-provider", () => ({
  useAuthUser: () => mockAuth,
}));

import AuthAwareCta from "@/components/auth-aware-cta";

const PROPS = {
  actionHref: "/dashboard/hacker",
  actionLabel: "Go to dashboard",
  className: "bh-btn-primary bh-wiggle-hover",
};

function shellOf(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild as HTMLElement;
  expect(el, "component must render a single root element").toBeTruthy();
  return el;
}

afterEach(() => {
  cleanup();
  mockAuth = { user: null, isLoading: true };
});

describe("AuthAwareCta layout stability", () => {
  it("gives the loading and signed-out states the same box classes", () => {
    mockAuth = { user: null, isLoading: true };
    const loading = shellOf(render(<AuthAwareCta {...PROPS} />).container);

    mockAuth = { user: null, isLoading: false };
    const resolved = shellOf(render(<AuthAwareCta {...PROPS} />).container);

    // Every sizing class must match, or the swap reflows the page.
    expect(loading.className).toBe(resolved.className);
    expect(loading.className).toContain("min-h-[44px]");
    expect(loading.className).toContain("inline-flex");
  });

  it("reserves the real label width rather than a fixed placeholder", () => {
    mockAuth = { user: null, isLoading: true };
    const loading = shellOf(render(<AuthAwareCta {...PROPS} />).container);

    const hidden = loading.querySelector(".invisible");
    expect(hidden, "loading state must reserve the label with visibility:hidden").toBeTruthy();
    expect(hidden?.textContent).toBe("Sign in to Continue");
    // A fixed-width placeholder is what left 0.0566 CLS behind.
    expect(loading.className).not.toContain("w-24");
    expect(loading.innerHTML).not.toContain("w-32");
  });

  it("keeps the loading state out of the accessibility tree and tab order", () => {
    mockAuth = { user: null, isLoading: true };
    const loading = shellOf(render(<AuthAwareCta {...PROPS} />).container);

    expect(loading.getAttribute("aria-hidden")).toBe("true");
  });

  it("renders the action label when signed in, at the same box size", () => {
    mockAuth = { user: null, isLoading: false };
    const signedOut = shellOf(render(<AuthAwareCta {...PROPS} />).container);

    mockAuth = { user: { sub: "u1" }, isLoading: false };
    const signedIn = shellOf(render(<AuthAwareCta {...PROPS} />).container);

    expect(signedIn.className).toBe(signedOut.className);
    expect(signedIn.textContent).toContain("Go to dashboard");
  });
});
