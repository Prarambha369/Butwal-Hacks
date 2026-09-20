// @vitest-environment happy-dom

import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import ExcuseGenerator, { EXCUSE_COUNT } from "@/components/home/excuse-generator";
import { LanguageProvider } from "@/components/language-provider";
import { t } from "@/lib/i18n";

afterEach(() => {
  cleanup();
});

function renderDefault() {
  return render(
    <LanguageProvider>
      <ExcuseGenerator />
    </LanguageProvider>
  );
}

describe("ExcuseGenerator", () => {
  it("renders the heading and the first excuse", () => {
    renderDefault();
    expect(screen.getByText("Need a reason to skip?")).toBeInTheDocument();
    expect(screen.getByText("Give me an excuse")).toBeInTheDocument();
    // First excuse shows by default
    expect(
      screen.getByText(/My code finally works/, { exact: false })
    ).toBeInTheDocument();
  });

  it("rolls a different excuse when the button is pressed", () => {
    renderDefault();
    const button = screen.getByText("Give me an excuse");
    const before = screen.getByText(/“.*”/).textContent;
    fireEvent.click(button);
    const after = screen.getByText(/“.*”/).textContent;
    // Roll guarantees a different index (wraps when the same is drawn)
    expect(after).not.toBe(before);
  });

  it("always shows the honest kicker", () => {
    renderDefault();
    expect(
      screen.getByText(/your excuse will not hold up in the group chat/)
    ).toBeInTheDocument();
  });

  it("has full Nepali coverage for every excuse", () => {
    expect(EXCUSE_COUNT).toBe(10);
    const uiKeys = [
      "home.excuses.badge",
      "home.excuses.title",
      "home.excuses.subtitle",
      "home.excuses.button",
      "home.excuses.kicker",
    ];
    for (const key of uiKeys) {
      expect(t(key, "en")).not.toBe(key);
      expect(t(key, "ne")).not.toBe(key);
      expect(t(key, "ne")).not.toBe(t(key, "en"));
    }
    for (let i = 1; i <= EXCUSE_COUNT; i++) {
      const key = `home.excuses.${i}`;
      expect(t(key, "en")).not.toBe(key);
      expect(t(key, "ne")).not.toBe(key);
      expect(t(key, "ne")).not.toBe(t(key, "en"));
    }
  });
});
