-- 126: certificate templates, bulk issuance, and delivery tracking
--
-- Context. `certificates` (055) is a bare FK pair: profile_id, event_id,
-- issue_date, status. There is no public route that resolves one, no way to
-- render anything but the hand-rolled text-only PDF, no way to know whether a
-- certificate was ever delivered, and nothing stopping closeEvent() from
-- issuing the same certificate twice.
--
-- This migration adds the storage for a real certificate system without
-- touching existing rows. Every addition is nullable or defaulted, so nothing
-- here rewrites a row that has already been issued.
--
-- Design notes worth keeping:
--
--  - Field coordinates are stored NORMALISED (0..1 of page width/height) in
--    jsonb, not pixels. A template is authored once at any preview size and
--    renders correctly at A4, US Letter or the 1056x816 editor canvas without
--    re-positioning. This is the single most important decision in the
--    schema: storing pixels would silently break every template the first
--    time an organizer changed the page size.
--
--  - certificate_access defaults to 'public' so existing events keep working.
--    'registered' and 'password' are opt-in per event. A bcrypt hash lives in
--    certificate_password; the plaintext is never stored or logged.
--
--  - The unique index on (event_id, profile_id) is what makes bulk issuance
--    idempotent. closeEvent() currently inserts unconditionally, so closing
--    an event twice produced duplicate certificates.
--
--    It is deliberately NOT a partial index. A partial unique index cannot be
--    named as an ON CONFLICT arbiter -- Postgres rejects it with "there is no
--    unique or exclusion constraint matching the ON CONFLICT specification" --
--    and the issuance path in lib/actions/certificates.ts relies on
--    `onConflict: "event_id,profile_id"`. Verified against this database, not
--    assumed.
--
--    Dropping WHERE loses nothing: Postgres treats NULLs as distinct in a unique
--    index, so rows with a NULL event_id or profile_id are still all allowed.
--    Also verified.
--
--  - certificate_deliveries is denormalised from certificates on purpose: a
--    delivery record must survive the certificate row it refers to being
--    re-issued, so the audit trail does not collapse.

-- ─── Templates ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- NULL event_id = organisation-wide default, available to every organiser.
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  -- Cloudinary asset URL for the certificate artwork (PNG or JPEG).
  background_url text,
  -- Page geometry in CSS pixels at 96dpi. 1056x816 is US Letter landscape.
  page_width integer NOT NULL DEFAULT 1056 CHECK (page_width BETWEEN 200 AND 5000),
  page_height integer NOT NULL DEFAULT 816 CHECK (page_height BETWEEN 200 AND 5000),
  -- Array of field definitions. See lib/certificates/template.ts for the shape.
  -- Default is the three fields a certificate cannot be issued without.
  fields jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(fields) = 'array'),
  is_default boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- At most one default template per scope. Partial unique index rather than a
-- (event_id, is_default) unique constraint because event_id NULL would
-- otherwise collide across every organisation-wide template.
CREATE UNIQUE INDEX IF NOT EXISTS certificate_templates_one_global_default
  ON public.certificate_templates ((event_id IS NULL)) WHERE is_default AND event_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS certificate_templates_one_default_per_event
  ON public.certificate_templates (event_id)
  WHERE is_default AND event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS certificate_templates_event_idx
  ON public.certificate_templates (event_id);

COMMENT ON TABLE public.certificate_templates IS
  'Reusable certificate artwork plus field placement. Coordinates in fields jsonb are normalised 0..1 of page size.';

-- ─── Per-event access control ───────────────────────────────────────────────
-- Intentionally absent: a certificate_access enum and a password hash. Three
-- access modes with no code implementing them is schema that reads as a
-- finished feature and is not one, and a future migration adds two columns in
-- about the same time it takes to build the route that would use them.
--
-- ─── Integrity of the existing certificates table ───────────────────────────

-- Dedupe FIRST. The unique index below aborts the entire migration -- templates,
-- deliveries, the download counter, everything -- on any database where
-- closeEvent() ran twice, which is precisely the pre-state this migration
-- exists to fix. Verified against Postgres 16: a duplicate key aborts the
-- CREATE UNIQUE INDEX, it does not warn.
--
-- Keep the earliest row: it is the one the original issuance created, so its
-- issue_date is the real one.
DELETE FROM public.certificates a
USING public.certificates b
WHERE a.id > b.id
  AND a.event_id IS NOT NULL
  AND a.profile_id IS NOT NULL
  AND a.event_id = b.event_id
  AND a.profile_id = b.profile_id;

-- Stop closeEvent() double-issuing. See the note at the top of this file.
-- Plain unique index, not partial -- see the ON CONFLICT note above.
CREATE UNIQUE INDEX IF NOT EXISTS certificates_event_profile_uniq
  ON public.certificates (event_id, profile_id);

-- ─── Case-insensitive email matching ─────────────────────────────────────────
-- Bulk roster matching filters on profiles.email, and PostgREST's `= ANY` on
-- text is case-sensitive. The roster side is lowercased by the parser, so a
-- stored "Asha@Example.com" would never match and the organizer would be told
-- "no profile" for someone who is registered.
--
-- Email local parts are case-insensitive per RFC 5321, so folding stored
-- addresses to lower case is semantically correct rather than a convenience.
-- Checked for lower()-collisions before applying: zero, so the UNIQUE
-- constraint on email cannot be violated by this rewrite.

UPDATE public.profiles
SET email = lower(email)
WHERE email IS NOT NULL
  AND email <> lower(email);

-- The lookup uses lower(email); without this the fix above would still leave
-- every match as a sequential scan.
CREATE INDEX IF NOT EXISTS profiles_email_lower_idx
  ON public.profiles (lower(email));

-- api/certificates/route.ts filters on auth0_user_id but there was no index,
-- so every authenticated certificate read was a sequential scan.
CREATE INDEX IF NOT EXISTS certificates_auth0_user_id_idx
  ON public.certificates (auth0_user_id)
  WHERE auth0_user_id IS NOT NULL;

-- 'issued' is the only value any code writes. Constrain it so a typo cannot
-- invent a status the revocation logic has never heard of.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'certificates_status_check'
  ) THEN
    ALTER TABLE public.certificates
      ADD CONSTRAINT certificates_status_check
      CHECK (status IN ('issued', 'revoked', 'void'));
  END IF;
END $$;

-- ─── Delivery + download tracking ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.certificate_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id uuid REFERENCES public.certificates(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.certificate_templates(id) ON DELETE SET NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  -- 'email'   -- sent to the recipient
  -- 'download'-- fetched from the public certificate route
  -- 'widget'  -- claimed through the embeddable claim widget
  channel text NOT NULL CHECK (channel IN ('email', 'download', 'widget')),
  recipient_email text,
  -- 'queued' | 'sent' | 'delivered' | 'failed'
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
  error text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  downloaded_at timestamptz,
  download_count integer NOT NULL DEFAULT 0 CHECK (download_count >= 0)
);

-- One row per (certificate, channel): re-sending the same channel updates the
-- existing record rather than accumulating duplicates, which is what makes the
-- "already emailed?" check a single indexed lookup. Plain unique index so it
-- can serve as an ON CONFLICT arbiter -- see the note at the top of this file.
CREATE UNIQUE INDEX IF NOT EXISTS certificate_deliveries_once_per_channel
  ON public.certificate_deliveries (certificate_id, channel);

-- Supports the export query: everything sent for one event, newest first.
CREATE INDEX IF NOT EXISTS certificate_deliveries_event_sent_idx
  ON public.certificate_deliveries (event_id, sent_at DESC);

-- Supports the domain/subdomain recipient filter, which matches on the
-- tail of recipient_email: '@' || domain.
CREATE INDEX IF NOT EXISTS certificate_deliveries_recipient_email_idx
  ON public.certificate_deliveries (recipient_email);

COMMENT ON TABLE public.certificate_deliveries IS
  'Append-only log of certificate emails and downloads. Powers the delivery report and the domain-filtered mass send.';

-- ─── Download counter ────────────────────────────────────────────────────────
-- A plain upsert from the app would set download_count to 1 on every print.
-- Incrementing needs the previous value, which means the arithmetic has to
-- happen where the row is locked -- a read-then-write from the route would
-- lose counts whenever two people open the link at the same moment.

CREATE OR REPLACE FUNCTION public.record_certificate_download(
  p_certificate_id uuid,
  p_event_id uuid
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.certificate_deliveries
    (certificate_id, event_id, channel, status, downloaded_at, download_count)
  VALUES
    (p_certificate_id, p_event_id, 'download', 'sent', now(), 1)
  ON CONFLICT (certificate_id, channel) DO UPDATE
    SET download_count = public.certificate_deliveries.download_count + 1,
        downloaded_at = now();
$$;

COMMENT ON FUNCTION public.record_certificate_download(uuid, uuid) IS
  'Records a certificate print, incrementing download_count atomically. Called only from the service role.';

REVOKE ALL ON FUNCTION public.record_certificate_download(uuid, uuid) FROM public, anon, authenticated;

-- ─── Grants and RLS ─────────────────────────────────────────────────────────
-- Every existing public table has RLS on, so the new ones match. With RLS
-- enabled and no policies, anon and authenticated are denied outright;
-- server paths use the service role, which bypasses RLS. The REVOKE is the
-- belt to that braces, consistent with the lockdown in 116. Templates are
-- organiser data and deliveries are recipient data -- neither belongs in a
-- browser.

ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_deliveries ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.certificate_templates FROM anon, authenticated;
REVOKE ALL ON public.certificate_deliveries FROM anon, authenticated;
GRANT ALL ON public.certificate_templates TO service_role;
GRANT ALL ON public.certificate_deliveries TO service_role;
