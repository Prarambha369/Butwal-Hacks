import { test as base, expect, type Page } from "@playwright/test";

/**
 * Shared Playwright fixtures.
 *
 * Specs should import `test` and `expect` from here rather than from
 * `@playwright/test` directly, so they pick up the error capture below.
 */

/**
 * Record uncaught browser errors and log them as they happen.
 *
 * Playwright does NOT fail a test for uncaught page errors by default. A
 * Server Components render error like React #441 ("An error occurred in the
 * Server Components render... A `digest` property is included") blanks the
 * page while the assertions that follow still pass, which is how it stayed
 * hidden for so long.
 *
 * This deliberately does NOT fail the test on its own. Some flows produce
 * benign errors (aborted fetches, extension noise), and flipping pass/fail
 * without being able to run the full authenticated suite here would be a blind
 * change. Instead the errors are logged live and attached to the test result,
 * so a puzzling pass still shows them.
 *
 * @returns the live array of recorded messages.
 */
function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];

  page.on("pageerror", (error) => {
    // `stack` carries the RSC digest, which is what correlates this browser
    // error back to the server-side throw in Sentry.
    const detail = error.stack || error.message;
    errors.push(detail);
    console.error(`[pageerror] ${detail}`);
  });

  return errors;
}

export const test = base.extend<{ page: Page }>({
  // The second parameter is Playwright's continuation callback, conventionally
  // named `use` -- but the react-hooks lint rule flags any identifier starting
  // with "use" inside a non-component function, so it is bound as `withPage`.
  page: async ({ page }, withPage, testInfo) => {
    const errors = collectPageErrors(page);
    await withPage(page);

    if (errors.length > 0) {
      testInfo.annotations.push({
        type: "pageerror",
        description:
          `${errors.length} uncaught browser error(s):\n${errors.join("\n")}`,
      });
    }
  },
});

export { expect };
