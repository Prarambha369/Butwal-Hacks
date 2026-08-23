import { test, expect } from "@playwright/test";

/**
 * E2E tests for the proxy middleware's RBAC and subdomain routing.
 *
 * These tests verify that:
 *   1. Unauthenticated requests to /dashboard/* and /portal/* are redirected
 *      to the Auth0 sign-in page with the correct returnTo parameter.
 *   2. Public routes (/, /events, /blog, /p/...) return 200 for unauthenticated users.
 *   3. Unknown routes trigger the 404 page.
 *
 * The tests use the Playwright APIRequestContext with maxRedirects: 0 so we
 * can inspect the actual redirect response rather than following it.
 */

test.describe("Middleware — Auth Redirects (unauthenticated)", () => {
  test("/dashboard/hacker redirects to /auth/login with returnTo", async ({ request }) => {
    const response = await request.get("/dashboard/hacker", { maxRedirects: 0 });
    // Middleware issues a 307 redirect to /auth/login?returnTo=...
    expect(response.status()).toBe(307);
    const location = response.headers()["location"] || "";
    expect(location).toContain("/auth/login");
    expect(location).toContain("returnTo=");
    expect(location).toContain(encodeURIComponent("/dashboard/hacker"));
  });

  test("/dashboard/maintainer redirects to /auth/login with returnTo", async ({ request }) => {
    const response = await request.get("/dashboard/maintainer", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    const location = response.headers()["location"] || "";
    expect(location).toContain("/auth/login");
    expect(location).toContain(encodeURIComponent("/dashboard/maintainer"));
  });

  test("/dashboard/organizer redirects to /auth/login with returnTo", async ({ request }) => {
    const response = await request.get("/dashboard/organizer", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    const location = response.headers()["location"] || "";
    expect(location).toContain("/auth/login");
    expect(location).toContain(encodeURIComponent("/dashboard/organizer"));
  });

  test("/dashboard/hacker/profile redirects to /auth/login", async ({ request }) => {
    const response = await request.get("/dashboard/hacker/profile", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    const location = response.headers()["location"] || "";
    expect(location).toContain("/auth/login");
  });

  test("/dashboard/hacker/work redirects to /auth/login", async ({ request }) => {
    const response = await request.get("/dashboard/hacker/work", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    const location = response.headers()["location"] || "";
    expect(location).toContain("/auth/login");
  });

  test("/portal/sponsors redirects to /auth/login with returnTo", async ({ request }) => {
    const response = await request.get("/portal/sponsors", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    const location = response.headers()["location"] || "";
    expect(location).toContain("/auth/login");
    expect(location).toContain(encodeURIComponent("/portal/sponsors"));
  });
});

test.describe("Middleware — Orgs Auth Redirects", () => {
  test("/orgs/pokhara/dashboard redirects to /auth/login with returnTo", async ({ request }) => {
    const response = await request.get("/orgs/pokhara/dashboard", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    const location = response.headers()["location"] || "";
    expect(location).toContain("/auth/login");
    expect(location).toContain("returnTo=");
    expect(location).toContain(encodeURIComponent("/orgs/pokhara/dashboard"));
  });

  test("/orgs/kathmandu/events redirects to /auth/login", async ({ request }) => {
    const response = await request.get("/orgs/kathmandu/events", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    const location = response.headers()["location"] || "";
    expect(location).toContain("/auth/login");
  });

  test("/orgs/pokhara/members redirects to /auth/login", async ({ request }) => {
    const response = await request.get("/orgs/pokhara/members", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    const location = response.headers()["location"] || "";
    expect(location).toContain("/auth/login");
  });

  test("/orgs/chitwan/dashboard redirects to /auth/login", async ({ request }) => {
    const response = await request.get("/orgs/chitwan/dashboard", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    const location = response.headers()["location"] || "";
    expect(location).toContain("/auth/login");
  });
});

test.describe("Middleware — Public Routes (pass through)", () => {
  test("homepage returns 200", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("events index returns 200", async ({ page }) => {
    const response = await page.goto("/events");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("blog index returns 200", async ({ page }) => {
    const response = await page.goto("/blog");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("public profile page returns 200", async ({ page }) => {
    // This is a public route (MARKETING_PREFIX includes /p/)
    const response = await page.goto("/p/BH-26-F2ECCEFC");
    // Should be 200 (profile exists) or 404 (profile not found via notFound())
    // A 500 indicates a server crash, which should fail this test
    expect([200, 404]).toContain(response?.status());
  });

  test("transparency page returns 200", async ({ page }) => {
    const response = await page.goto("/transparency");
    expect(response?.status()).toBe(200);
  });

  test("gallery returns 200", async ({ page }) => {
    const response = await page.goto("/gallery");
    expect(response?.status()).toBe(200);
  });
});

test.describe("Middleware — 404 Handling", () => {
  test("unknown marketing route triggers 404", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page Not Found" })).toBeVisible();
  });

  test("unknown API route returns 404", async ({ request }) => {
    const response = await request.get("/api/nonexistent-endpoint");
    expect(response.status()).toBe(404);
  });
});
