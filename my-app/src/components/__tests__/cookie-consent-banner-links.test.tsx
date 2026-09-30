// @vitest-environment happy-dom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CookieConsentBanner from "@/components/cookie-consent-banner";

/**
 * Lighthouse flagged both cookie-banner links under
 * "Links do not have descriptive text":
 *
 *   /cookie-policy — "Learn more"
 *
 * The link text repeated the generic "Learn more" on a page that already
 * uses it for real content, so neither a screen-reader user nor a crawler
 * could tell where the link went. The visible text now names the
 * destination, which is also what makes the link useful out of context
 * (link lists, search results, and AI crawlers all read it standalone).
 */
const NON_DESCRIPTIVE = [
  "learn more",
  "read more",
  "click here",
  "here",
  "this",
  "more",
  "link",
  "read this",
];

/** Link text with whitespace collapsed, lowercased, punctuation stripped. */
function normalize(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase().replace(/[.!?,]+$/, "");
}

let banner: HTMLElement;

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  banner = render(<CookieConsentBanner />).container;
  // The banner waits 800ms before sliding in; the resulting state update has
  // to be flushed inside act() or React never re-renders.
  act(() => {
    vi.advanceTimersByTime(1000);
  });
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe("CookieConsentBanner link text", () => {
  it("shows the banner once consent is undecided", () => {
    expect(screen.getByText("This site uses cookies")).toBeTruthy();
  });

  it("names the cookie policy instead of saying 'Learn more'", () => {
    const links = Array.from(banner.querySelectorAll('a[href="/cookie-policy"]'));
    expect(links.length, "both responsive variants link the policy").toBe(2);

    for (const link of links) {
      expect(normalize(link.textContent ?? "")).toBe("cookie policy");
    }
  });

  it("uses no generic link text anywhere in the banner", () => {
    for (const a of Array.from(banner.querySelectorAll("a"))) {
      const text = normalize(a.textContent ?? "");
      expect(NON_DESCRIPTIVE, `generic link text: "${text}"`).not.toContain(text);
    }
  });

  it("keeps decorative icons out of the accessibility tree", () => {
    const icons = banner.querySelectorAll('a[href="/cookie-policy"] svg');
    expect(icons.length).toBe(2);
    for (const svg of Array.from(icons)) {
      expect(svg.closest("[aria-hidden='true']")).not.toBeNull();
    }
  });
});

describe("hasCookieConsent", () => {
  it("is false without a stored decision", async () => {
    const { hasCookieConsent } = await import("@/components/cookie-consent-banner");
    expect(hasCookieConsent()).toBe(false);
  });

  it("is true once granted", () => {
    localStorage.setItem("bh:cookie-consent", "granted");
    // Imported lazily above; read the value through a fresh call.
    return import("@/components/cookie-consent-banner").then(({ hasCookieConsent }) => {
      expect(hasCookieConsent()).toBe(true);
    });
  });

  it("is false when denied", () => {
    localStorage.setItem("bh:cookie-consent", "denied");
    return import("@/components/cookie-consent-banner").then(({ hasCookieConsent }) => {
      expect(hasCookieConsent()).toBe(false);
    });
  });
});
