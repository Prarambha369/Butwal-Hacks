// @vitest-environment happy-dom

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const content = {
  "hero.title": { en: "Edited title", ne: "शीर्षक" },
  "hero.subtext": null,
};
const fetchMock = vi.fn(async (_url: string) => new Response(JSON.stringify(content), { status: 200 }));
vi.stubGlobal("fetch", fetchMock);

vi.mock("@/components/language-provider", () => ({ useLanguage: () => ({ locale: "en" }) }));
vi.mock("@/lib/i18n", () => ({ t: (key: string) => `fallback:${key}` }));

import { useSiteContent } from "../site-content";

function Show({ k }: { k: string }) {
  return <p>{useSiteContent(k, `home.${k}`)}</p>;
}

describe("useSiteContent", () => {
  it("sends one request for every key on the page and keeps fallbacks for unedited keys", async () => {
    render(
      <>
        <Show k="hero.title" />
        <Show k="hero.subtext" />
        <Show k="contact.final.title" />
        <Show k="contact.final.subtitle" />
      </>,
    );
    await waitFor(() => expect(screen.getByText("Edited title")).toBeInTheDocument());
    expect(screen.getByText("fallback:home.hero.subtext")).toBeInTheDocument();
    expect(screen.getByText("fallback:home.contact.final.title")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/site-content");

    // A later mount (a client navigation back) reuses the same response.
    render(<Show k="hero.title" />);
    await waitFor(() => expect(screen.getAllByText("Edited title")).toHaveLength(2));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
