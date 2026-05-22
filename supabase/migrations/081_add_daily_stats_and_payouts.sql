-- Migration: 081_add_daily_stats_and_payouts.sql
-- Date: 2026-07-09
-- Purpose: Create tables for daily stats snapshots and sponsor payout tracking

-- ─── Daily Stats ─────────────────────────────────────────────────────────────
-- Stores aggregated metrics snapshots populated by Vercel Cron Job.

CREATE TABLE IF NOT EXISTS daily_stats (
  date              DATE PRIMARY KEY,
  total_users       INTEGER NOT NULL DEFAULT 0,
  total_events      INTEGER NOT NULL DEFAULT 0,
  total_projects    INTEGER NOT NULL DEFAULT 0,
  total_teams       INTEGER NOT NULL DEFAULT 0,
  new_signups       INTEGER NOT NULL DEFAULT 0,
  new_markers       INTEGER NOT NULL DEFAULT 0,
  total_xp          BIGINT  NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE daily_stats IS 'Daily platform metrics snapshots populated by Vercel Cron Job';

-- ─── Sponsor Payouts ─────────────────────────────────────────────────────────
-- Tracks payouts from sponsors to hackers for completed bounties/opportunities.

CREATE TABLE IF NOT EXISTS sponsor_payouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id  UUID NOT NULL REFERENCES sponsor_opportunities(id) ON DELETE CASCADE,
  sponsor_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hacker_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount          INTEGER NOT NULL CHECK (amount > 0),
  currency        TEXT NOT NULL DEFAULT 'USD',
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  oc_expense_id   TEXT,  -- Open Collective expense ID for tracking
  notes           TEXT,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE sponsor_payouts IS 'Tracks sponsor payouts to hackers for completed bounties';

-- Index for sponsor dashboard queries
CREATE INDEX IF NOT EXISTS idx_sponsor_payouts_sponsor ON sponsor_payouts(sponsor_id, status);
CREATE INDEX IF NOT EXISTS idx_sponsor_payouts_hacker ON sponsor_payouts(hacker_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_payouts_opportunity ON sponsor_payouts(opportunity_id);

-- RLS: disabled — service_role pattern
ALTER TABLE daily_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_payouts DISABLE ROW LEVEL SECURITY;
