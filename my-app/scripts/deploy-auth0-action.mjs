#!/usr/bin/env node

/**
 * Auth0 Action Deploy Script
 *
 * Deploys the "Sync to Supabase" Post-Login Action via the Auth0 Management API.
 * Creates the Action if it doesn't exist, otherwise updates and deploys it.
 *
 * Usage:
 *   node scripts/deploy-auth0-action.mjs
 *
 * Environment variables required:
 *   AUTH0_DOMAIN            — Auth0 tenant domain (e.g., auth.butwalhacks.com)
 *   AUTH0_CLIENT_ID         — Client ID of your Regular Web Application (for Management API token)
 *   AUTH0_CLIENT_SECRET     — Client Secret of your Regular Web Application
 *
 * Optional:
 *   AUTH0_MGMT_API_TOKEN   — Skip token exchange, use this Management API token directly
 *
 * Exit codes:
 *   0 — Action deployed successfully
 *   1 — Missing environment variables
 *   2 — Token request failed
 *   3 — Action create/update failed
 *   4 — Action deploy failed
 */

const REQUIRED_ENV_VARS = ["AUTH0_DOMAIN", "AUTH0_CLIENT_ID", "AUTH0_CLIENT_SECRET"];

// ── The Post-Login Action code ──────────────────────────────────
// This Action syncs Auth0 user data (and Auth0 Roles) to Supabase.
// When Auth0 Roles are assigned to a user via the Auth0 Dashboard,
// they are read from event.user.roles and passed to the webhook.
const ACTION_CODE = `exports.onExecutePostLogin = async (event, api) => {
  const baseUrl = event.secrets.BASE_URL || 'https://butwalhacks.com';
  const webhookSecret = event.secrets.AUTH0_WEBHOOK_SECRET;

  const headers = { 'Content-Type': 'application/json' };

  if (webhookSecret) {
    headers['X-Webhook-Secret'] = webhookSecret;
  }

  // Read Auth0 Roles assigned to this user via Auth0 Dashboard → User Management → Roles.
  // event.user.roles is populated when the Auth0 Roles feature is enabled.
  const auth0Roles = event.user.roles || [];

  try {
    const response = await fetch(\`\${baseUrl}/api/webhooks/auth0\`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sub: event.user.user_id,
        email: event.user.email,
        name: event.user.name || event.user.nickname || event.user.given_name || '',
        auth0_roles: auth0Roles,
      }),
    });

    if (!response.ok) {
      console.error(
        \`[auth0-action] Webhook returned \${response.status}: \${await response.text()}\`
      );
    }
  } catch (err) {
    console.error('[auth0-action] Failed to call webhook:', err instanceof Error ? err.message : String(err));
  }
};`;

function checkEnv() {
  const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error(`❌ Missing required env vars: ${missing.join(", ")}`);
    console.error("");
    console.error("  export AUTH0_DOMAIN=auth.butwalhacks.com");
    console.error("  export AUTH0_CLIENT_ID=<your-app-client-id>");
    console.error("  export AUTH0_CLIENT_SECRET=<your-app-client-secret>");
    process.exit(1);
  }
}

async function getManagementToken() {
  if (process.env.AUTH0_MGMT_API_TOKEN) {
    console.log("🔑 Using provided Management API token");
    return process.env.AUTH0_MGMT_API_TOKEN;
  }

  const { AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET } = process.env;
  const audience = `https://${AUTH0_DOMAIN}/api/v2/`;

  console.log(`🔑 Requesting Management API token from ${AUTH0_DOMAIN}...`);

  const res = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: AUTH0_CLIENT_ID,
      client_secret: AUTH0_CLIENT_SECRET,
      audience,
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`❌ Token request failed (HTTP ${res.status}): ${body}`);
    process.exit(2);
  }

  const data = await res.json();
  if (!data.access_token) {
    console.error(`❌ Token response missing access_token`);
    process.exit(2);
  }

  console.log(`✅ Management API token obtained (expires in ${data.expires_in}s)`);
  return data.access_token;
}

async function findOrCreateAction(token, domain) {
  const apiUrl = `https://${domain}/api/v2/actions/actions`;
  const actionName = "Sync to Supabase";
  const triggerId = "post-login";

  console.log(`🔍 Checking for existing "${actionName}" action...`);

  // List all actions, filter by name
  let allActions = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const res = await fetch(`${apiUrl}?triggerId=${triggerId}&page=${page}&per_page=50`, {
      headers: { authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`❌ Failed to list actions (HTTP ${res.status}): ${body}`);
      process.exit(3);
    }

    const data = await res.json();
    allActions = allActions.concat(data.actions || []);
    hasMore = data.page * data.per_page + (data.actions || []).length < data.total;
    page++;
  }

  const existing = allActions.find((a) => a.name === actionName);

  if (existing) {
    console.log(`✅ Found existing action: "${existing.name}" (${existing.id})`);
    console.log(`   Status: ${existing.status || "unknown"}`);
    return existing;
  }

  console.log(`➕ Creating new "${actionName}" action...`);

  const createRes = await fetch(apiUrl, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      name: actionName,
      supported_triggers: [{ id: triggerId, version: "v2" }],
      code: ACTION_CODE,
      runtime: "node18",
      secrets: [],
      dependencies: [],
    }),
  });

  if (!createRes.ok) {
    const body = await createRes.text();
    console.error(`❌ Failed to create action (HTTP ${createRes.status}): ${body}`);
    process.exit(3);
  }

  const created = await createRes.json();
  console.log(`✅ Created action: "${created.name}" (${created.id})`);
  return created;
}

async function updateActionCode(token, domain, actionId) {
  const apiUrl = `https://${domain}/api/v2/actions/actions/${actionId}`;

  console.log(`📝 Updating action code...`);

  const res = await fetch(apiUrl, {
    method: "PATCH",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ code: ACTION_CODE }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`❌ Failed to update action code (HTTP ${res.status}): ${body}`);
    process.exit(3);
  }

  console.log(`✅ Action code updated`);
}

async function deployAction(token, domain, actionId) {
  const apiUrl = `https://${domain}/api/v2/actions/actions/${actionId}/deploy`;

  console.log(`🚀 Deploying action...`);

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`❌ Failed to deploy action (HTTP ${res.status}): ${body}`);
    process.exit(4);
  }

  console.log(`✅ Action deployed successfully!`);
}

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  Auth0 Action Deploy — Sync to Supabase");
  console.log("═══════════════════════════════════════════\n");

  checkEnv();
  const token = await getManagementToken();
  const domain = process.env.AUTH0_DOMAIN;

  // Find or create the action
  const action = await findOrCreateAction(token, domain);

  // Update the code (always, to ensure latest version)
  await updateActionCode(token, domain, action.id);

  // Deploy
  await deployAction(token, domain, action.id);

  console.log("\n✅ All done! The Post-Login Action is now deployed.");
  console.log("   Enable it at: https://manage.auth0.com/#/actions/flows/login");
  console.log("   Configure secrets at: https://manage.auth0.com/#/actions/secrets");
  console.log("═══════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("❌ Unexpected error:", err);
  process.exit(1);
});
