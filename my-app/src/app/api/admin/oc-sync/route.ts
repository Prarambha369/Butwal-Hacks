/**
 * Open Collective Sync — Admin API
 *
 * Fetches recent expenses and payouts from Open Collective GraphQL API
 * and syncs them to the local sponsor_payouts table.
 *
 * GET /api/admin/oc-sync — Returns current sync status
 * POST /api/admin/oc-sync — Triggers a manual sync
 *
 * Requires maintainer role.
 *
 * ponytail: Direct GraphQL query to OC API — no SDK needed.
 * Upgrade path: Add incremental sync via webhook for real-time updates.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";
import { auth0 } from "@/lib/auth0";
import { logger } from "@/lib/logger";
import { posthogLog } from "@/lib/posthog-logger";

const OC_API_URL = "https://api.opencollective.com/graphql/v2";
const OC_COLLECTIVE_SLUG = "butwal-hacks";

// ─── Sync HTTP Status for GET ────────────────────────────────────────────────

async function getSyncStatus(supabase: ReturnType<typeof createServiceClient>) {
  const [payoutCount, unmatchedExpenses] = await Promise.all([
    supabase.from("sponsor_payouts").select("*", { count: "exact", head: true }),
    supabase
      .from("sponsor_payouts")
      .select("*", { count: "exact", head: true })
      .is("oc_expense_id", null)
      .neq("status", "cancelled"),
  ]);

  return {
    total_payouts: payoutCount.count ?? 0,
    unmatched_expenses: unmatchedExpenses.count ?? 0,
    last_sync: null, // ponytail: No sync tracking yet; upgrade path: add sync_log table
  };
}

// ─── Manual Sync (POST) ──────────────────────────────────────────────────────

async function syncExpenses(supabase: ReturnType<typeof createServiceClient>) {
  // GraphQL query for recent expenses
  const query = `
    query Expenses($slug: String!, $limit: Int!) {
      collective(slug: $slug) {
        expenses(limit: $limit, status: PAID) {
          nodes {
            id
            description
            amount
            currency
            createdAt
            payee {
              name
              email
            }
          }
        }
      }
    }
  `;

  const res = await fetch(OC_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      variables: { slug: OC_COLLECTIVE_SLUG, limit: 50 },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error("[oc-sync] Open Collective API error:", res.status, text);
    return { error: "Failed to fetch from Open Collective" };
  }

  const json = await res.json();
  const expenses = json?.data?.collective?.expenses?.nodes ?? [];

  if (expenses.length === 0) {
    return { synced: 0, message: "No expenses found" };
  }

  let synced = 0;

  for (const expense of expenses) {
    // Check if this expense is already tracked
    const { data: existing } = await supabase
      .from("sponsor_payouts")
      .select("id")
      .eq("oc_expense_id", expense.id)
      .maybeSingle();

    if (existing) continue; // Already synced

    // Try to match the payee to a profile
    const payeeEmail = expense.payee?.email ?? "";
    const { data: hacker } = payeeEmail
      ? await supabase
          .from("profiles")
          .select("id")
          .eq("email", payeeEmail)
          .maybeSingle()
      : { data: null };

    // Try to match by BH-ID or bounty in expense description
    const description: string = expense.description ?? "";
    const bountyMatch = description.match(/BOUNTY:\s*(.+)/i);

    let opportunityId: string | null = null;
    let sponsorId: string | null = null;

    if (bountyMatch) {
      const { data: opp } = await supabase
        .from("sponsor_opportunities")
        .select("id, sponsor_id")
        .eq("is_bounty", true)
        .ilike("title", `%${bountyMatch[1].trim()}%`)
        .maybeSingle();
      if (opp) {
        opportunityId = opp.id;
        sponsorId = opp.sponsor_id;
      }
    }

    // ponytail: Skip insert if we can't match essential FKs.
    // Unmatched expenses can be linked manually via admin.
    if (!opportunityId || !hacker?.id) {
      logger.info("[oc-sync] Skipping unmatched expense", {
        expenseId: expense.id,
        hasHacker: !!hacker?.id,
        hasOpportunity: !!opportunityId,
      });
      continue;
    }

    // Insert as pending payout (requires manual approval)
    const { error: insertError } = await supabase
      .from("sponsor_payouts")
      .insert({
        opportunity_id: opportunityId,
        sponsor_id: sponsorId,
        hacker_id: hacker.id,
        amount: expense.amount,
        currency: expense.currency ?? "USD",
        status: "pending",
        oc_expense_id: expense.id,
        notes: expense.description,
      });

    if (insertError) {
      logger.warn("[oc-sync] Failed to insert expense:", { expenseId: expense.id, error: insertError.message });
    } else {
      synced++;
    }
  }

  return { synced };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("auth0_user_id", session.user.sub)
    .single();

  if (profile?.role !== "maintainer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = await getSyncStatus(supabase);
  return NextResponse.json({ ok: true, ...status });
}

export async function POST(request: NextRequest) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("auth0_user_id", session.user.sub)
    .single();

  if (profile?.role !== "maintainer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await syncExpenses(supabase);

  posthogLog.info("OC sync completed", result);

  return NextResponse.json({ ok: true, ...result });
}
