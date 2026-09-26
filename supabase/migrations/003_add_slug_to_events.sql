ALTER TABLE events ADD COLUMN IF NOT EXISTS slug text UNIQUE;
-- Update existing events to have slugs based on title if any exist
UPDATE events SET slug = lower(replace(title, ' ', '-')) WHERE slug IS NULL;
