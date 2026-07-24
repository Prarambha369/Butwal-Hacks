-- Add content_hash column for content-change detection
-- When the seed script runs, it compares the hash of the current content
-- against the stored hash. If different, the embedding is regenerated.
ALTER TABLE knowledge_embeddings ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- Index for fast lookup when checking hash during seeding
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_content_hash
  ON knowledge_embeddings (content_hash);

COMMENT ON COLUMN knowledge_embeddings.content_hash IS
  'SHA-256 hash of the content text. Used by seed-embeddings.ts to detect content changes and trigger re-embedding.';
