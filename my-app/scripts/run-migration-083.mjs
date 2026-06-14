#!/usr/bin/env node

/**
 * Run migration 083 — add prefix column to api_keys table.
 *
 * Uses Supabase's Management API SQL endpoint directly (supports DDL).
 * https://supabase.com/docs/reference/api/sql
 *
 * Usage: node scripts/run-migration-083.mjs
 */

const sql = `
-- Migration: 083_add_api_keys_prefix.sql
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS prefix TEXT;
COMMENT ON COLUMN public.api_keys.prefix IS 'First 8 chars of the API key for identification in UI. Not a secret.';
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON public.api_keys (prefix);
`;

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  // Extract project ref from URL: https://<ref>.supabase.co
  const projectRef = supabaseUrl.replace("https://", "").split(".")[0];
  const sqlUrl = `https://${projectRef}.supabase.co/api/sql`;

  console.log(`Running migration 083 against ${projectRef}...`);

  const res = await fetch(sqlUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": serviceRoleKey,
      "Authorization": `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Migration failed (${res.status}):`, body);
    process.exit(1);
  }

  console.log("✅ Migration 083 applied successfully — prefix column added to api_keys");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
