import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    // The RBAC and avatar specs assert real 307 redirects. Playwright runs
    // `next dev`, where a developer's `.env.local` could otherwise set
    // DEV_AUTH_BYPASS=true and hand the suite an open-access server. An empty
    // string here overrides whatever the environment says.
    env: { ...process.env, DEV_AUTH_BYPASS: "" },
    reuseExistingServer: true,
    timeout: 120000,
  },
});
