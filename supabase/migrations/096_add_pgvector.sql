-- Enable pgvector extension for AI-powered semantic search
-- Powers RAG (Retrieval-Augmented Generation) for BH Bot and AI features.
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Knowledge Embeddings Table ────────────────────────────────────
-- Stores content chunks with their vector embeddings for semantic search.
-- Used by BH Bot to find relevant context for user questions.
CREATE TABLE IF NOT EXISTS knowledge_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  embedding VECTOR(384),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- HNSW index for fast approximate nearest neighbor search
-- Uses cosine distance (vector_cosine_ops) — best for text embeddings
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_hnsw
  ON knowledge_embeddings
  USING hnsw (embedding vector_cosine_ops);

-- ─── Similarity Search Function ────────────────────────────────────
-- Returns top-N content chunks with similarity above threshold, ordered
-- by cosine similarity descending.
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding VECTOR(384),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ke.id,
    ke.content,
    ke.metadata,
    1 - (ke.embedding <=> query_embedding) AS similarity
  FROM knowledge_embeddings ke
  WHERE 1 - (ke.embedding <=> query_embedding) > match_threshold
  ORDER BY ke.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON TABLE knowledge_embeddings IS 'Content chunks with vector embeddings for semantic search (RAG). Populated via scripts/seed-embeddings.ts';
COMMENT ON FUNCTION match_knowledge IS 'Find content chunks by cosine similarity to a query embedding. Returns matches above threshold, ordered by similarity.';
COMMENT ON COLUMN knowledge_embeddings.metadata IS 'JSON with { type, slug, title, tags, source }. Used for filtering and display.';
COMMENT ON COLUMN knowledge_embeddings.embedding IS '384-dimensional vector from sentence-transformers/all-MiniLM-L6-v2 via Hugging Face Inference API';
