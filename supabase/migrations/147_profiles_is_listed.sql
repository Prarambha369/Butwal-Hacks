-- Profiles that exist for a real login but must never appear publicly
-- (the Playwright E2E account, internal test users). Unlisted profiles are
-- excluded from the member directory, mentor list, talent search, site search,
-- the sitemap, and /p/<bh_id> returns 404. The account itself keeps working.
alter table public.profiles
  add column if not exists is_listed boolean not null default true;

update public.profiles
  set is_listed = false
  where auth0_user_id = 'auth0|6a5e7122c2878753ca07304e'; -- e2e@butwalhacks.com
