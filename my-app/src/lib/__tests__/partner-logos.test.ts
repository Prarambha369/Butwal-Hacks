import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { partnerLogoFor } from "@/lib/partner-logos";

describe("partnerLogoFor", () => {
  it("matches on hostname, ignoring www and path", () => {
    expect(partnerLogoFor("https://www.mlh.com/")?.light).toBe("/partners/mlh-color.svg");
    expect(partnerLogoFor("https://mlh.io/seasons")?.dark).toBe("/partners/mlh-white.svg");
    expect(partnerLogoFor("https://education.github.com/pack")?.dark).toBe(
      "/partners/github-invertocat-white.svg",
    );
  });

  it("returns null for unknown, empty or malformed links", () => {
    expect(partnerLogoFor("https://example.com/")).toBeNull();
    expect(partnerLogoFor(null)).toBeNull();
    expect(partnerLogoFor("not a url")).toBeNull();
  });

  it("points only at files that exist in public/", () => {
    const hosts = [
      "the.hackfoundation.org",
      "education.github.com",
      "mlh.com",
      "jukeboxprint.com",
      "lumbini.nepalpolice.gov.np",
      "tilottamamun.gov.np",
      "lumbinilions.com.np",
    ];
    for (const host of hosts) {
      const logo = partnerLogoFor(`https://${host}/`);
      expect(logo, host).not.toBeNull();
      for (const file of [logo!.light, logo!.dark].filter(Boolean) as string[]) {
        expect(existsSync(join(process.cwd(), "public", file)), file).toBe(true);
      }
    }
  });
});
