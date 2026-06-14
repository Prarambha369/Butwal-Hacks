#!/usr/bin/env node
/**
 * apply-migrations.mjs — Apply all Supabase migrations.
 *
 * Usage:
 *   1. Run this SQL ONCE in your Supabase Dashboard SQL Editor:
 *        CREATE OR REPLACE FUNCTION exec_sql(query text)
 *        RETURNS void AS $$ BEGIN EXECUTE query; END; $$
 *        LANGUAGE plpgsql SECURITY DEFINER;
 *
 *   2. node scripts/apply-migrations.mjs
 *
 * Reads .env.local for SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const REPO_ROOT = join(PROJECT_ROOT, "..");
const MIGRATIONS_DIR = join(REPO_ROOT, "supabase", "migrations");
const ENV_PATH = join(PROJECT_ROOT, ".env.local");

// ─── Load env vars from .env.local ────────────────────────────────────
function loadEnv(path) {
  try {
    const content = readFileSync(path, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      // Strip surrounding quotes if present
      process.env[key] = val.replace(/^["']|["']$/g, "");
    }
  } catch {
    // .env.local might not exist, fall back to process.env
  }
}

loadEnv(ENV_PATH);

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!SERVICE_KEY || !SUPABASE_URL) {
  console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL");
  console.error("   Set these in .env.local or as environment variables.");
  process.exit(1);
}

// ─── Connect ──────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ─── Read and sort migration files ────────────────────────────────────
const files = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();

console.log(`📂 Found ${files.length} migration files\n`);

let applied = 0;
let skipped = 0;
let errors = [];

for (const file of files) {
  const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf-8").trim();
  if (!sql) {
    skipped++;
    continue;
  }

  process.stdout.write(`  ${file}... `);

  const { error } = await supabase.rpc("exec_sql", { query: sql });

  if (error) {
    if (error.message?.includes('function "exec_sql" does not exist')) {
      console.log("❌");
      console.log(`\n⚠️  The exec_sql function doesn't exist. Run this once in your Supabase SQL Editor:\n`);
      console.log(`   CREATE OR REPLACE FUNCTION exec_sql(query text)`);
      console.log(`   RETURNS void AS $$ BEGIN EXECUTE query; END; $$`);
      console.log(`   LANGUAGE plpgsql SECURITY DEFINER;\n`);
      process.exit(1);
    } else {
      console.log("⚠️");
      console.log(`    Error: ${error.message}`);
      errors.push({ file, error: error.message });
      skipped++;
    }
  } else {
    console.log("✅");
    applied++;
  }
}

console.log(`\n📊 Results: ${applied} applied, ${skipped} skipped, ${errors.length} errors`);
if (errors.length > 0) {
  console.log("\nErrors:");
  for (const e of errors) {
    console.log(`  - ${e.file}: ${e.error}`);
  }
}
