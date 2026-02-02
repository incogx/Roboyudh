-- ============================================================
-- ROBOYUDH 2026 - CLEAN DATABASE SETUP (NO ERRORS)
-- ============================================================
-- Admin Email: organizers.roboyudh@gmail.com
-- Tables: events, teams, team_members, registrations, payments, tickets
-- RLS: YES (Secure - users see own data only)
-- Audit Log: NO
-- ============================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ADMIN CHECK FUNCTION
CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_email = 'organizers.roboyudh@gmail.com';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- TABLE 1: EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'tech' CHECK (category IN ('tech', 'non-tech')),
  description TEXT DEFAULT '',
  rules TEXT[] DEFAULT '{}',
  event_date DATE,
  max_team_size INTEGER DEFAULT 5,
  price_per_head INTEGER DEFAULT 0,
  image_url TEXT,
  rulebook_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active);

-- RLS: Events visible to all
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "events_select_all" ON events;
CREATE POLICY "events_select_all" ON events FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "events_insert_admin" ON events;
CREATE POLICY "events_insert_admin" ON events FOR INSERT 
  WITH CHECK (is_admin((current_setting('request.jwt.claims', true)::jsonb ->> 'email')));

-- ============================================================
-- TABLE 2: TEAMS
-- ============================================================
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  team_name VARCHAR(255) NOT NULL,
  college_name VARCHAR(255) DEFAULT '',
  phone_number VARCHAR(15),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_team_per_user_per_event UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_teams_event_id ON teams(event_id);
CREATE INDEX IF NOT EXISTS idx_teams_user_id ON teams(user_id);

-- RLS: Users see own teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "teams_select_own" ON teams;
CREATE POLICY "teams_select_own" ON teams FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "teams_insert_own" ON teams;
CREATE POLICY "teams_insert_own" ON teams FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================
-- TABLE 3: TEAM MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  member_name VARCHAR(255) NOT NULL,
  member_email VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);

-- RLS: Users see own team members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "team_members_select_own" ON team_members;
CREATE POLICY "team_members_select_own" ON team_members FOR SELECT 
  USING (EXISTS (SELECT 1 FROM teams WHERE teams.id = team_members.team_id AND teams.user_id = auth.uid()));

DROP POLICY IF EXISTS "team_members_insert_own" ON team_members;
CREATE POLICY "team_members_insert_own" ON team_members FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM teams WHERE teams.id = team_members.team_id AND teams.user_id = auth.uid()));

-- ============================================================
-- TABLE 4: REGISTRATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_registration_per_team UNIQUE(team_id)
);

CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations(event_id);

-- RLS: Users see own registrations
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "registrations_select_own" ON registrations;
CREATE POLICY "registrations_select_own" ON registrations FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "registrations_insert_own" ON registrations;
CREATE POLICY "registrations_insert_own" ON registrations FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================
-- TABLE 5: PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  rejection_reason TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_payment_per_team UNIQUE(team_id)
);

CREATE INDEX IF NOT EXISTS idx_payments_team_id ON payments(team_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- TRIGGER: Payment state validation
CREATE OR REPLACE FUNCTION validate_payment_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF OLD.status = 'PENDING' AND NEW.status NOT IN ('APPROVED', 'REJECTED') THEN
    RAISE EXCEPTION 'Payment can only go from PENDING to APPROVED or REJECTED';
  END IF;
  IF OLD.status IN ('APPROVED', 'REJECTED') THEN
    RAISE EXCEPTION 'Payment status is LOCKED (final state)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_validation ON payments;
CREATE TRIGGER trg_payment_validation BEFORE UPDATE OF status ON payments
  FOR EACH ROW EXECUTE FUNCTION validate_payment_transition();

-- RLS: Users see own payments, admins see all
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments_select_own" ON payments;
CREATE POLICY "payments_select_own" ON payments FOR SELECT 
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "payments_select_admin" ON payments;
CREATE POLICY "payments_select_admin" ON payments FOR SELECT 
  USING (is_admin((current_setting('request.jwt.claims', true)::jsonb ->> 'email')));

DROP POLICY IF EXISTS "payments_insert_own" ON payments;
CREATE POLICY "payments_insert_own" ON payments FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "payments_update_admin" ON payments;
CREATE POLICY "payments_update_admin" ON payments FOR UPDATE 
  USING (is_admin((current_setting('request.jwt.claims', true)::jsonb ->> 'email')))
  WITH CHECK (is_admin((current_setting('request.jwt.claims', true)::jsonb ->> 'email')));

-- ============================================================
-- TABLE 6: TICKETS
-- ============================================================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  ticket_code VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_payment_id ON tickets(payment_id);
CREATE INDEX IF NOT EXISTS idx_tickets_team_id ON tickets(team_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);

-- RLS: Users see own tickets, admins see all
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tickets_select_own" ON tickets;
CREATE POLICY "tickets_select_own" ON tickets FOR SELECT 
  USING (user_id = auth.uid() OR is_admin((current_setting('request.jwt.claims', true)::jsonb ->> 'email')));

DROP POLICY IF EXISTS "tickets_insert_admin" ON tickets;
CREATE POLICY "tickets_insert_admin" ON tickets FOR INSERT 
  WITH CHECK (is_admin((current_setting('request.jwt.claims', true)::jsonb ->> 'email')));

-- ============================================================
-- SEED DATA (6 Events - Correct Pricing & Team Sizes)
-- ============================================================
-- PRICING RULES:
-- - All technical events: ₹200 per head, 2-5 members per team
-- - GameVerse: ₹200 per head, 2 members per team (exactly 2)
-- ============================================================
INSERT INTO events (id, name, category, description, rules, event_date, max_team_size, price_per_head, image_url, rulebook_url, is_active)
VALUES
  (
    '550e8400-e29b-41d4-a716-446655440001', 
    'Line Follower', 
    'tech', 
    'Autonomous robot follows a line course with maximum speed and accuracy. The ultimate test of sensor calibration and programming.',
    ARRAY[
      'Minimum 2 members, Maximum 5 members per team',
      'Autonomous navigation only - no manual control',
      'Fastest completion wins',
      'Robot must stay on the line throughout',
      'Penalties for leaving track or stopping',
      'Price: ₹200 per head'
    ],
    '2026-02-26', 
    5, 
    200, 
    '/images/line_follower.png',
    '/rulebooks/line_follower.pdf',
    TRUE
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002', 
    'RC Racing', 
    'tech', 
    'Race your RC car through challenging tracks with speed and precision. Test your engineering and driving skills in this high-speed competition.',
    ARRAY[
      'Minimum 2 members, Maximum 5 members per team',
      'RC car must be self-built or modified',
      'Time-based scoring system',
      'Multiple heats with best time counting',
      'Safety gear mandatory for participants',
      'Price: ₹200 per head'
    ],
    '2026-02-27', 
    5, 
    200, 
    '/images/robo_racing.png',
    '/rulebooks/rc_racing.pdf',
    TRUE
  ),
  (
    '550e8400-e29b-41d4-a716-446655440003', 
    'RoboSumo', 
    'tech', 
    'Battle robots in a sumo ring. Push your opponent out to win! Pure robot combat with strategy and power.',
    ARRAY[
      'Minimum 2 members, Maximum 5 members per team',
      'Weight limit: 3kg maximum',
      'Size limit: 20cm x 20cm base',
      'Knockout style elimination tournament',
      'No projectiles or liquid weapons allowed',
      'Price: ₹200 per head'
    ],
    '2026-02-27', 
    5, 
    200, 
    '/images/robo_sumo.png',
    '/rulebooks/robo_sumo.pdf',
    TRUE
  ),
  (
    '550e8400-e29b-41d4-a716-446655440004', 
    'RoboSoccer', 
    'tech', 
    'Build robots that can play soccer autonomously or with manual control. Strategy meets engineering in this team competition.',
    ARRAY[
      'Minimum 2 members, Maximum 5 members per team',
      'Robots must fit size specifications (30cm x 30cm x 30cm)',
      'Match duration: 10 minutes per half',
      'Manual or autonomous control allowed',
      'Ball detection and kicking mechanisms required',
      'Price: ₹200 per head'
    ],
    '2026-02-27', 
    5, 
    200, 
    '/images/RoboSoccer.png',
    '/rulebooks/robo_soccer.pdf',
    TRUE
  ),
  (
    '550e8400-e29b-41d4-a716-446655440005', 
    'GameVerse', 
    'non-tech', 
    'Compete in multiple gaming categories for the ultimate gaming championship. From strategy to action, test your gaming prowess across various titles.',
    ARRAY[
      'Exactly 2 members per team (Minimum 2, Maximum 2)',
      'Multiple game categories (PUBG Mobile, COD Mobile, Free Fire, Valorant)',
      'Fair play and sportsmanship required',
      'No cheating or external tools allowed',
      'Tournament bracket format',
      'Price: ₹100 per head'
    ],
    '2026-02-26', 
    2, 
    100, 
    '/images/Game_verse.png',
    '/rulebooks/game_verse.pdf',
    TRUE
  ),
  (
    '550e8400-e29b-41d4-a716-446655440006', 
    'Obstacle Run', 
    'tech', 
    'Navigate your robot through complex obstacles and challenging terrain. Test your robot''s mobility and control systems.',
    ARRAY[
      'Minimum 2 members, Maximum 5 members per team',
      'Manual or autonomous control allowed',
      'Points for each obstacle cleared',
      'Time bonus for faster completion',
      'Multiple obstacle types including ramps, barriers, and narrow passages',
      'Price: ₹200 per head'
    ],
    '2026-02-27', 
    5, 
    200, 
    '/images/obstacle_run.png',
    '/rulebooks/obstacle_run.pdf',
    TRUE
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  rules = EXCLUDED.rules,
  event_date = EXCLUDED.event_date,
  max_team_size = EXCLUDED.max_team_size,
  price_per_head = EXCLUDED.price_per_head,
  image_url = EXCLUDED.image_url,
  rulebook_url = EXCLUDED.rulebook_url,
  is_active = EXCLUDED.is_active;

-- ============================================================
-- END
-- ============================================================
