#!/usr/bin/env node

/**
 * Auth0 M2M CI Verification Script
 *
 * Verifies that the Auth0 Machine-to-Machine (M2M) application
 * for the CI pipeline is properly configured and can obtain a
 * Management API access token.
 *
 * Usage:
 *   node scripts/verify-auth0-m2m.mjs
 *
 * Environment variables required:
 *   AUTH0_M2M_CLIENT_ID     — Client ID of the Butwal Hacks CI M2M app
 *   AUTH0_M2M_CLIENT_SECRET — Client Secret of the Butwal Hacks CI M2M app
 *   AUTH0_DOMAIN            — Auth0 tenant domain (e.g., butwal.jp.auth0.com)
 *
 * Exit codes:
 *   0 — All checks passed
 *   1 — Missing environment variables
 *   2 — Token request failed
 *   3 — Management API verification failed
 */

const REQUIRED_ENV_VARS = ["AUTH0_M2M_CLIENT_ID", "AUTH0_M2M_CLIENT_SECRET", "AUTH0_DOMAIN"];

function checkEnv() {
  const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(", ")}`);
    console.error("");
    console.error("To set them up in your local environment:");
    console.error("  export AUTH0_M2M_CLIENT_ID=<your-m2m-client-id>");
    console.error("  export AUTH0_M2M_CLIENT_SECRET=<your-m2m-client-secret>");
    console.error("  export AUTH0_DOMAIN=butwal.jp.auth0.com");
    console.error("");
    console.error("In GitHub Actions, add these as repository secrets:");
    console.error("  https://github.com/Prarambha369/Butwal-Hacks/settings/secrets/actions");
    process.exit(1);
  }
}

async function getManagementToken() {
  const { AUTH0_M2M_CLIENT_ID, AUTH0_M2M_CLIENT_SECRET, AUTH0_DOMAIN } = process.env;
  const audience = `https://${AUTH0_DOMAIN}/api/v2/`;

  console.log(`🔑 Requesting Management API token from ${AUTH0_DOMAIN}...`);

  const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: AUTH0_M2M_CLIENT_ID,
      client_secret: AUTH0_M2M_CLIENT_SECRET,
      audience,
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`❌ Token request failed (HTTP ${response.status}): ${body}`);
    process.exit(2);
  }

  const data = await response.json();

  if (!data.access_token) {
    console.error(`❌ Token response missing access_token: ${JSON.stringify(data)}`);
    process.exit(2);
  }

  console.log(`✅ Management API token obtained (${data.token_type}, expires in ${data.expires_in}s)`);
  return data.access_token;
}

async function verifyToken(token) {
  const { AUTH0_DOMAIN } = process.env;
  const audience = `https://${AUTH0_DOMAIN}/api/v2/`;

  console.log(`🔍 Verifying token against Management API...`);

  // Fetch first page of clients to verify the token works
  const response = await fetch(`${audience}clients?per_page=50&page=0`, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`❌ Management API verification failed (HTTP ${response.status}): ${body}`);
    process.exit(3);
  }

  const clients = await response.json();
  console.log(`✅ Management API accessible — found ${clients.length} client(s) on first page`);

  const ciApp = clients.find(
    (c) => c.name === "Butwal Hacks CI" || c.name.includes("CI")
  );

  if (ciApp) {
    console.log(`✅ Found M2M CI app: "${ciApp.name}" (${ciApp.client_id})`);
  } else {
    console.warn(
      `⚠️  No app named "Butwal Hacks CI" found in first 50 clients. ` +
      `Make sure you've created it in the Auth0 Dashboard.`
    );
  }

}

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  Auth0 M2M CI Verification");
  console.log("═══════════════════════════════════════════\n");

  checkEnv();
  const token = await getManagementToken();
  await verifyToken(token);

  console.log("\n✅ All M2M checks passed!");
  console.log("═══════════════════════════════════════════\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Unexpected error:", err);
  process.exit(1);
});
