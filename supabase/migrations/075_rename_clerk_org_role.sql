-- Rename legacy Clerk column to generic name
-- The column stored role strings ('admin', 'member') — no Clerk dependency remains.
ALTER TABLE public.chapter_members RENAME COLUMN clerk_org_role TO org_role;

-- Update any existing comments/documentation on the column
COMMENT ON COLUMN public.chapter_members.org_role IS 'Role within the chapter: admin or member';
