import { describe, expect, it } from "vitest";
import {
  dedupeEmails,
  domainsIn,
  emailMatchesDomain,
  filterByDomain,
} from "@/lib/certificates/email-filter";

/**
 * The dot boundary is the security property here.
 *
 * A naive `email.endsWith(domain)` treats "notbutwalhacks.com" as a subdomain
 * of "butwalhacks.com". A bulk-send filter built that way would hand one
 * organiser's roster — every address, every name, every issued certificate —
 * to a domain the organiser does not own.
 */

describe("emailMatchesDomain", () => {
  it("matches the exact domain", () => {
    expect(emailMatchesDomain("a@butwalhacks.com", "butwalhacks.com")).toBe(true);
  });

  it("matches a direct subdomain", () => {
    expect(emailMatchesDomain("a@mail.butwalhacks.com", "butwalhacks.com")).toBe(true);
  });

  it("matches a deeply nested subdomain", () => {
    expect(emailMatchesDomain("a@x.y.butwalhacks.com", "butwalhacks.com")).toBe(true);
  });

  it("is case-insensitive on both sides", () => {
    expect(emailMatchesDomain("A@Mail.ButwalHacks.COM", "butwalhacks.com")).toBe(true);
    expect(emailMatchesDomain("a@butwalhacks.com", "BUTWALHACKS.COM")).toBe(true);
  });

  it("accepts a pasted email, a leading @, a URL, and a www prefix as the target", () => {
    expect(emailMatchesDomain("a@butwalhacks.com", "someone@butwalhacks.com")).toBe(true);
    expect(emailMatchesDomain("a@butwalhacks.com", "@butwalhacks.com")).toBe(true);
    expect(emailMatchesDomain("a@butwalhacks.com", "https://butwalhacks.com/x")).toBe(true);
    expect(emailMatchesDomain("a@butwalhacks.com", "www.butwalhacks.com")).toBe(true);
  });

  it("tolerates trailing dots on the email domain", () => {
    expect(emailMatchesDomain("a@butwalhacks.com.", "butwalhacks.com")).toBe(true);
  });

  // ── The cases a substring match gets wrong ──────────────────────────────
  it("does NOT match a domain that merely ends with the same letters", () => {
    expect(emailMatchesDomain("a@notbutwalhacks.com", "butwalhacks.com")).toBe(false);
    expect(emailMatchesDomain("a@evilbutwalhacks.com", "butwalhacks.com")).toBe(false);
  });

  it("does NOT match when the target domain is a prefix of the email domain", () => {
    expect(emailMatchesDomain("a@butwalhacks.com.evil.test", "butwalhacks.com")).toBe(false);
  });

  it("does NOT match a parent domain when a subdomain is targeted", () => {
    expect(emailMatchesDomain("a@butwalhacks.com", "mail.butwalhacks.com")).toBe(false);
  });

  it("rejects malformed input instead of throwing", () => {
    expect(emailMatchesDomain("", "butwalhacks.com")).toBe(false);
    expect(emailMatchesDomain("no-at-sign", "butwalhacks.com")).toBe(false);
    expect(emailMatchesDomain("@butwalhacks.com", "butwalhacks.com")).toBe(false);
    expect(emailMatchesDomain("a@butwalhacks.com", "")).toBe(false);
    expect(emailMatchesDomain("a@butwalhacks.com", "   ")).toBe(false);
  });

  it("restricts to exact matches when subdomains are disabled", () => {
    const opts = { subdomains: false };
    expect(emailMatchesDomain("a@butwalhacks.com", "butwalhacks.com", opts)).toBe(true);
    expect(emailMatchesDomain("a@mail.butwalhacks.com", "butwalhacks.com", opts)).toBe(false);
  });
});

describe("filterByDomain", () => {
  const roster = [
    { name: "Asha", email: "asha@butwalhacks.com" },
    { name: "Bikram", email: "bikram@mail.butwalhacks.com" },
    { name: "Chandra", email: "chandra@notbutwalhacks.com" },
    { name: "Dipa", email: "dipa@gmail.com" },
    { name: "Eshal", email: null },
    { name: "F", email: "" },
  ];

  it("splits matches from non-matches and preserves order", () => {
    const { matched, unmatched } = filterByDomain(roster, "butwalhacks.com");
    expect(matched.map((r) => r.name)).toEqual(["Asha", "Bikram"]);
    expect(unmatched.map((r) => r.name)).toEqual(["Chandra", "Dipa", "Eshal", "F"]);
  });

  it("never lets a null or empty email through", () => {
    const { matched } = filterByDomain(roster, "butwalhacks.com");
    expect(matched.every((r) => Boolean(r.email))).toBe(true);
  });

  it("excludes subdomains when asked", () => {
    const { matched } = filterByDomain(roster, "butwalhacks.com", { subdomains: false });
    expect(matched.map((r) => r.name)).toEqual(["Asha"]);
  });

  it("returns empty lists for an empty roster", () => {
    expect(filterByDomain([], "butwalhacks.com")).toEqual({ matched: [], unmatched: [] });
  });
});

describe("dedupeEmails", () => {
  it("collapses case and whitespace variants of the same address", () => {
    const out = dedupeEmails([
      { email: "Asha@ButwalHacks.com" },
      { email: "asha@butwalhacks.com" },
      { email: "  asha@butwalhacks.com  " },
      { email: "bikram@butwalhacks.com" },
    ]);
    expect(out).toHaveLength(2);
    expect(out[0].email).toBe("Asha@ButwalHacks.com");
  });

  it("drops rows with a blank email", () => {
    expect(dedupeEmails([{ email: "  " }, { email: "" }])).toEqual([]);
  });
});

describe("domainsIn", () => {
  it("lists distinct domains sorted", () => {
    expect(
      domainsIn([
        { email: "a@gmail.com" },
        { email: "b@butwalhacks.com" },
        { email: "c@GMAIL.com" },
        { email: "d@mail.butwalhacks.com" },
        { email: "no-at" },
        { email: null },
      ]),
    ).toEqual(["butwalhacks.com", "gmail.com", "mail.butwalhacks.com"]);
  });
});

describe("normalising pasted domain input", () => {
  // Organisers paste domains out of a spreadsheet or a browser bar, so the
  // parser has to survive every shape that produces.
  it.each([
    ["https://butwalhacks.com", true],
    ["http://www.butwalhacks.com/?x=1", true],
    ["BUTWALHACKS.COM", true],
    ["  butwalhacks.com  ", true],
    ["...butwalhacks.com...", true],
    ["@butwalhacks.com.", true],
    ["someone@butwalhacks.com", true],
    ["notbutwalhacks.com", false],
    ["butwalhacks.com.evil.test", false],
    ["", false],
  ])("%s -> %s", (input, expected) => {
    expect(emailMatchesDomain("a@butwalhacks.com", input)).toBe(expected);
  });

  it("matches a subdomain email against a pasted https://www URL", () => {
    expect(emailMatchesDomain("a@mail.butwalhacks.com", "https://www.butwalhacks.com")).toBe(true);
  });
});
