-- ============================================================
-- ROBOYUDH 2026 - COMPLETE FRESH DATABASE SETUP
-- ============================================================
-- Created: January 14, 2026
-- Admin Email: abdulsist23@gmail.com
-- Purpose: Clean database setup without any duplicate data or errors
-- ============================================================

-- ============================================================
-- STEP 1: DROP EVERYTHING (Clean Slate)
-- ============================================================

-- Drop all existing policies first
DROP POLICY IF EXISTS "events_read_all" ON events;
DROP POLICY IF EXISTS "events_insert_admin" ON events;
DROP POLICY IF EXISTS "events_update_admin" ON events;
DROP POLICY IF EXISTS "events_delete_permanently_blocked" ON events;
DROP POLICY IF EXISTS "events_delete_admin" ON events;

DROP POLICY IF EXISTS "teams_read_own" ON teams;
DROP POLICY IF EXISTS "teams_insert_own" ON teams;
DROP POLICY IF EXISTS "teams_update_own" ON teams;
DROP POLICY IF EXISTS "teams_delete_admin" ON teams;

DROP POLICY IF EXISTS "team_members_read_own" ON team_members;
DROP POLICY IF EXISTS "team_members_insert_own" ON team_members;
DROP POLICY IF EXISTS "team_members_update_own" ON team_members;
DROP POLICY IF EXISTS "team_members_delete_admin" ON team_members;

DROP POLICY IF EXISTS "payments_read_own" ON payments;
DROP POLICY IF EXISTS "payments_insert_own" ON payments;
DROP POLICY IF EXISTS "payments_update_admin" ON payments;
DROP POLICY IF EXISTS "payments_delete_admin" ON payments;

DROP POLICY IF EXISTS "tickets_read_own" ON tickets;
DROP POLICY IF EXISTS "tickets_insert_own" ON tickets;
DROP POLICY IF EXISTS "tickets_update_admin" ON tickets;
DROP POLICY IF EXISTS "tickets_delete_admin" ON tickets;

DROP POLICY IF EXISTS "leaderboard_read_all" ON leaderboard;
DROP POLICY IF EXISTS "leaderboard_insert_admin" ON leaderboard;
DROP POLICY IF EXISTS "leaderboard_update_admin" ON leaderboard;
DROP POLICY IF EXISTS "leaderboard_delete_admin" ON leaderboard;

DROP POLICY IF EXISTS "registration_details_read_own" ON registration_details;
DROP POLICY IF EXISTS "registration_details_insert_own" ON registration_details;
DROP POLICY IF EXISTS "registration_details_update_admin" ON registration_details;
DROP POLICY IF EXISTS "registration_details_delete_admin" ON registration_details;

-- Drop triggers
DROP TRIGGER IF EXISTS update_leaderboard_rank_trigger ON leaderboard;
DROP TRIGGER IF EXISTS generate_ticket_code_trigger ON tickets;
DROP TRIGGER IF EXISTS events_updated_at_trigger ON events;
DROP TRIGGER IF EXISTS teams_updated_at_trigger ON teams;
DROP TRIGGER IF EXISTS payments_updated_at_trigger ON payments;
DROP TRIGGER IF EXISTS leaderboard_updated_at_trigger ON leaderboard;
DROP TRIGGER IF EXISTS registration_details_updated_at_trigger ON registration_details;

-- Drop functions
DROP FUNCTION IF EXISTS update_leaderboard_rank();
DROP FUNCTION IF EXISTS generate_ticket_code();
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS is_admin();

-- Drop tables (CASCADE will remove all dependencies)
DROP TABLE IF EXISTS registration_details CASCADE;
DROP TABLE IF EXISTS leaderboard CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS events CASCADE;

-- ============================================================
-- STEP 2: CREATE TABLES
-- ============================================================

-- Events Table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('tech', 'non-tech')),
  description TEXT,
  rules TEXT[] DEFAULT '{}',
  price_per_head INTEGER NOT NULL DEFAULT 0,
  max_team_size INTEGER NOT NULL DEFAULT 5,
  image_url TEXT,
  rulebook_url TEXT,
  event_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams Table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  college_name TEXT NOT NULL,
  team_size INTEGER NOT NULL CHECK (team_size > 0),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_onspot BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team Members Table
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments Table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  razorpay_order_id TEXT UNIQUE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'created')),
  payment_ref TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tickets Table
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  ticket_code TEXT NOT NULL UNIQUE,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leaderboard Table
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  rank INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, team_id)
);

-- Registration Details Table
CREATE TABLE registration_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE UNIQUE,
  team_leader_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  gender TEXT,
  mobile_number TEXT NOT NULL,
  email TEXT NOT NULL,
  college_name TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  department TEXT,
  year_of_study TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX idx_teams_event_id ON teams(event_id);
CREATE INDEX idx_teams_created_by ON teams(created_by);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_payments_team_id ON payments(team_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_tickets_team_id ON tickets(team_id);
CREATE INDEX idx_leaderboard_event_id ON leaderboard(event_id);
CREATE INDEX idx_leaderboard_team_id ON leaderboard(team_id);
CREATE INDEX idx_leaderboard_score ON leaderboard(score DESC);
CREATE INDEX idx_registration_details_team_id ON registration_details(team_id);

-- ============================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_details ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 5: CREATE ADMIN FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT auth.jwt() ->> 'email' = 'abdulsist23@gmail.com'
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- STEP 6: RLS POLICIES - EVENTS TABLE
-- ============================================================

CREATE POLICY "events_read_all" ON events
  FOR SELECT
  USING (true);

CREATE POLICY "events_insert_admin" ON events
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "events_update_admin" ON events
  FOR UPDATE
  USING (is_admin());

CREATE POLICY "events_delete_admin" ON events
  FOR DELETE
  USING (is_admin());

-- ============================================================
-- STEP 7: RLS POLICIES - TEAMS TABLE
-- ============================================================

CREATE POLICY "teams_read_own" ON teams
  FOR SELECT
  USING (created_by = auth.uid() OR is_admin());

CREATE POLICY "teams_insert_own" ON teams
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "teams_update_own" ON teams
  FOR UPDATE
  USING (created_by = auth.uid() OR is_admin());

CREATE POLICY "teams_delete_admin" ON teams
  FOR DELETE
  USING (is_admin());

-- ============================================================
-- STEP 8: RLS POLICIES - TEAM_MEMBERS TABLE
-- ============================================================

CREATE POLICY "team_members_read_own" ON team_members
  FOR SELECT
  USING (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY "team_members_insert_own" ON team_members
  FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "team_members_update_own" ON team_members
  FOR UPDATE
  USING (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY "team_members_delete_admin" ON team_members
  FOR DELETE
  USING (is_admin());

-- ============================================================
-- STEP 9: RLS POLICIES - PAYMENTS TABLE
-- ============================================================

CREATE POLICY "payments_read_own" ON payments
  FOR SELECT
  USING (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY "payments_insert_own" ON payments
  FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "payments_update_admin" ON payments
  FOR UPDATE
  USING (is_admin());

CREATE POLICY "payments_delete_admin" ON payments
  FOR DELETE
  USING (is_admin());

-- ============================================================
-- STEP 10: RLS POLICIES - TICKETS TABLE
-- ============================================================

CREATE POLICY "tickets_read_own" ON tickets
  FOR SELECT
  USING (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY "tickets_insert_own" ON tickets
  FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY "tickets_update_admin" ON tickets
  FOR UPDATE
  USING (is_admin());

CREATE POLICY "tickets_delete_admin" ON tickets
  FOR DELETE
  USING (is_admin());

-- ============================================================
-- STEP 11: RLS POLICIES - LEADERBOARD TABLE
-- ============================================================

CREATE POLICY "leaderboard_read_all" ON leaderboard
  FOR SELECT
  USING (true);

CREATE POLICY "leaderboard_insert_admin" ON leaderboard
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "leaderboard_update_admin" ON leaderboard
  FOR UPDATE
  USING (is_admin());

CREATE POLICY "leaderboard_delete_admin" ON leaderboard
  FOR DELETE
  USING (is_admin());

-- ============================================================
-- STEP 12: RLS POLICIES - REGISTRATION_DETAILS TABLE
-- ============================================================

CREATE POLICY "registration_details_read_own" ON registration_details
  FOR SELECT
  USING (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY "registration_details_insert_own" ON registration_details
  FOR INSERT
  WITH CHECK (
    team_id IN (
      SELECT id FROM teams WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "registration_details_update_admin" ON registration_details
  FOR UPDATE
  USING (is_admin());

CREATE POLICY "registration_details_delete_admin" ON registration_details
  FOR DELETE
  USING (is_admin());

-- ============================================================
-- STEP 13: CREATE TRIGGERS
-- ============================================================

-- Leaderboard Rank Auto-Update
CREATE OR REPLACE FUNCTION update_leaderboard_rank()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE leaderboard l
  SET rank = (
    SELECT COUNT(*) + 1
    FROM leaderboard l2
    WHERE l2.event_id = NEW.event_id
    AND l2.score > NEW.score
  )
  WHERE l.id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leaderboard_rank_trigger
AFTER INSERT OR UPDATE ON leaderboard
FOR EACH ROW
EXECUTE FUNCTION update_leaderboard_rank();

-- Ticket Code Generation
CREATE OR REPLACE FUNCTION generate_ticket_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_code := 'TKT' || SUBSTRING(MD5(NEW.id::TEXT || NOW()::TEXT) FROM 1 FOR 8) || FLOOR(RANDOM() * 10000)::TEXT;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_ticket_code_trigger
BEFORE INSERT ON tickets
FOR EACH ROW
EXECUTE FUNCTION generate_ticket_code();

-- Updated_at Timestamp Auto-Update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at_trigger
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER teams_updated_at_trigger
BEFORE UPDATE ON teams
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER payments_updated_at_trigger
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER leaderboard_updated_at_trigger
BEFORE UPDATE ON leaderboard
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER registration_details_updated_at_trigger
BEFORE UPDATE ON registration_details
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 14: INSERT CLEAN EVENT DATA (NO DUPLICATES)
-- ============================================================

INSERT INTO events (name, category, description, rules, price_per_head, max_team_size, image_url, event_date)
VALUES
(
  'RC Racing',
  'tech',
  'Race your RC car through challenging tracks with speed and precision. Test your engineering and driving skills in this high-speed competition.',
  ARRAY[
    'Maximum 5 members per team',
    'RC car must be self-built or modified',
    'Time-based scoring system',
    'Multiple heats with best time counting',
    'Safety gear mandatory for participants'
  ],
  200,
  5,
  '/images/robo_racing.png',
  '2026-02-26'
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
  '/images/RoboSoccer.png',
  '2026-02-27'
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
  '/images/line_follower.png',
  '2026-02-26'
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
  '/images/obstacle_run.png',
  '2026-02-27'
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
  '/images/robo_sumo.png',
  '2026-02-27'
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
  '/images/Game_verse.png',
  '2026-02-26'
);

-- ============================================================
-- STEP 15: VERIFY SETUP
-- ============================================================

-- Display summary
DO $$ 
DECLARE 
  event_count INTEGER;
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO event_count FROM events;
  SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_schema = 'public';
  
  RAISE NOTICE '======================================';
  RAISE NOTICE 'DATABASE SETUP COMPLETE!';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'Tables created: %', table_count;
  RAISE NOTICE 'Events inserted: %', event_count;
  RAISE NOTICE 'Admin email: abdulsist23@gmail.com';
  RAISE NOTICE 'RLS: ENABLED on all tables';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Login with admin email';
  RAISE NOTICE '2. Test event registration';
  RAISE NOTICE '3. Test payment flow';
  RAISE NOTICE '4. Ready for deployment!';
  RAISE NOTICE '======================================';
END $$;

-- ============================================================
-- END OF FRESH SETUP
-- ============================================================
