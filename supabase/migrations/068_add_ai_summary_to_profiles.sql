-- Add ai_summary column for storing AI-generated profile summaries
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_summary TEXT;
