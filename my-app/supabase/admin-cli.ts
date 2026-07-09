#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

/**
 * Butwal Hacks — Admin CLI
 *
 * Common administrative operations for the Butwal Hacks platform.
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment.
 *
 * Usage:
 *   deno run --allow-net --allow-env admin-cli.ts <command> [options]
 *
 * Commands:
 *   users list                    List all users (profiles)
 *   users get <bh-id|email>      Get a specific user
 *   stats                         Show platform statistics
 *   xp award <bh-id> <amount>    Award XP to a user
 *   xp leaderboard                Show XP leaderboard
 *   check-profile <bh-id>        Verify profile data integrity
 *
 * ponytail: Single-file CLI with no external CLI framework.
 * Upgrade path: Add oclif or cliffy for subcommand parsing.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const [command, subcommand, ...args] = Deno.args;

async function listUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, bh_id, full_name, email, role, xp")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error listing users:", error.message);
    Deno.exit(1);
  }

  console.log("\n=== Users (last 50) ===\n");
  console.log(
    "BH-ID".padEnd(14),
    "Name".padEnd(24),
    "Role".padEnd(12),
    "XP".padEnd(6),
    "Email",
  );
  console.log("-".repeat(80));

  for (const user of data) {
    console.log(
      (user.bh_id ?? "—").padEnd(14),
      (user.full_name ?? "Unknown").slice(0, 23).padEnd(24),
      (user.role ?? "—").padEnd(12),
      String(user.xp ?? 0).padEnd(6),
      user.email ?? "—",
    );
  }

  console.log(`\nTotal: ${data.length} users`);
}

async function getUser(identifier: string) {
  const query = identifier.includes("@")
    ? supabase.from("profiles").select("*").eq("email", identifier).maybeSingle()
    : supabase.from("profiles").select("*").eq("bh_id", identifier).maybeSingle();

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching user:", error.message);
    Deno.exit(1);
  }

  if (!data) {
    console.log(`User not found: ${identifier}`);
    Deno.exit(1);
  }

  console.log("\n=== User Profile ===\n");
  console.log(`BH-ID:        ${data.bh_id ?? "—"}`);
  console.log(`Name:         ${data.full_name ?? "—"}`);
  console.log(`Email:        ${data.email ?? "—"}`);
  console.log(`Role:         ${data.role ?? "—"}`);
  console.log(`XP:           ${data.xp ?? 0}`);
  console.log(`Created:      ${data.created_at ?? "—"}`);
  console.log(`Auth0 ID:     ${data.auth0_user_id ?? "—"}`);
  console.log(`GitHub:       ${data.github_username ?? "—"}`);
  console.log(`Is Claimed:   ${data.is_claimed ?? false}`);
  console.log(`Socials:      ${JSON.stringify(data.socials ?? {})}`);
  console.log(`Skills:       ${data.skills?.join(", ") ?? "—"}`);
}

async function showStats() {
  const [
    { count: profileCount },
    { count: eventCount },
    { count: teamCount },
    { count: projectCount },
    { count: markerCount },
    { count: credentialCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("teams").select("*", { count: "exact", head: true }),
    supabase.from("projects").select("*", { count: "exact", head: true }),
    supabase.from("trust_markers").select("*", { count: "exact", head: true }).eq("is_revoked", false),
    supabase.from("profile_micro_credentials").select("*", { count: "exact", head: true }),
  ]);

  // Total XP awarded
  const { data: xpData } = await supabase
    .from("profiles")
    .select("xp");

  const totalXp = xpData?.reduce((sum, p) => sum + (p.xp ?? 0), 0) ?? 0;

  console.log("\n=== Platform Statistics ===\n");
  console.log(`Profiles:             ${profileCount ?? 0}`);
  console.log(`Events:               ${eventCount ?? 0}`);
  console.log(`Teams:                ${teamCount ?? 0}`);
  console.log(`Projects:             ${projectCount ?? 0}`);
  console.log(`Active Trust Markers: ${markerCount ?? 0}`);
  console.log(`Micro-Credentials:    ${credentialCount ?? 0}`);
  console.log(`Total XP Awarded:     ${totalXp}`);
}

async function awardXp(bhId: string, amount: number) {
  const { data: profile, error: findError } = await supabase
    .from("profiles")
    .select("id, full_name, xp")
    .eq("bh_id", bhId)
    .single();

  if (findError || !profile) {
    console.error(`Profile not found: ${bhId}`);
    Deno.exit(1);
  }

  const { error } = await supabase.rpc("increment_xp", {
    p_profile_id: profile.id,
    p_amount: amount,
    p_reason: `Admin award via CLI`,
  });

  if (error) {
    console.error("Error awarding XP:", error.message);
    Deno.exit(1);
  }

  console.log(`\nAwarded ${amount} XP to ${profile.full_name ?? bhId}`);
  console.log(`Previous XP: ${profile.xp ?? 0}`);
  console.log(`New XP:      ${(profile.xp ?? 0) + amount}`);
}

async function leaderboard() {
  const { data, error } = await supabase
    .from("profiles")
    .select("bh_id, full_name, xp")
    .order("xp", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching leaderboard:", error.message);
    Deno.exit(1);
  }

  console.log("\n=== XP Leaderboard (Top 20) ===\n");
  console.log("Rank".padEnd(6), "BH-ID".padEnd(14), "Name".padEnd(24), "XP");
  console.log("-".repeat(60));

  for (let i = 0; i < data.length; i++) {
    const user = data[i];
    const rank = i + 1;
    const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : String(rank);
    console.log(
      medal.padEnd(6),
      (user.bh_id ?? "—").padEnd(14),
      (user.full_name ?? "Unknown").slice(0, 23).padEnd(24),
      user.xp ?? 0,
    );
  }
}

async function checkProfile(bhId: string) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*, trust_markers(*), profile_badges(*), teams:id!team_members(*)")
    .eq("bh_id", bhId)
    .single();

  if (error || !profile) {
    console.error(`Profile not found: ${bhId}`);
    Deno.exit(1);
  }

  console.log(`\n=== Profile Integrity Check: ${bhId} ===\n`);

  const issues: string[] = [];

  if (!profile.email) issues.push("Missing email");
  if (!profile.full_name) issues.push("Missing full_name");
  if (!profile.auth0_user_id) issues.push("Missing auth0_user_id");
  if (!profile.slug_id) issues.push("Missing slug_id");

  if (issues.length === 0) {
    console.log("✅ All required fields present");
  } else {
    for (const issue of issues) {
      console.log(`❌ ${issue}`);
    }
  }

  console.log(`\nTeams:          ${(profile as Record<string, unknown>).teams?.length ?? 0}`);
  console.log(`Trust Markers:  ${(profile as Record<string, unknown>).trust_markers?.length ?? 0}`);
  console.log(`Badges:         ${(profile as Record<string, unknown>).profile_badges?.length ?? 0}`);
}

// ─── Command Router ──────────────────────────────────────────────────────────

async function main() {
  if (!command) {
    console.log(`
Butwal Hacks — Admin CLI

Usage:
  deno run --allow-net --allow-env admin-cli.ts <command>

Commands:
  users list                    List all users
  users get <bh-id|email>       Get a specific user
  stats                         Show platform statistics
  xp award <bh-id> <amount>     Award XP to a user
  xp leaderboard                Show XP leaderboard
  check-profile <bh-id>         Verify profile data integrity
`);
    Deno.exit(0);
  }

  switch (command) {
    case "users":
      if (subcommand === "list") await listUsers();
      else if (subcommand === "get") await getUser(args[0]);
      else console.error("Usage: users list|get <identifier>");
      break;

    case "stats":
      await showStats();
      break;

    case "xp":
      if (subcommand === "award") {
        const amount = parseInt(args[1], 10);
        if (!args[0] || isNaN(amount)) {
          console.error("Usage: xp award <bh-id> <amount>");
          Deno.exit(1);
        }
        await awardXp(args[0], amount);
      } else if (subcommand === "leaderboard") {
        await leaderboard();
      } else {
        console.error("Usage: xp award|leaderboard");
      }
      break;

    case "check-profile":
      if (!args[0]) {
        console.error("Usage: check-profile <bh-id>");
        Deno.exit(1);
      }
      await checkProfile(args[0]);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      Deno.exit(1);
  }
}

await main();
