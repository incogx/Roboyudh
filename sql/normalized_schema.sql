-- Normalized schema for Roboyudh registrations

CREATE TABLE IF NOT EXISTS colleges (
  college_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  category TEXT CHECK (category IN ('tech','non-tech')) NOT NULL,
  price_per_head NUMERIC NOT NULL DEFAULT 0,
  max_team_size INT NOT NULL DEFAULT 1,
  event_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS participants (
  participant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  gender TEXT,
  department TEXT,
  year_of_study TEXT,
  college_id UUID REFERENCES colleges(college_id),
  city TEXT,
  state TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS teams (
  team_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name TEXT NOT NULL,
  college_id UUID REFERENCES colleges(college_id),
  leader_participant_id UUID REFERENCES participants(participant_id),
  team_size INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
  team_id UUID REFERENCES teams(team_id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(participant_id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('leader','member')) DEFAULT 'member',
  PRIMARY KEY (team_id, participant_id)
);

CREATE TABLE IF NOT EXISTS registrations (
  registration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(team_id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(event_id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
  registered_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES registrations(registration_id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
  method TEXT,
  transaction_id TEXT,
  paid_at TIMESTAMPTZ,
  admin_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_events_name ON events(event_name);
CREATE INDEX IF NOT EXISTS idx_colleges_name ON colleges(college_name);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_registrations_team ON registrations(team_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_registration ON payments(registration_id);
