import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The web app manifest.
 *
 * `layout.tsx` has declared `manifest: "/manifest.webmanifest"` all along,
 * but the file did not exist -- so the request 404'd and the PWA could not be
 * installed at all, while `public/sw.js` and the bottom-tab components sat in
 * the repo looking finished. These assertions exist because that combination
 * is invisible in a screenshot and in the build output: a missing static
 * manifest is not a build error.
 */

const publicDir = join(process.cwd(), "public");

type Manifest = {
  name: string;
  short_name: string;
  start_url: string;
  scope: string;
  display: string;
  theme_color: string;
  background_color: string;
  icons: Array<{ src: string; sizes: string; purpose?: string }>;
};

const manifestPath = join(publicDir, "manifest.webmanifest");

describe("web app manifest", () => {
  it("exists, because the root layout declares it", () => {
    expect(existsSync(manifestPath)).toBe(true);
    // And the declared path is the path that exists.
    const layout = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");
    expect(layout).toContain('"/manifest.webmanifest"');
  });

  it("is valid JSON with the fields installability requires", () => {
    const m = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
    expect(m.name).toBeTruthy();
    expect(m.short_name).toBeTruthy();
    expect(m.start_url).toBeTruthy();
    expect(m.display).toBe("standalone");
    expect(m.theme_color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("declares icons that actually exist on disk", () => {
    const m = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
    // A manifest pointing at missing icons still "works" and still fails to
    // install, so this is the assertion that matters.
    expect(m.icons.length).toBeGreaterThan(0);
    for (const icon of m.icons) {
      expect(existsSync(join(publicDir, icon.src))).toBe(true);
    }
    expect(
      m.icons.some((i) => i.sizes === "512x512" && i.purpose === "maskable"),
    ).toBe(true);
  });

  it("theme colour matches the viewport themeColor", () => {
    const m = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
    const layout = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");
    // A manifest and a viewport that disagree means the installed app chrome
    // changes colour the moment it launches.
    expect(layout).toContain(`themeColor: "${m.theme_color}"`);
  });
});
