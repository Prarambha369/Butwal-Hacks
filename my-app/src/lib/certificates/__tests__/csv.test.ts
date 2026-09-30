import { describe, expect, it } from "vitest";
import { matchRoster, parseCsvLine, parseRosterCsv, toCsv } from "@/lib/certificates/csv";

describe("parseCsvLine", () => {
  it("splits plain fields", () => {
    expect(parseCsvLine("Asha,Bikram")).toEqual(["Asha", "Bikram"]);
  });

  it("keeps commas inside quoted fields", () => {
    expect(parseCsvLine('"Sharma, Asha",a@b.com')).toEqual(["Sharma, Asha", "a@b.com"]);
  });

  it("unescapes doubled quotes", () => {
    expect(parseCsvLine('"She said ""hi""",x')).toEqual(['She said "hi"', "x"]);
  });

  it("preserves empty fields rather than collapsing them", () => {
    expect(parseCsvLine("a,,c")).toEqual(["a", "", "c"]);
  });

  it("trims surrounding whitespace", () => {
    expect(parseCsvLine(" Asha , a@b.com ")).toEqual(["Asha", "a@b.com"]);
  });

  it("respects a semicolon delimiter", () => {
    expect(parseCsvLine("a;b", ";")).toEqual(["a", "b"]);
  });
});

describe("parseRosterCsv", () => {
  it("reads a conventional name,email roster", () => {
    const { rows, rejected } = parseRosterCsv("Name,Email\nAsha,asha@butwalhacks.com");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: "Asha", email: "asha@butwalhacks.com", line: 2 });
    expect(rejected).toEqual([]);
  });

  it("is case-insensitive and space-tolerant on headers", () => {
    const { rows } = parseRosterCsv("  Full Name , EMAIL ADDRESS \nAsha,a@b.com");
    expect(rows[0].name).toBe("Asha");
    expect(rows[0].email).toBe("a@b.com");
  });

  it("strips a UTF-8 BOM so the first header is still detected", () => {
    // Excel writes this. Without the strip, the first header becomes
    // "\uFEFFname", the name column is never found, and every row is
    // rejected as "missing name" with no obvious cause.
    const { rows, rejected } = parseRosterCsv("﻿Name,Email\nAsha,a@b.com");
    expect(rejected).toEqual([]);
    expect(rows[0].name).toBe("Asha");
  });

  it("lowercases emails so matching is case-insensitive", () => {
    const { rows } = parseRosterCsv("Name,Email\nAsha,Asha@ButwalHacks.COM");
    expect(rows[0].email).toBe("asha@butwalhacks.com");
  });

  it("preserves unclaimed columns as custom field values", () => {
    const { rows } = parseRosterCsv("Name,Email,Team,BH ID\nAsha,a@b.com,Codebreakers,BH-01");
    expect(rows[0].extra).toEqual({ team: "Codebreakers", bh_id: "BH-01" });
  });

  it("handles CRLF line endings", () => {
    const { rows } = parseRosterCsv("Name,Email\r\nAsha,a@b.com\r\nBikram,c@d.com");
    expect(rows).toHaveLength(2);
  });

  // ── Every bad row must be reported, never silently dropped ───────────────
  it("rejects rows with an invalid email and says why", () => {
    const { rows, rejected } = parseRosterCsv("Name,Email\nAsha,not-an-email");
    expect(rows).toEqual([]);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toMatch(/invalid email/);
    expect(rejected[0].line).toBe(2);
  });

  it("rejects a missing name and a missing email separately", () => {
    const { rejected } = parseRosterCsv("Name,Email\n,a@b.com\nAsha,");
    expect(rejected.map((r) => r.reason)).toEqual(["missing name", "missing email"]);
  });

  it("reports the true source line number after blank lines", () => {
    const { rejected } = parseRosterCsv("Name,Email\nAsha,a@b.com\n\n\nBad,row");
    expect(rejected[0].line).toBe(5);
  });

  it("never loses a row: accepted + rejected === data lines", () => {
    const input = [
      "Name,Email",
      "Asha,a@b.com",
      ",b@c.com",
      "Bad,not-an-email",
      "Dipa,d@e.com",
      "Noid,no-email.com",
    ].join("\n");
    const { rows, rejected } = parseRosterCsv(input);
    expect(rows.length + rejected.length).toBe(5);
  });

  it("returns empty results for empty input", () => {
    expect(parseRosterCsv("")).toEqual({ rows: [], rejected: [], headers: [] });
    expect(parseRosterCsv("   \n  \n").rows).toEqual([]);
  });

  it("falls back to positional name,email with no header row", () => {
    const { rows } = parseRosterCsv("Asha,a@b.com\nBikram,c@d.com", { hasHeader: false });
    expect(rows.map((r) => r.name)).toEqual(["Asha", "Bikram"]);
  });
});

describe("matchRoster", () => {
  const rows = parseRosterCsv(
    "Name,Email\n" +
      "Asha,asha@x.com\n" +
      "Bikram,bikram@x.com\n" +
      "Dup,dup@x.com\n" +
      "DupAgain,dup@x.com\n" +
      "HasCert,cert@x.com\n" +
      "Ghost,ghost@nowhere.com",
  ).rows;

  const candidates = new Map([
    ["asha@x.com", { profileId: "p1", bhId: "BH-01", hasCertificate: false }],
    ["bikram@x.com", { profileId: "p2", bhId: "BH-02", hasCertificate: false }],
    ["dup@x.com", { profileId: "p3", bhId: "BH-03", hasCertificate: false }],
    ["cert@x.com", { profileId: "p4", bhId: "BH-04", hasCertificate: true }],
  ]);

  const result = matchRoster(rows, candidates);

  it("matches known addresses to their profile", () => {
    expect(result.matched.map((r) => r.name)).toEqual(["Asha", "Bikram", "Dup"]);
    expect(result.matched[0]).toMatchObject({ profileId: "p1", bhId: "BH-01" });
  });

  it("separates duplicates from first occurrences", () => {
    expect(result.duplicate.map((r) => r.name)).toEqual(["DupAgain"]);
  });

  it("separates rows that already have a certificate", () => {
    expect(result.alreadyIssued.map((r) => r.name)).toEqual(["HasCert"]);
  });

  it("reports addresses with no profile rather than inventing one", () => {
    expect(result.unmatched.map((r) => r.name)).toEqual(["Ghost"]);
  });

  it("accounts for every row in exactly one bucket", () => {
    const total =
      result.matched.length +
      result.duplicate.length +
      result.alreadyIssued.length +
      result.unmatched.length;
    expect(total).toBe(rows.length);
  });

  it("matches case-insensitively via a pre-lowercased candidate key", () => {
    const r = matchRoster(parseRosterCsv("Name,Email\nAsha,ASHA@X.COM").rows, candidates);
    expect(r.matched).toHaveLength(1);
  });

  it("reports every row as unmatched when nothing is known, still separating duplicates", () => {
    const r = matchRoster(rows, new Map());
    expect(r.matched).toEqual([]);
    // Duplicates are detected from the file alone, so they are separated even
    // when no row can be matched. Everything still lands in exactly one bucket.
    expect(r.duplicate).toHaveLength(1);
    expect(r.unmatched).toHaveLength(rows.length - 1);
  });
});

describe("toCsv", () => {
  it("emits a header and one line per row", () => {
    expect(toCsv([{ name: "Asha", status: "sent" }])).toBe("name,status\nAsha,sent");
  });

  it("quotes values containing commas, quotes or newlines", () => {
    expect(toCsv([{ n: "a,b" }])).toBe('n\n"a,b"');
    expect(toCsv([{ n: 'say "hi"' }])).toBe('n\n"say ""hi"""');
    expect(toCsv([{ n: "a\nb" }])).toBe('n\n"a\nb"');
  });

  it("renders null as an empty field", () => {
    expect(toCsv([{ a: null, b: "x" }])).toBe("a,b\n,x");
  });

  it("returns an empty string for no rows", () => {
    expect(toCsv([])).toBe("");
  });
});
