import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {} }),
  usePathname: () => "/events/cyberutsav-lumbini",
}));
vi.mock("@/components/auth-user-provider", () => ({
  useAuthUser: () => ({ user: null, isLoading: false }),
}));

import EventDetailContent from "@/components/events/event-detail-content";
import { EventCard } from "@/components/events/event-card";

const base = {
  id: "e1",
  title: "CyberUtsav Lumbini",
  description: "A hackathon.",
  start_date: "2027-01-15T03:15:00Z",
  end_date: "2027-01-17T12:15:00Z",
  location: "Butwal",
  banner_url: null,
};
const NOW = Date.parse("2026-11-28T00:00:00Z");
const EXTERNAL = /<a[^>]*href="https:\/\/registration\.cyberutsav\.com\/butwal"[^>]*>/g;

// The static export ships whatever the server renders. The CyberUtsav CTA must
// be in that HTML (not resolved later on the client), open in a new tab, and
// never route through the app's sign-in, which maintenance mode rewrites.
describe("partner registration in server HTML", () => {
  it("event page renders the external Register link for CyberUtsav", () => {
    const html = renderToStaticMarkup(<EventDetailContent event={{ ...base, slug: "cyberutsav-lumbini" }} />);
    const links = html.match(EXTERNAL) ?? [];
    expect(links.length).toBeGreaterThanOrEqual(2); // hero + sticky bar
    for (const a of links) {
      expect(a).toContain('target="_blank"');
      expect(a).toContain('rel="noopener noreferrer"');
    }
    expect(html).not.toContain("/sign-in");
    expect(html).not.toContain("cyberutsavlumbini.butwalhacks.com");
  });

  it("other events keep in-site registration", () => {
    const html = renderToStaticMarkup(<EventDetailContent event={{ ...base, slug: "hackday-butwal" }} />);
    expect(html).not.toContain("registration.cyberutsav.com");
  });

  it("the /events card links straight out", () => {
    const html = renderToStaticMarkup(<EventCard event={{ ...base, slug: "cyberutsav-lumbini" }} now={NOW} />);
    const [a] = html.match(EXTERNAL) ?? [];
    expect(a).toBeDefined();
    expect(a).toContain('target="_blank"');
    expect(a).toContain('rel="noopener noreferrer"');
  });
});
