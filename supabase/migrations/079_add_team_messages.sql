-- Migration: 079_add_team_messages.sql
-- Date: 2026-07-09
-- Purpose: Create team_messages table for Realtime team chat with message persistence

CREATE TABLE IF NOT EXISTS team_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  profile_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message     text NOT NULL CHECK (char_length(message) >= 1 AND char_length(message) <= 2000),
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE team_messages IS 'Persistent chat messages for team collaboration via Supabase Realtime';
COMMENT ON COLUMN team_messages.team_id IS 'The team this message belongs to';
COMMENT ON COLUMN team_messages.profile_id IS 'The profile that sent the message';
COMMENT ON COLUMN team_messages.message IS 'Message content (1-2000 chars)';

-- Index for loading recent messages per team
CREATE INDEX IF NOT EXISTS idx_team_messages_team ON team_messages(team_id, created_at DESC);

-- RLS: disabled — we use service_role for all server actions
ALTER TABLE team_messages DISABLE ROW LEVEL SECURITY;

-- Enable Realtime publication for this table so the client can subscribe
ALTER PUBLICATION supabase_realtime ADD TABLE team_messages;
