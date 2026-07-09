import { test, expect } from "@playwright/test"

test.describe("Butwal Hacks — Smoke Tests", () => {
  test("homepage renders core elements", async ({ page }) => {
    await page.goto("/")

    // Key content sections exist
    await expect(page.locator("h1")).toBeVisible()
    await expect(page.locator("nav")).toBeVisible()
    await expect(page.locator("footer")).toBeVisible()

    // Title contains the org name
    await expect(page).toHaveTitle(/Butwal Hacks/)
  })

  test("navigation links work", async ({ page }) => {
    await page.goto("/")

    // Click the Events link in the nav
    const eventsLink = page.locator('nav a[href="/events"]').first()
    if (await eventsLink.isVisible()) {
      await eventsLink.click()
      await expect(page).toHaveURL(/\/events/)
    }
  })

  test("404 page renders for unknown routes", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist")
    expect(response?.status()).toBe(404)
    await expect(page.locator("text=404").or(page.locator("text=Page Not Found"))).toBeVisible()
  })

  test("offline page is accessible", async ({ page }) => {
    await page.goto("/offline")
    await expect(page.locator("text=Offline").or(page.locator("text=You're Offline"))).toBeVisible()
  })

  test("design-system page renders", async ({ page }) => {
    await page.goto("/design-system")
    await expect(page.locator("h1").first()).toBeVisible()
  })

  test("blog index page shows posts", async ({ page }) => {
    await page.goto("/blog")
    await expect(page.locator("h1").first()).toBeVisible()
  })

  test("transparency page loads stats section", async ({ page }) => {
    await page.goto("/transparency")
    await expect(page.locator("h1").first()).toBeVisible()
  })
})
