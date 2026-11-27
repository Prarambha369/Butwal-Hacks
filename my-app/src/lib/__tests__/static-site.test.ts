import { describe, expect, it } from "vitest";
import {
  APP_PREFIXES,
  isAppPath,
  staticHeadersFile,
  staticRedirectsFile,
  staticSiteCsp,
  STATIC_EXCLUDED_ROUTE_DIRS,
} from "../static-site";
import { SITE_REDIRECTS } from "../site-redirects";

const APP = "https://app.example.test";

describe("isAppPath", () => {
  it("sends auth, dashboards, API and user-edited pages to the app", () => {
    for (const p of [
      "/api/health",
      "/auth/login",
      "/sign-in",
      "/dashboard",
      "/dashboard/hacker",
      "/portal/sponsors",
      "/orgs/pokhara",
      "/claim/abc",
      "/calendar",
      "/p/bh-123",
      "/sponsor/xyz",
      "/verify/m1",
      "/widget/bh-1",
      "/projects/42",
      "/projects/impact/42",
      "/teams",
      "/teams/7",
      "/teams/create",
      "/transparency",
    ]) {
      expect(isAppPath(p), p).toBe(true);
    }
  });

  it("keeps marketing pages and look-alikes on the static site", () => {
    for (const p of ["/", "/events", "/events/hackfest", "/gallery/1", "/projects", "/teamsters", "/apis", "/dashboards", "/policies/privacy"]) {
      expect(isAppPath(p), p).toBe(false);
    }
  });
});

describe("staticRedirectsFile", () => {
  const file = staticRedirectsFile(APP);
  const rules = file.split("\n").filter((l) => l && !l.startsWith("#"));

  it("keeps every consolidation redirect as a 308", () => {
    for (const r of SITE_REDIRECTS) expect(rules).toContain(`${r.source} ${r.destination} 308`);
  });

  it("sends app paths to the app origin, keeping the method for /api", () => {
    expect(rules).toContain(`/api/* ${APP}/api/:splat 307`);
    expect(rules).toContain(`/sign-in ${APP}/sign-in 302`);
    expect(rules).toContain(`/dashboard/* ${APP}/dashboard/:splat 302`);
    expect(rules).toContain(`/projects/:id ${APP}/projects/:id 302`);
  });

  it("covers every app prefix and stays inside the Workers redirect limits", () => {
    for (const p of APP_PREFIXES) expect(rules.some((r) => r.startsWith(`${p} `))).toBe(true);
    const dynamic = rules.filter((r) => r.includes("*") || r.includes(":"));
    expect(dynamic.length).toBeLessThanOrEqual(100);
    expect(rules.length).toBeLessThanOrEqual(2100);
  });
});

describe("staticRedirectsFile during app maintenance", () => {
  const rules = staticRedirectsFile(APP, { maintenance: true })
    .split("\n")
    .filter((l) => l && !l.startsWith("#"));

  it("never sends a visitor to the app origin", () => {
    expect(rules.some((r) => r.includes(APP))).toBe(false);
  });

  it("serves the maintenance page in place for every app path", () => {
    for (const p of APP_PREFIXES) {
      expect(rules).toContain(`${p} /maintenance 200`);
      expect(rules).toContain(`${p}/* /maintenance 200`);
    }
    expect(rules).toContain("/projects/:id /maintenance 200");
  });

  it("keeps the consolidation redirects", () => {
    for (const r of SITE_REDIRECTS) expect(rules).toContain(`${r.source} ${r.destination} 308`);
  });
});

describe("staticHeadersFile", () => {
  it("applies the security headers to every path and reports CSP to the app", () => {
    const file = staticHeadersFile({ appOrigin: APP });
    expect(file).toContain("/*\n  Strict-Transport-Security:");
    expect(file).toContain(`report-uri ${APP}/api/csp-violation`);
    expect(file).toContain(`Reporting-Endpoints: csp-endpoint="${APP}/api/csp-violation"`);
    expect(file).toContain("/_next/static/*\n  Cache-Control: public, max-age=31536000, immutable");
    expect(file).not.toContain("X-Robots-Tag");
  });

  it("marks previews noindex and keeps every line under 2,000 characters", () => {
    const file = staticHeadersFile({ appOrigin: APP, noindex: true });
    expect(file).toContain("X-Robots-Tag: noindex");
    for (const line of file.split("\n")) expect(line.length).toBeLessThanOrEqual(2000);
  });

  it("lets forms post to the app", () => {
    expect(staticSiteCsp(APP)).toContain(`form-action 'self' ${APP}`);
  });
});

describe("STATIC_EXCLUDED_ROUTE_DIRS", () => {
  it("leaves every app section out of the static export", () => {
    for (const dir of ["api", "(main)/dashboard", "(main)/portal", "(auth)", "p", "verify", "widget"]) {
      expect(STATIC_EXCLUDED_ROUTE_DIRS).toContain(dir);
    }
  });
});
