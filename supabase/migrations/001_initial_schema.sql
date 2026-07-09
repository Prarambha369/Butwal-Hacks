-- profiles
CREATE TABLE profiles (id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE, slug_id text UNIQUE NOT NULL, email text UNIQUE, role text NOT NULL DEFAULT 'hacker' CHECK (role IN ('hacker','organizer','maintainer')), is_claimed boolean NOT NULL DEFAULT true, github_username text, bio text, avatar_url text, xp integer NOT NULL DEFAULT 0, is_suspended boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());

-- events
CREATE TABLE events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organizer_id uuid REFERENCES profiles NOT NULL, title text NOT NULL, description text, start_date timestamptz NOT NULL, end_date timestamptz NOT NULL, location text, banner_url text, is_published boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());

-- event_registrations
CREATE TABLE event_registrations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid REFERENCES events NOT NULL, profile_id uuid REFERENCES profiles NOT NULL, attended boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(event_id, profile_id));

-- teams
CREATE TABLE teams (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid REFERENCES events NOT NULL, name text NOT NULL, looking_for_members boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());

-- team_members
CREATE TABLE team_members (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), team_id uuid REFERENCES teams NOT NULL, profile_id uuid REFERENCES profiles NOT NULL, is_captain boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(team_id, profile_id));

-- trust_markers
CREATE TABLE trust_markers (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), profile_id uuid REFERENCES profiles NOT NULL, issuer_id uuid REFERENCES profiles NOT NULL, event_id uuid REFERENCES events, type text NOT NULL DEFAULT 'achievement', title text NOT NULL, description text, is_revoked boolean NOT NULL DEFAULT false, revocation_reason text, crypto_signature text, created_at timestamptz NOT NULL DEFAULT now());

-- projects
CREATE TABLE projects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), team_id uuid REFERENCES teams, event_id uuid REFERENCES events, title text NOT NULL, description text, demo_url text, github_url text, cover_image text, video_url text, tech_stack text[] NOT NULL DEFAULT '{}', github_verified boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());

-- audit_logs
CREATE TABLE audit_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid REFERENCES profiles NOT NULL, action text NOT NULL, target_type text, target_id uuid, metadata jsonb, created_at timestamptz NOT NULL DEFAULT now());

-- skills_endorsements
CREATE TABLE skills_endorsements (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), endorser_id uuid REFERENCES profiles NOT NULL, endorsee_id uuid REFERENCES profiles NOT NULL, skill text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(endorser_id, endorsee_id, skill));

-- photos
CREATE TABLE photos (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_id uuid REFERENCES events NOT NULL, uploader_id uuid REFERENCES profiles NOT NULL, url text NOT NULL, span integer NOT NULL DEFAULT 1, tagged_profiles uuid[] NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now());

-- api_keys
CREATE TABLE api_keys (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), profile_id uuid REFERENCES profiles NOT NULL, key_hash text UNIQUE NOT NULL, name text NOT NULL, is_active boolean NOT NULL DEFAULT true, last_used_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());

-- site_config (singleton)
CREATE TABLE site_config (id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1), maintenance_mode boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now()); INSERT INTO site_config DEFAULT VALUES;

-- batch_jobs
CREATE TABLE batch_jobs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organizer_id uuid REFERENCES profiles NOT NULL, status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','done','failed')), payload jsonb NOT NULL, processed_count integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public profiles viewable" ON profiles FOR SELECT USING (NOT is_suspended);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Non-revoked markers viewable" ON trust_markers FOR SELECT USING (NOT is_revoked);
CREATE POLICY "Organizers insert markers" ON trust_markers FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('organizer','maintainer')));
CREATE POLICY "Maintainers update markers" ON trust_markers FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'maintainer'));
CREATE POLICY "Published events viewable" ON events FOR SELECT USING (is_published OR organizer_id = auth.uid());
CREATE POLICY "Organizers insert events" ON events FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('organizer','maintainer')));
CREATE POLICY "Organizers update own events" ON events FOR UPDATE USING (organizer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'maintainer'));
CREATE POLICY "Projects viewable by all" ON projects FOR SELECT USING (true);
CREATE POLICY "Team members insert projects" ON projects FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM team_members WHERE team_id = projects.team_id AND profile_id = auth.uid()));
CREATE POLICY "Teams viewable" ON teams FOR SELECT USING (true);
CREATE POLICY "Registered hackers create teams" ON teams FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM event_registrations WHERE event_id = teams.event_id AND profile_id = auth.uid()));
CREATE POLICY "Team members viewable" ON team_members FOR SELECT USING (true);
CREATE POLICY "Maintainers view audit logs" ON audit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'maintainer'));
CREATE POLICY "System inserts audit logs" ON audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Users manage own keys" ON api_keys FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "Photos viewable" ON photos FOR SELECT USING (true);
CREATE POLICY "Organizers insert photos" ON photos FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('organizer','maintainer')));
CREATE POLICY "Endorsements viewable" ON skills_endorsements FOR SELECT USING (true);
CREATE POLICY "Users endorse others" ON skills_endorsements FOR INSERT WITH CHECK (auth.uid() = endorser_id);
