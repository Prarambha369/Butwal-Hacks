-- ═══════════════════════════════════════════════════════════════════════
-- 012_work_distribution.sql — Notion-Style Work Distribution
-- ═══════════════════════════════════════════════════════════════════════

-- Create task status enum
DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'done');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create priority enum
DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ─── Workspaces ───────────────────────────────────────────────────────────
-- Each team gets a workspace for task management.
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'General',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Enforce one workspace per team
  CONSTRAINT unique_team_workspace UNIQUE (team_id)
);

CREATE INDEX IF NOT EXISTS idx_workspaces_team_id ON workspaces(team_id);

-- ─── Tasks ───────────────────────────────────────────────────────────────
-- Individual tasks within a workspace, assigned to team members.
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status task_status NOT NULL DEFAULT 'todo',
  priority task_priority NOT NULL DEFAULT 'medium',
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_workspace_id ON tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_position ON tasks(workspace_id, status, position);

-- ─── Row Level Security ──────────────────────────────────────────────────
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Team members can read their workspace
CREATE POLICY "team_members_read_workspace"
  ON workspaces FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = workspaces.team_id
      AND team_members.user_id = (SELECT id FROM profiles WHERE auth0_user_id = auth.jwt() ->> 'sub' LIMIT 1)
    )
  );

-- Team members can update their workspace
CREATE POLICY "team_members_update_workspace"
  ON workspaces FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = workspaces.team_id
      AND team_members.user_id = (SELECT id FROM profiles WHERE auth0_user_id = auth.jwt() ->> 'sub' LIMIT 1)
    )
  );

-- Team members can read tasks in their workspace
CREATE POLICY "team_members_read_tasks"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      JOIN team_members tm ON tm.team_id = w.team_id
      WHERE w.id = tasks.workspace_id
      AND tm.user_id = (SELECT id FROM profiles WHERE auth0_user_id = auth.jwt() ->> 'sub' LIMIT 1)
    )
  );

-- Team members can create tasks in their workspace
CREATE POLICY "team_members_create_tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces w
      JOIN team_members tm ON tm.team_id = w.team_id
      WHERE w.id = tasks.workspace_id
      AND tm.user_id = (SELECT id FROM profiles WHERE auth0_user_id = auth.jwt() ->> 'sub' LIMIT 1)
    )
  );

-- Team members can update tasks in their workspace
CREATE POLICY "team_members_update_tasks"
  ON tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      JOIN team_members tm ON tm.team_id = w.team_id
      WHERE w.id = tasks.workspace_id
      AND tm.user_id = (SELECT id FROM profiles WHERE auth0_user_id = auth.jwt() ->> 'sub' LIMIT 1)
    )
  );

-- Team members can delete tasks in their workspace
CREATE POLICY "team_members_delete_tasks"
  ON tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces w
      JOIN team_members tm ON tm.team_id = w.team_id
      WHERE w.id = tasks.workspace_id
      AND tm.user_id = (SELECT id FROM profiles WHERE auth0_user_id = auth.jwt() ->> 'sub' LIMIT 1)
    )
  );

-- ─── Triggers ────────────────────────────────────────────────────────────
-- Auto-update updated_at on workspace changes
CREATE OR REPLACE FUNCTION update_workspace_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_workspace_updated_at ON workspaces;
CREATE TRIGGER trg_workspace_timestamp
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_workspace_timestamp();

-- Auto-update updated_at on task changes
DROP TRIGGER IF EXISTS trg_task_updated_at ON tasks;
CREATE TRIGGER trg_task_timestamp
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_workspace_timestamp();
