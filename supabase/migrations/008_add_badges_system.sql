-- Day 29: Gamification & Badges
CREATE TABLE badges (
  id text PRIMARY KEY, -- e.g., 'early-adopter'
  name text NOT NULL,
  description text,
  icon_url text,
  color_hex text,
  criteria text
);

CREATE TABLE profile_badges (
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id text REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, badge_id)
);

-- Seed some initial badges
INSERT INTO badges (id, name, description, color_hex, criteria) VALUES
('early-adopter', 'Early Adopter', 'One of the first 100 hackers to join the network.', '#F5A623', 'User created profile before Day 30'),
('event-hunter', 'Event Hunter', 'Registered for 3 or more community events.', '#00B4A6', 'Registrations >= 3'),
('pioneer', 'Pioneer', 'First event registration ever.', '#E8622A', 'Registrations == 1');
