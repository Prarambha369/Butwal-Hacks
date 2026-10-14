-- Migration: 129_event_slugs_not_null.sql
-- Date: 2026-10-13
-- Purpose: Backfill events.slug and stop it from going NULL again.
--
-- Background: migration 003 added `slug text UNIQUE` and backfilled it once.
-- But no code path ever wrote a slug again -- `createEvent()` inserted
-- title/description/dates/location/banner/is_published/organizer_id and
-- nothing else. So every event created after 003 had slug = NULL, while
-- seven surfaces link by it:
--
--   /events/[slug]/page.tsx:28               .eq("slug", slug)
--   /events/[slug]/projects/page.tsx:36      .eq("slug", slug)
--   components/events/events-filter.tsx:170  href={`/events/${event.slug}`}
--   components/events/event-detail-content.tsx:134
--   components/home/event-calendar.tsx:456
--   components/home/event-gallery-client.tsx:137
--   app/(main)/projects/[id]/page.tsx:46
--   app/(main)/orgs/[slug]/events/page.tsx:77
--
-- A NULL renders as the literal string "null" in a template, so those links
-- resolved to /events/null, which hits notFound(). A NULL slug is a live 404,
-- not a cosmetic gap.
--
-- This migration does two things, in order:
--   1. Backfill every NULL slug from the title, uniquifying collisions.
--   2. Set NOT NULL, so the omission cannot recur.
--
-- The application now derives the same slug via lib/slug.ts, so the values this
-- migration writes and the ones createEvent() writes agree in shape.

BEGIN;

-- ── 1. Backfill ──────────────────────────────────────────────────────────
-- Mirrors lib/slug.ts: lowercase, fold diacritics, fold Devanagari digits,
-- non-alphanumerics to hyphens, collapse runs, trim, cap at 80 chars.
--
-- Written as a per-row loop because each row needs its own collision search,
-- which a single set-based UPDATE cannot do: the candidate for row N depends on
-- what rows N-1 and earlier already claimed. At this table size the loop is
-- free, and `events` grows one row at a time.
DO $$
DECLARE
  r            RECORD;
  base_slug    TEXT;
  candidate    TEXT;
  n            INT;
  head         TEXT;
  suffix       TEXT;
BEGIN
  FOR r IN SELECT id, title FROM events WHERE slug IS NULL OR slug = '' ORDER BY created_at FOR UPDATE
  LOOP
    -- Step 1: fold Devanagari digits to ASCII. translate() cannot do this
    -- during the regexp_replace pass, so it runs first on the raw title.
    -- Step 2: lowercase, turn every other non-alphanumeric run into a hyphen,
    -- collapse runs, and trim the hyphens the substitution leaves at both ends.
    base_slug := trim(BOTH '-' FROM
      regexp_replace(
        translate(lower(r.title), '०१२३४५६७८९', '0123456789'),
        '[^a-z0-9]+', '-', 'g'));

    IF base_slug = '' THEN
      -- Nothing slug-safe in the title (emoji-only, or a script this does not
      -- transliterate). Fall back to the id so the row still has a working URL.
      base_slug := 'event-' || substr(replace(r.id::text, '-', ''), 1, 16);
    END IF;

    base_slug := left(base_slug, 80);
    base_slug := regexp_replace(base_slug, '-+$', '');

    candidate := base_slug;
    n := 2;
    WHILE EXISTS (SELECT 1 FROM events e WHERE e.slug = candidate AND e.id <> r.id) LOOP
      suffix := '-' || n;
      head := left(base_slug, 80 - length(suffix));
      head := regexp_replace(head, '-+$', '');
      candidate := head || suffix;
      n := n + 1;
      IF n > 101 THEN
        -- Same bound as lib/slug.ts: pathological, not popular. Make it unique
        -- from the id rather than looping.
        candidate := base_slug || '-' || substr(replace(r.id::text, '-', ''), 1, 8);
        EXIT;
      END IF;
    END LOOP;

    UPDATE events SET slug = candidate WHERE id = r.id;
  END LOOP;
END $$;

-- ── 2. Prevent recurrence ───────────────────────────────────────────────
-- The column is UNIQUE, so a NOT NULL constraint here can fail the deploy
-- rather than the next event creation. Everything is backfilled above; this is
-- the assertion that the backfill actually completed.
ALTER TABLE events ALTER COLUMN slug SET NOT NULL;

COMMENT ON COLUMN events.slug IS
  'Public URL segment: /events/<slug>. Derived from the title unless the '
  'organizer overrides it. NOT NULL and UNIQUE. Slug rules live in '
  'my-app/src/lib/slug.ts.';

COMMIT;