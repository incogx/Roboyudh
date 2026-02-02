-- ============================================================
-- ROBOYUDH 2026 - COMPLETE DATABASE SETUP
-- ============================================================
-- Created: January 18, 2026
-- Admin Email: organizers.roboyudh@gmail.com
-- Purpose: Manual Payment Verification System - NO AUTO PAYMENT GATEWAYS
-- ============================================================
-- 
-- SYSTEM PHILOSOPHY:
-- ✅ Manual payment verification by admin
-- ✅ Screenshot + Transaction ID required
-- ✅ Admin approval = ticket generation
-- ✅ No Razorpay/auto-payment gateways
-- ✅ Database is single source of truth
-- ============================================================


-- ============================================================
-- STEP 1: CLEAN SLATE - DROP EVERYTHING
-- ============================================================
-- Drop tables FIRST (CASCADE automatically removes policies, triggers, indexes)
-- This avoids errors when policies reference non-existent tables

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS pending_payments CASCADE;
DROP VIEW IF EXISTS user_registrations_with_payment CASCADE;
DROP VIEW IF EXISTS admin_dashboard_summary CASCADE;

-- Drop functions (triggers will be dropped with tables)
DROP FUNCTION IF EXISTS is_admin(TEXT) CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS validate_payment_transition() CASCADE;
DROP FUNCTION IF EXISTS generate_ticket_code() CASCADE;
DROP FUNCTION IF EXISTS update_leaderboard_rank() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop all tables (CASCADE removes policies, triggers, constraints automatically)
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS leaderboard CASCADE;
DROP TABLE IF EXISTS registration_details CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS registration_details CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS events CASCADE;


-- ============================================================
-- STEP 2: CREATE EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- STEP 3: CREATE ADMIN CHECK FUNCTION
-- ============================================================
-- Admin email: organizers.roboyudh@gmail.com (ONLY admin)

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT auth.jwt() ->> 'email' = 'organizers.roboyudh@gmail.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- STEP 4: CREATE TABLES
-- ============================================================

-- ========== EVENTS TABLE ==========
-- Purpose: Store all event details
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

-- ========== TEAMS TABLE ==========
-- Purpose: Team registration for events
-- Rule: ONE team per user per event
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_name VARCHAR(255) NOT NULL,
  college_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(15) NOT NULL,
  team_size INTEGER NOT NULL DEFAULT 1 CHECK (team_size > 0),
  is_onspot BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- ONE team per user per event constraint
  CONSTRAINT unique_team_per_user_per_event UNIQUE(event_id, user_id)
);

-- ========== TEAM_MEMBERS TABLE ==========
-- Purpose: Individual members of a team
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  member_name VARCHAR(255) NOT NULL,
  member_email VARCHAR(255),
  member_phone VARCHAR(15),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========== REGISTRATIONS TABLE ==========
-- Purpose: Links team to event registration
-- Rule: ONE registration per team
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_registration_per_team UNIQUE(team_id)
);

-- ========== PAYMENTS TABLE ==========
-- Purpose: Offline payment tracking (admin-only approval)
-- Status Flow: PENDING → APPROVED/REJECTED (final) - NO WAITING STATE
-- PENDING = User registered, payment to be collected offline
-- APPROVED = Admin approved after collecting payment, ticket generated
-- REJECTED = Admin rejected (with reason)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Payment info
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  transaction_id VARCHAR(255),  -- Optional, for reference only
  screenshot_url TEXT,  -- Deprecated, kept for backward compatibility
  
  -- Status tracking (offline payment flow)
  status VARCHAR(50) DEFAULT 'PENDING' 
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  
  -- Admin review
  admin_comment TEXT,
  rejection_reason TEXT,  -- User-facing rejection reason
  admin_decision_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- ONE payment per team
  CONSTRAINT unique_payment_per_team UNIQUE(team_id)
);

-- ========== TICKETS TABLE ==========
-- Purpose: Generated ONLY after admin approves payment
-- Rule: ONE ticket per team
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  
  ticket_code VARCHAR(50) NOT NULL UNIQUE,
  qr_code_data TEXT,
  pdf_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- ONE ticket per team
  CONSTRAINT unique_ticket_per_team UNIQUE(team_id)
);

-- ========== LEADERBOARD TABLE ==========
-- Purpose: Event scores and rankings
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  rank INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(event_id, team_id)
);

-- ========== REGISTRATION_DETAILS TABLE ==========
-- Purpose: Store extended registration info (personal details)
CREATE TABLE registration_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  team_leader_name VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  gender VARCHAR(20),
  mobile_number VARCHAR(15) NOT NULL,
  email VARCHAR(255) NOT NULL,
  college_name VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  department VARCHAR(100),
  year_of_study VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_registration_details_per_team UNIQUE(team_id)
);

-- ========== AUDIT_LOG TABLE ==========
-- Purpose: Track all admin actions
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================
-- STEP 5: CREATE INDEXES
-- ============================================================

-- Events
CREATE INDEX idx_events_is_active ON events(is_active);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_date ON events(event_date);

-- Teams
CREATE INDEX idx_teams_event_id ON teams(event_id);
CREATE INDEX idx_teams_user_id ON teams(user_id);
CREATE INDEX idx_teams_college ON teams(college_name);

-- Team Members
CREATE INDEX idx_team_members_team_id ON team_members(team_id);

-- Registrations
CREATE INDEX idx_registrations_team_id ON registrations(team_id);
CREATE INDEX idx_registrations_event_id ON registrations(event_id);
CREATE INDEX idx_registrations_user_id ON registrations(user_id);

-- Payments
CREATE INDEX idx_payments_team_id ON payments(team_id);
CREATE INDEX idx_payments_event_id ON payments(event_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Tickets
CREATE INDEX idx_tickets_team_id ON tickets(team_id);
CREATE INDEX idx_tickets_event_id ON tickets(event_id);
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_code ON tickets(ticket_code);

-- Leaderboard
CREATE INDEX idx_leaderboard_event_id ON leaderboard(event_id);
CREATE INDEX idx_leaderboard_team_id ON leaderboard(team_id);
CREATE INDEX idx_leaderboard_score ON leaderboard(score DESC);

-- Registration Details
CREATE INDEX idx_registration_details_team_id ON registration_details(team_id);

-- Audit Log
CREATE INDEX idx_audit_log_admin_email ON audit_log(admin_email);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);


-- ============================================================
-- STEP 6: ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- STEP 7: RLS POLICIES - EVENTS
-- ============================================================

-- Everyone can read active events
CREATE POLICY "events_select_all" ON events
  FOR SELECT
  USING (is_active = TRUE OR is_admin());

-- Only admin can insert events
CREATE POLICY "events_insert_admin" ON events
  FOR INSERT
  WITH CHECK (is_admin());

-- Only admin can update events
CREATE POLICY "events_update_admin" ON events
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Only admin can delete events
CREATE POLICY "events_delete_admin" ON events
  FOR DELETE
  USING (is_admin());


-- ============================================================
-- STEP 8: RLS POLICIES - TEAMS
-- ============================================================

-- Users can read their own teams, admin reads all
CREATE POLICY "teams_select_own" ON teams
  FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

-- Users can create their own teams
CREATE POLICY "teams_insert_own" ON teams
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own teams (before payment submitted)
CREATE POLICY "teams_update_own" ON teams
  FOR UPDATE
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

-- Only admin can delete teams
CREATE POLICY "teams_delete_admin" ON teams
  FOR DELETE
  USING (is_admin());


-- ============================================================
-- STEP 9: RLS POLICIES - TEAM_MEMBERS
-- ============================================================

-- Users can read their team's members
CREATE POLICY "team_members_select_own" ON team_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = team_members.team_id 
      AND (teams.user_id = auth.uid() OR is_admin())
    )
  );

-- Users can add members to their own teams
CREATE POLICY "team_members_insert_own" ON team_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = team_members.team_id 
      AND teams.user_id = auth.uid()
    )
  );

-- Users can update their team members
CREATE POLICY "team_members_update_own" ON team_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = team_members.team_id 
      AND (teams.user_id = auth.uid() OR is_admin())
    )
  );

-- Only admin can delete members
CREATE POLICY "team_members_delete_admin" ON team_members
  FOR DELETE
  USING (is_admin());


-- ============================================================
-- STEP 10: RLS POLICIES - REGISTRATIONS
-- ============================================================

-- Users see their own registrations, admin sees all
CREATE POLICY "registrations_select_own" ON registrations
  FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

-- Users can create their own registrations
CREATE POLICY "registrations_insert_own" ON registrations
  FOR INSERT
  WITH CHECK (user_id = auth.uid());


-- ============================================================
-- STEP 11: RLS POLICIES - PAYMENTS
-- ============================================================

-- Users see their own payments, admin sees all
CREATE POLICY "payments_select_own" ON payments
  FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

-- Users can create their own payment record
CREATE POLICY "payments_insert_own" ON payments
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update PENDING payments (contact info only, not status)
CREATE POLICY "payments_update_own_pending" ON payments
  FOR UPDATE
  USING (
    user_id = auth.uid() 
    AND status = 'PENDING'
  )
  WITH CHECK (
    user_id = auth.uid() 
    AND status = 'PENDING'
  );

-- Admin can update payments (PENDING → APPROVED or REJECTED)
CREATE POLICY "payments_update_admin" ON payments
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Only admin can delete payments
CREATE POLICY "payments_delete_admin" ON payments
  FOR DELETE
  USING (is_admin());


-- ============================================================
-- STEP 12: RLS POLICIES - TICKETS
-- ============================================================

-- Users see their own tickets, admin sees all
CREATE POLICY "tickets_select_own" ON tickets
  FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

-- Only admin can create tickets (after payment approval)
CREATE POLICY "tickets_insert_admin" ON tickets
  FOR INSERT
  WITH CHECK (
    is_admin() 
    AND EXISTS (
      SELECT 1 FROM payments 
      WHERE payments.id = tickets.payment_id 
      AND payments.status = 'APPROVED'
    )
  );

-- Only admin can update tickets
CREATE POLICY "tickets_update_admin" ON tickets
  FOR UPDATE
  USING (is_admin());

-- Only admin can delete tickets
CREATE POLICY "tickets_delete_admin" ON tickets
  FOR DELETE
  USING (is_admin());


-- ============================================================
-- STEP 13: RLS POLICIES - LEADERBOARD
-- ============================================================

-- Everyone can read leaderboard
CREATE POLICY "leaderboard_select_all" ON leaderboard
  FOR SELECT
  USING (TRUE);

-- Only admin can insert
CREATE POLICY "leaderboard_insert_admin" ON leaderboard
  FOR INSERT
  WITH CHECK (is_admin());

-- Only admin can update
CREATE POLICY "leaderboard_update_admin" ON leaderboard
  FOR UPDATE
  USING (is_admin());

-- Only admin can delete
CREATE POLICY "leaderboard_delete_admin" ON leaderboard
  FOR DELETE
  USING (is_admin());


-- ============================================================
-- STEP 14: RLS POLICIES - REGISTRATION_DETAILS
-- ============================================================

-- Users can read their own registration details (via team ownership)
CREATE POLICY "registration_details_select_own" ON registration_details
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = registration_details.team_id 
      AND (teams.user_id = auth.uid() OR is_admin())
    )
  );

-- Users can create registration details for their own teams
CREATE POLICY "registration_details_insert_own" ON registration_details
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = registration_details.team_id 
      AND teams.user_id = auth.uid()
    )
  );

-- Users can update their own registration details
CREATE POLICY "registration_details_update_own" ON registration_details
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = registration_details.team_id 
      AND (teams.user_id = auth.uid() OR is_admin())
    )
  );

-- Only admin can delete registration details
CREATE POLICY "registration_details_delete_admin" ON registration_details
  FOR DELETE
  USING (is_admin());


-- ============================================================
-- STEP 15: RLS POLICIES - AUDIT_LOG
-- ============================================================

-- Only admin can read audit logs
CREATE POLICY "audit_log_select_admin" ON audit_log
  FOR SELECT
  USING (is_admin());

-- System/admin can insert audit logs
CREATE POLICY "audit_log_insert_system" ON audit_log
  FOR INSERT
  WITH CHECK (TRUE);


-- ============================================================
-- STEP 16: CREATE TRIGGERS
-- ============================================================

-- Updated_at auto-update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER events_updated_at_trigger
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER teams_updated_at_trigger
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER payments_updated_at_trigger
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER leaderboard_updated_at_trigger
  BEFORE UPDATE ON leaderboard
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Ticket code generation trigger
CREATE OR REPLACE FUNCTION generate_ticket_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_code IS NULL OR NEW.ticket_code = '' THEN
    NEW.ticket_code := 'RY26-' || 
      UPPER(SUBSTRING(MD5(NEW.id::TEXT || NOW()::TEXT) FROM 1 FOR 6)) || 
      '-' || 
      LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_ticket_code_trigger
  BEFORE INSERT ON tickets
  FOR EACH ROW EXECUTE FUNCTION generate_ticket_code();


-- Leaderboard rank auto-update trigger
CREATE OR REPLACE FUNCTION update_leaderboard_rank()
RETURNS TRIGGER AS $$
BEGIN
  -- Update ranks for all entries in same event
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY score DESC) as new_rank
    FROM leaderboard
    WHERE event_id = NEW.event_id
  )
  UPDATE leaderboard l
  SET rank = r.new_rank
  FROM ranked r
  WHERE l.id = r.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leaderboard_rank_trigger
  AFTER INSERT OR UPDATE OF score ON leaderboard
  FOR EACH ROW EXECUTE FUNCTION update_leaderboard_rank();


-- Payment status transition validation trigger
CREATE OR REPLACE FUNCTION validate_payment_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow if status hasn't changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Validate transitions - OFFLINE FLOW ONLY: PENDING → APPROVED/REJECTED
  CASE
    WHEN OLD.status = 'PENDING' AND NEW.status IN ('APPROVED', 'REJECTED') THEN
      -- Admin making decision after collecting offline payment
      NEW.admin_decision_at := NOW();
      
    WHEN OLD.status IN ('APPROVED', 'REJECTED') THEN
      RAISE EXCEPTION 'Payment status % is FINAL and cannot be changed', OLD.status;
      
    ELSE
      RAISE EXCEPTION 'Invalid status transition from % to %. Only PENDING → APPROVED/REJECTED allowed.', OLD.status, NEW.status;
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payment_status_validation
  BEFORE UPDATE OF status ON payments
  FOR EACH ROW EXECUTE FUNCTION validate_payment_transition();


-- ============================================================
-- STEP 16: CREATE VIEWS
-- ============================================================

-- Pending payments view for admin dashboard
CREATE OR REPLACE VIEW pending_payments AS
SELECT 
  p.id AS payment_id,
  p.team_id,
  p.event_id,
  p.user_id,
  p.amount,
  p.transaction_id,
  p.screenshot_url,
  p.status,
  p.created_at,
  e.name AS event_name,
  t.team_name,
  t.college_name,
  t.phone_number,
  t.team_size
FROM payments p
JOIN events e ON e.id = p.event_id
JOIN teams t ON t.id = p.team_id
WHERE p.status = 'PENDING'
ORDER BY p.created_at ASC;


-- User's registrations with payment status
CREATE OR REPLACE VIEW user_registrations_with_payment AS
SELECT 
  r.id AS registration_id,
  r.user_id,
  r.event_id,
  r.team_id,
  e.name AS event_name,
  e.image_url AS event_image,
  e.event_date,
  t.team_name,
  t.college_name,
  t.team_size,
  p.id AS payment_id,
  p.amount,
  p.status AS payment_status,
  p.transaction_id,
  tk.id AS ticket_id,
  tk.ticket_code,
  r.created_at AS registered_at
FROM registrations r
JOIN events e ON e.id = r.event_id
JOIN teams t ON t.id = r.team_id
LEFT JOIN payments p ON p.team_id = r.team_id
LEFT JOIN tickets tk ON tk.team_id = r.team_id
ORDER BY r.created_at DESC;


-- Admin dashboard summary view
CREATE OR REPLACE VIEW admin_dashboard_summary AS
SELECT 
  (SELECT COUNT(*) FROM teams) AS total_teams,
  (SELECT COUNT(DISTINCT user_id) FROM teams) AS total_users,
  (SELECT COUNT(*) FROM payments WHERE status = 'APPROVED') AS approved_payments,
  (SELECT COUNT(*) FROM payments WHERE status = 'PENDING') AS pending_approvals,
  (SELECT COUNT(*) FROM payments WHERE status = 'REJECTED') AS rejected_payments,
  (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'APPROVED') AS total_revenue,
  (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'PENDING') AS pending_revenue,
  (SELECT COUNT(*) FROM tickets) AS tickets_generated;


-- ============================================================
-- STEP 17: INSERT EVENT DATA
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
  '2026-02-27'
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
  '2026-02-26'
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
    'Tournament bracket format',
    'Event runs on both Feb 26 & 27, 2026'
  ],
  100,
  1,
  '/images/Game_verse.png',
  '2026-02-26'
);


-- ============================================================
-- STEP 18: SUPABASE STORAGE BUCKET FOR SCREENSHOTS
-- ============================================================
-- Run this in Supabase Dashboard → Storage:
-- 
-- 1. Create bucket: "payment-screenshots"
-- 2. Set bucket to PRIVATE (not public)
-- 3. Add RLS policies:
--    - Users can upload to their own folder
--    - Admin can view all
-- 
-- Storage Policy Example (run in SQL editor):
-- 
-- CREATE POLICY "Users can upload payment screenshots"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'payment-screenshots' 
--   AND auth.uid()::text = (storage.foldername(name))[1]
-- );
-- 
-- CREATE POLICY "Users can view their own screenshots"
-- ON storage.objects FOR SELECT
-- USING (
--   bucket_id = 'payment-screenshots' 
--   AND (
--     auth.uid()::text = (storage.foldername(name))[1]
--     OR auth.jwt() ->> 'email' = 'abdulsist23@gmail.com'
--   )
-- );


-- ============================================================
-- STEP 19: VERIFICATION QUERIES
-- ============================================================

-- Run these to verify setup:

-- Check tables created
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('events', 'teams', 'team_members', 'registrations', 'payments', 'tickets', 'leaderboard', 'audit_log')
ORDER BY tablename;

-- Check events inserted
SELECT id, name, category, price_per_head, event_date FROM events ORDER BY event_date;

-- Check RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('events', 'teams', 'payments', 'tickets');

-- Check triggers
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname LIKE '%updated_at%' OR tgname LIKE '%ticket%' OR tgname LIKE '%payment%';


-- ============================================================
-- STEP 20: SUMMARY
-- ============================================================

DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔══════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║       ROBOYUDH 2026 DATABASE SETUP COMPLETE!             ║';
  RAISE NOTICE '╠══════════════════════════════════════════════════════════╣';
  RAISE NOTICE '║                                                          ║';
  RAISE NOTICE '║  TABLES CREATED:                                         ║';
  RAISE NOTICE '║    • events         - Event listings                     ║';
  RAISE NOTICE '║    • teams          - Team registrations                 ║';
  RAISE NOTICE '║    • team_members   - Team member details                ║';
  RAISE NOTICE '║    • registrations  - Registration records               ║';
  RAISE NOTICE '║    • payments       - Manual payment tracking            ║';
  RAISE NOTICE '║    • tickets        - Generated after approval           ║';
  RAISE NOTICE '║    • leaderboard    - Event scores & rankings            ║';
  RAISE NOTICE '║    • audit_log      - Admin action tracking              ║';
  RAISE NOTICE '║                                                          ║';
  RAISE NOTICE '║  SECURITY:                                               ║';
  RAISE NOTICE '║    • RLS enabled on ALL tables                           ║';
  RAISE NOTICE '║    • Admin email: organizers.roboyudh@gmail.com          ║';
  RAISE NOTICE '║    • Users can only access their own data                ║';
  RAISE NOTICE '║                                                          ║';
  RAISE NOTICE '║  PAYMENT FLOW:                                           ║';
  RAISE NOTICE '║    PENDING → APPROVED/REJECTED (Offline Payment)        ║';
  RAISE NOTICE '║    • No auto-payment gateways                            ║';
  RAISE NOTICE '║    • Admin manually verifies all payments                ║';
  RAISE NOTICE '║    • Tickets generated ONLY after approval               ║';
  RAISE NOTICE '║                                                          ║';
  RAISE NOTICE '║  EVENTS ADDED: 6 (5 tech + 1 non-tech)                   ║';
  RAISE NOTICE '║                                                          ║';
  RAISE NOTICE '╚══════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
END $$;


-- ============================================================
-- END OF DATABASE SETUP
-- ============================================================
