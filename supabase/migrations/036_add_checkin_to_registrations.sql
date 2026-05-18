-- Day 36: Event Check-in System
ALTER TABLE event_registrations 
ADD COLUMN IF NOT EXISTS checked_in boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS check_in_at timestamptz;

COMMENT ON COLUMN event_registrations.checked_in IS 'Whether the hacker has physically checked into the event';
