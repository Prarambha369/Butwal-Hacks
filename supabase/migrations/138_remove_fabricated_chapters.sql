-- Migration: 138_remove_fabricated_chapters
-- Purpose: Delete the three chapters seeded by 121 and 125. Their school
-- names, lead names, member counts, highlight claims, and WhatsApp links were
-- invented for the old hardcoded page; none of them came from a school.
--
-- The public directory is a coming-soon page and the app no longer carries a
-- static fallback, so an empty table is the honest state. Only the exact
-- seeded rows are removed: if a maintainer edited a row's description, its
-- slug plus lead name alone will not match the guard below.

DELETE FROM public.chapters
WHERE (slug = 'bhawani-secondary-school'
       AND lead_name = 'Sushant Acharya'
       AND description LIKE $$Partnered with the school's coding club%$$)
   OR (slug = 'adarsha-secondary-school'
       AND lead_name = 'Pooja Thapa'
       AND description LIKE $$A high-energy chapter focused on introducing younger students%$$)
   OR (slug = 'butwal-multiple-campus'
       AND lead_name = 'Anup Poudel'
       AND description LIKE $$Partnering with the campus's tech society%$$);
