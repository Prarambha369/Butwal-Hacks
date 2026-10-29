-- ─── MrBallu knowledge base (RAG) — clean rebuild ────────────────────
--
-- Why a fresh table rather than reusing the one from migration 096:
--   096 declared VECTOR(384) for the old MiniLM embedding model. The stack now
--   embeds with Gemini gemini-embedding-001, which emits 768-dim vectors. That
--   table was never applied to this project, so rather than carry a dimension
--   mismatch forward we create the knowledge base at 768 from the start.
--
-- SECURITY: this table holds only curated, public-facing content (policies,
-- site copy, published blog posts, chapter blurbs). It is never a source of
-- private data, and it is read exclusively through the server-side chat route.
-- RLS is enabled with NO policies, so the anon/authenticated roles cannot read
-- it directly even though the table exists in the public schema — only the
-- service role (used by the API route) bypasses that.
--
-- Applied by CI (`supabase db push`), not locally.

-- Migration 117 moved pgvector into the `extensions` schema (Supabase's
-- recommended layout), so the vector type and its operators need that schema
-- on the path here too.
set search_path = public, extensions;

create extension if not exists vector with schema extensions;

create table if not exists public.knowledge_embeddings (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  -- { type, slug, title, tags, source } — used for filtering and citation.
  metadata jsonb not null default '{}'::jsonb,
  -- SHA-256 of `content`; lets the seed script skip unchanged chunks.
  content_hash text,
  embedding vector(768),
  created_at timestamptz not null default now()
);

-- Databases that already contain a 384-dimensional knowledge_embeddings table
-- from an older attempt cannot be altered in place while incompatible rows
-- remain. Drop the dependent HNSW index, remove rows whose embeddings do not
-- fit vector(768), then widen the column. Historical migration 096 is left
-- unchanged so the 768-dimensional seeder and match_knowledge use this column.
drop index if exists idx_knowledge_embeddings_hnsw;

delete from public.knowledge_embeddings
where embedding is not null
  and vector_dims(embedding) <> 768;

alter table public.knowledge_embeddings
  alter column embedding type vector(768)
  using embedding::vector(768);

-- HNSW: fast approximate nearest-neighbour on cosine distance, which is the
-- right metric for text embeddings (angle, not magnitude).
create index if not exists idx_knowledge_embeddings_hnsw
  on public.knowledge_embeddings
  using hnsw (embedding vector_cosine_ops);

-- The seed script upserts by content_hash so re-running is idempotent and
-- only changed documents get re-embedded (Gemini's free tier is metered).
create unique index if not exists idx_knowledge_embeddings_hash
  on public.knowledge_embeddings (content_hash)
  where content_hash is not null;

create index if not exists idx_knowledge_embeddings_type
  on public.knowledge_embeddings ((metadata->>'type'));

-- ─── Similarity search ───────────────────────────────────────────────
-- SECURITY INVOKER (the default): the function runs with the caller's rights,
-- so it cannot be used to read around RLS. The chat route calls it with the
-- service role, which already has full access; a direct anon call would return
-- nothing because anon has no SELECT grant below.
create or replace function public.match_knowledge(
  query_embedding vector(768),
  match_threshold float default 0.35,
  match_count int default 4
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language sql
stable
set search_path = public, extensions
as $$
  select
    ke.id,
    ke.content,
    ke.metadata,
    1 - (ke.embedding <=> query_embedding) as similarity
  from public.knowledge_embeddings ke
  where ke.embedding is not null
    and 1 - (ke.embedding <=> query_embedding) > match_threshold
  order by ke.embedding <=> query_embedding
  limit least(match_count, 8);
$$;

-- Lock the table down. Enabling RLS with no policy is what actually denies
-- anon/authenticated; the explicit revoke covers the case where RLS is later
-- disabled by mistake.
alter table public.knowledge_embeddings enable row level security;
revoke all on table public.knowledge_embeddings from anon, authenticated;

comment on table public.knowledge_embeddings is
  'Curated public knowledge base for MrBallu (RAG). Seeded by scripts/seed-knowledge-base.mjs. Contains only public content — never private or personal data.';
comment on function public.match_knowledge is
  'Cosine similarity search over the knowledge base. Returns chunks above match_threshold, nearest first. Intended for the server-side chat route only.';
