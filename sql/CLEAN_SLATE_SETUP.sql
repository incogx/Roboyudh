-- ============================================================
-- ROBOYUDH 2026 - COMPLETE CLEAN DATABASE SETUP
-- This script creates a fresh database from scratch
-- Run in Supabase SQL Editor to reset everything
-- ============================================================

-- Step 1: DROP ALL EXISTING TABLES (clean slate)
DROP TABLE IF EXISTS leaderboard CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS registration_details CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS events CASCADE;

-- ============================================================
-- Step 2: CREATE EVENTS TABLE
-- ============================================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('tech', 'non-tech')),
  description TEXT,
  rules TEXT[],
  price_per_head DECIMAL(10, 2) NOT NULL,
  max_team_size INT NOT NULL,
  image_url VARCHAR(512),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_category ON events(category);

-- ============================================================
-- Step 3: CREATE TEAMS TABLE
-- ============================================================

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  team_name VARCHAR(255) NOT NULL,
  college_name VARCHAR(255) NOT NULL,
  team_size INT NOT NULL CHECK (team_size > 0 AND team_size <= 20),
  created_by UUID NOT NULL,
  is_onspot BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teams_event_id ON teams(event_id);
CREATE INDEX idx_teams_created_by ON teams(created_by);
CREATE INDEX idx_teams_created_at ON teams(created_at);

-- ============================================================
-- Step 4: CREATE TEAM MEMBERS TABLE
-- ============================================================

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  member_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_team_members_team_id ON team_members(team_id);

-- ============================================================
-- Step 5: CREATE REGISTRATION DETAILS TABLE
-- ============================================================

CREATE TABLE registration_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  team_leader_name VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  gender VARCHAR(50),
  mobile_number VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  college_name VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  department VARCHAR(100),
  year_of_study VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_registration_details_team_id ON registration_details(team_id);

-- ============================================================
-- Step 6: CREATE PAYMENTS TABLE
-- ============================================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  razorpay_order_id TEXT UNIQUE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  status VARCHAR(50) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'created')),
  payment_ref VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_team_id ON payments(team_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX idx_payments_razorpay_order_id ON payments(razorpay_order_id);

-- ============================================================
-- Step 7: CREATE TICKETS TABLE
-- ============================================================

CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  ticket_code VARCHAR(50) NOT NULL UNIQUE,
  pdf_url VARCHAR(512),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tickets_team_id ON tickets(team_id);
CREATE INDEX idx_tickets_ticket_code ON tickets(ticket_code);

-- ============================================================
-- Step 8: CREATE LEADERBOARD TABLE
-- ============================================================

CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  score INT NOT NULL DEFAULT 0,
  rank INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, team_id)
);

CREATE INDEX idx_leaderboard_event_id ON leaderboard(event_id);
CREATE INDEX idx_leaderboard_team_id ON leaderboard(team_id);

-- ============================================================
-- Step 9: CREATE TRIGGERS FOR AUTO-GENERATION
-- ============================================================

-- Trigger to auto-generate ticket code
CREATE OR REPLACE FUNCTION generate_ticket_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_code := 'RBYD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(CAST(FLOOR(RANDOM() * 10000) AS TEXT), 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_ticket_code ON tickets;
CREATE TRIGGER trigger_generate_ticket_code
BEFORE INSERT ON tickets
FOR EACH ROW
EXECUTE FUNCTION generate_ticket_code();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_timestamp_events ON events;
CREATE TRIGGER trigger_update_timestamp_events BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_update_timestamp_teams ON teams;
CREATE TRIGGER trigger_update_timestamp_teams BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_update_timestamp_payments ON payments;
CREATE TRIGGER trigger_update_timestamp_payments BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_update_timestamp_registration_details ON registration_details;
CREATE TRIGGER trigger_update_timestamp_registration_details BEFORE UPDATE ON registration_details FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- Step 10: INSERT EVENTS (ROBOYUDH 2026 - Feb 26-27)
-- ============================================================

INSERT INTO events (name, category, description, rules, price_per_head, max_team_size, image_url) VALUES
(
  'RC Racing',
  'tech',
  'Build and race remote-controlled robots on challenging tracks. Test your engineering and piloting skills in this high-speed competition.',
  ARRAY[
    'Maximum 5 members per team',
    'Robot must fit size specifications (30cm x 30cm x 30cm)',
    'Multiple heats with best time counting',
    'Safety gear mandatory for participants'
  ],
  200,
  5,
  '/images/robo_racing.png'
),
(
  'Robo Soccer',
  'tech',
  'Build robots that can play soccer autonomously or with manual control. Strategy meets engineering in this team competition.',
  ARRAY[
    'Maximum 5 members per team',
    'Robots must fit size specifications (30cm x 30cm x 30cm)',
    'Match duration: 10 minutes per half',
    'Manual or autonomous control allowed',
    'Ball detection and kicking mechanisms required'
  ],
  200,
  5,
  '/images/RoboSoccer.png'
),
(
  'Line Follower',
  'tech',
  'Program your robot to follow a line course with maximum speed and accuracy. The ultimate test of sensor calibration and programming.',
  ARRAY[
    'Maximum 5 members per team',
    'Autonomous navigation only - no manual control',
    'Fastest completion wins',
    'Robot must stay on the line throughout',
    'Penalties for leaving track or stopping'
  ],
  200,
  5,
  '/images/line_follower.png'
),
(
  'Obstacle Run',
  'tech',
  'Navigate your robot through complex obstacles and challenging terrain. Test your robot''s mobility and control systems.',
  ARRAY[
    'Maximum 5 members per team',
    'Manual or autonomous control allowed',
    'Points for each obstacle cleared',
    'Time bonus for faster completion',
    'Multiple obstacle types including ramps, barriers, and narrow passages'
  ],
  200,
  5,
  '/images/obstacle_run.png'
),
(
  'Robo Sumo',
  'tech',
  'Battle robots in a sumo ring. Push your opponent out to win! Pure robot combat with strategy and power.',
  ARRAY[
    'Maximum 5 members per team',
    'Weight limit: 3kg maximum',
    'Size limit: 20cm x 20cm base',
    'Knockout style elimination tournament',
    'No projectiles or liquid weapons allowed'
  ],
  200,
  5,
  '/images/robo_sumo.png'
),
(
  'Game Verse',
  'non-tech',
  'Compete in multiple gaming categories for the ultimate gaming championship. From strategy to action, test your gaming prowess across various titles.',
  ARRAY[
    'Individual participation only',
    'Multiple game categories (PUBG Mobile, COD Mobile, Free Fire, Valorant)',
    'Fair play and sportsmanship required',
    'No cheating or external tools allowed',
    'Tournament bracket format'
  ],
  100,
  1,
  '/images/Game_verse.png'
);

-- ============================================================
-- Step 11: ENABLE ROW-LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Step 12: CREATE RLS POLICIES
-- ============================================================

-- EVENTS: Public read
CREATE POLICY "Events are publicly readable"
  ON events FOR SELECT
  USING (true);

CREATE POLICY "Only admin can insert events"
  ON events FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'abdulsist23@gmail.com');

CREATE POLICY "Only admin can update events"
  ON events FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'abdulsist23@gmail.com');

CREATE POLICY "Only admin can delete events"
  ON events FOR DELETE
  USING (auth.jwt() ->> 'email' = 'abdulsist23@gmail.com');

-- TEAMS: Users can only access their own teams
CREATE POLICY "Users can select their own teams"
  ON teams FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can create teams"
  ON teams FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own teams"
  ON teams FOR UPDATE
  USING (created_by = auth.uid());

-- TEAM MEMBERS: Users can manage members of their teams
CREATE POLICY "Users can select team members from their teams"
  ON team_members FOR SELECT
  USING (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can add members to their teams"
  ON team_members FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete members from their teams"
  ON team_members FOR DELETE
  USING (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

-- REGISTRATION DETAILS: Users can only access their own
CREATE POLICY "Users can select their own registration details"
  ON registration_details FOR SELECT
  USING (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create registration details for their teams"
  ON registration_details FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update their own registration details"
  ON registration_details FOR UPDATE
  USING (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Admin can read all registration details"
  ON registration_details FOR SELECT
  USING (auth.jwt() ->> 'email' = 'abdulsist23@gmail.com');

-- PAYMENTS: Users can only access their own payments
CREATE POLICY "Users can select their own payments"
  ON payments FOR SELECT
  USING (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create payments for their teams"
  ON payments FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Admin can read all payments"
  ON payments FOR SELECT
  USING (auth.jwt() ->> 'email' = 'abdulsist23@gmail.com');

CREATE POLICY "Admin can update payments"
  ON payments FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'abdulsist23@gmail.com');

-- TICKETS: Users can only access their own tickets
CREATE POLICY "Users can select their own tickets"
  ON tickets FOR SELECT
  USING (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create tickets for their teams"
  ON tickets FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Admin can read all tickets"
  ON tickets FOR SELECT
  USING (auth.jwt() ->> 'email' = 'abdulsist23@gmail.com');

-- LEADERBOARD: Public read, admin write
CREATE POLICY "Leaderboard is publicly readable"
  ON leaderboard FOR SELECT
  USING (true);

CREATE POLICY "Only admin can insert leaderboard entries"
  ON leaderboard FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = 'abdulsist23@gmail.com');

CREATE POLICY "Only admin can update leaderboard"
  ON leaderboard FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'abdulsist23@gmail.com');

-- ============================================================
-- Step 13: VERIFY SETUP
-- ============================================================

-- Check table counts
SELECT 'SETUP COMPLETE!' as status;
SELECT COUNT(*) as event_count FROM events;
SELECT COUNT(*) as teams_count FROM teams;
SELECT COUNT(*) as payments_count FROM payments;
SELECT COUNT(*) as tickets_count FROM tickets;

-- ============================================================
-- END OF SETUP SCRIPT
-- ============================================================
