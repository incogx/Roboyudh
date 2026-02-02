-- ============================================================
-- ROBOYUDH 2026 - COMPLETE DATABASE SETUP (ALL-IN-ONE)
-- ============================================================
-- Created: February 2, 2026
-- Admin Email: organizers.roboyudh@gmail.com
-- Payment Flow: OFFLINE ONLY (PENDING → APPROVED/REJECTED)
-- Purpose: Complete offline payment system - NO AUTO PAYMENT GATEWAYS
-- ============================================================

-- SYSTEM PHILOSOPHY (FROM README):
-- ✅ Manual payment verification by admin
-- ✅ No online payment gateways (Razorpay, Stripe, etc.)
-- ✅ Admin collects cash offline
-- ✅ Admin clicks "Approve" → Ticket generated → Email sent
-- ✅ OR Admin clicks "Reject" with reason → Email sent
-- ✅ Users see rejection reason immediately
-- ✅ Simple, transparent, offline-first

-- ============================================================
-- A. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- B. UTILITY FUNCTIONS
-- ============================================================

-- Function: is_admin(user_email TEXT)
-- Purpose: Email-based admin check ONLY
-- Input: Email string
-- Returns: TRUE only if email = 'organizers.roboyudh@gmail.com'
CREATE OR REPLACE FUNCTION is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN user_email = 'organizers.roboyudh@gmail.com';
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- ============================================================
-- C. TABLES (In dependency order)
-- ============================================================

-- Table: events
-- Purpose: Event master data
CREATE TABLE IF NOT EXISTS events (
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

DROP INDEX IF EXISTS idx_events_is_active;
CREATE INDEX idx_events_is_active ON events(is_active);


-- Table: teams
-- Constraint: ONE team per user per event
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_name VARCHAR(255) NOT NULL,
  college_name VARCHAR(255),
  phone_number VARCHAR(15) NOT NULL,
  team_size INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_team_per_user_per_event UNIQUE(event_id, user_id)
);

DROP INDEX IF EXISTS idx_teams_event_id;
CREATE INDEX idx_teams_event_id ON teams(event_id);
DROP INDEX IF EXISTS idx_teams_user_id;
CREATE INDEX idx_teams_user_id ON teams(user_id);


-- Table: team_members
-- Purpose: Individual team members
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  member_name VARCHAR(255) NOT NULL,
  member_email VARCHAR(255),
  member_phone VARCHAR(15),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP INDEX IF EXISTS idx_team_members_team_id;
CREATE INDEX idx_team_members_team_id ON team_members(team_id);


-- Table: registrations
-- Purpose: Registration record linking user to event
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_registration_per_team UNIQUE(team_id)
);

DROP INDEX IF EXISTS idx_registrations_user_id;
CREATE INDEX idx_registrations_user_id ON registrations(user_id);
DROP INDEX IF EXISTS idx_registrations_event_id;
CREATE INDEX idx_registrations_event_id ON registrations(event_id);
DROP INDEX IF EXISTS idx_registrations_team_id;
CREATE INDEX idx_registrations_team_id ON registrations(team_id);


-- Table: payments
-- PAYMENT FLOW: PENDING → APPROVED/REJECTED (OFFLINE ONLY - NO WAITING STATE)
-- Status values: PENDING | APPROVED | REJECTED
-- Constraint: ONE payment per team
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  transaction_id VARCHAR(255),
  screenshot_file_path VARCHAR(500),
  
  -- Status: PENDING → APPROVED/REJECTED (NO WAITING - offline payment flow)
  status VARCHAR(50) DEFAULT 'PENDING' 
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  
  -- Admin decision
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_comment TEXT,
  rejection_reason TEXT,  -- User-facing reason if rejected
  admin_decision_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_payment_per_team UNIQUE(team_id)
);

DROP INDEX IF EXISTS idx_payments_team_id;
CREATE INDEX idx_payments_team_id ON payments(team_id);
DROP INDEX IF EXISTS idx_payments_user_id;
CREATE INDEX idx_payments_user_id ON payments(user_id);
DROP INDEX IF EXISTS idx_payments_status;
CREATE INDEX idx_payments_status ON payments(status);
DROP INDEX IF EXISTS idx_payments_event_id;
CREATE INDEX idx_payments_event_id ON payments(event_id);


-- Table: tickets
-- Auto-generated when admin approves payment
-- Constraint: ONE ticket per team
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  
  ticket_code VARCHAR(255) UNIQUE NOT NULL,
  qr_code_url VARCHAR(500),
  pdf_url VARCHAR(500),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_ticket_per_team UNIQUE(team_id)
);

DROP INDEX IF EXISTS idx_tickets_team_id;
CREATE INDEX idx_tickets_team_id ON tickets(team_id);
DROP INDEX IF EXISTS idx_tickets_user_id;
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
DROP INDEX IF EXISTS idx_tickets_event_id;
CREATE INDEX idx_tickets_event_id ON tickets(event_id);
DROP INDEX IF EXISTS idx_tickets_payment_id;
CREATE INDEX idx_tickets_payment_id ON tickets(payment_id);


-- Table: audit_log
-- Purpose: Audit trail for all admin actions
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP INDEX IF EXISTS idx_audit_log_admin_email;
CREATE INDEX idx_audit_log_admin_email ON audit_log(admin_email);
DROP INDEX IF EXISTS idx_audit_log_payment_id;
CREATE INDEX idx_audit_log_payment_id ON audit_log(payment_id);
DROP INDEX IF EXISTS idx_audit_log_action;
CREATE INDEX idx_audit_log_action ON audit_log(action);


-- ============================================================
-- D. TRIGGERS (Payment state validation)
-- ============================================================

CREATE OR REPLACE FUNCTION validate_payment_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- If status hasn't changed, allow update
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Validate transition rules: PENDING → (APPROVED or REJECTED) ONLY
  CASE
    WHEN OLD.status = 'PENDING' AND NEW.status NOT IN ('APPROVED', 'REJECTED') THEN
      RAISE EXCEPTION 'Payment can only transition from PENDING to APPROVED or REJECTED, not to %', NEW.status;
    
    WHEN OLD.status IN ('APPROVED', 'REJECTED') THEN
      RAISE EXCEPTION 'Payment status % is LOCKED (final state) and cannot be changed', OLD.status;
    
    ELSE
      NULL;
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_status_validation ON payments;
CREATE TRIGGER trg_payment_status_validation
  BEFORE UPDATE OF status ON payments
  FOR EACH ROW
  EXECUTE FUNCTION validate_payment_transition();


-- ============================================================
-- E. RLS ENABLE STATEMENTS
-- ============================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- F. RLS POLICIES (Email-based admin check)
-- ============================================================

-- ====== EVENTS POLICIES ======
DROP POLICY IF EXISTS "events_select_active" ON events;
CREATE POLICY "events_select_active" ON events
  FOR SELECT
  USING (is_active = TRUE OR is_admin((current_setting('request.jwt.claims', true)::jsonb ->> 'email')));

DROP POLICY IF EXISTS "events_insert_admin_only" ON events;
CREATE POLICY "events_insert_admin_only" ON events
  FOR INSERT
  WITH CHECK (is_admin((current_setting('request.jwt.claims', true)::jsonb ->> 'email')));

DROP POLICY IF EXISTS "events_update_admin_only" ON events;
CREATE POLICY "events_update_admin_only" ON events
  FOR UPDATE
  USING (is_admin((current_setting('request.jwt.claims', true)::jsonb ->> 'email')))
  WITH CHECK (is_admin((current_setting('request.jwt.claims', true)::jsonb ->> 'email')));

DROP POLICY IF EXISTS "events_delete_admin_only" ON events;
CREATE POLICY "events_delete_admin_only" ON events
  FOR DELETE
  USING (is_admin((current_setting('request.jwt.claims', true)::jsonb ->> 'email')));


-- ====== TEAMS POLICIES ======
DROP POLICY IF EXISTS "teams_select_own" ON teams;
CREATE POLICY "teams_select_own" ON teams
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "teams_select_admin" ON teams;
CREATE POLICY "teams_select_admin" ON teams
  FOR SELECT
  USING (is_admin((current_setting('request.jwt.claims', true)::jsonb ->> 'email')));

DROP POLICY IF EXISTS "teams_insert_own" ON teams;
CREATE POLICY "teams_insert_own" ON teams
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "teams_update_own" ON teams;
CREATE POLICY "teams_update_own" ON teams
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ====== TEAM_MEMBERS POLICIES ======
DROP POLICY IF EXISTS "team_members_select_own_team" ON team_members;
CREATE POLICY "team_members_select_own_team" ON team_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "team_members_select_admin" ON team_members;
CREATE POLICY "team_members_select_admin" ON team_members
  FOR SELECT
  USING (is_admin((current_setting('request.jwt.claims', true)::jsonb ->> 'email')));

DROP POLICY IF EXISTS "team_members_insert_own_team" ON team_members;
CREATE POLICY "team_members_insert_own_team" ON team_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "team_members_update_own_team" ON team_members;
CREATE POLICY "team_members_update_own_team" ON team_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.user_id = auth.uid()
    )
  );


-- ====== REGISTRATIONS POLICIES ======
DROP POLICY IF EXISTS "registrations_select_own" ON registrations;
CREATE POLICY "registrations_select_own" ON registrations
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "registrations_select_admin" ON registrations;
CREATE POLICY "registrations_select_admin" ON registrations
  FOR SELECT
  USING (is_admin((current_setting('request.jwt.claims', true)::jsonb ->> 'email')));

DROP POLICY IF EXISTS "registrations_insert_own" ON registrations;
CREATE POLICY "registrations_insert_own" ON registrations
  FOR INSERT
  WITH CHECK (user_id = auth.uid());


-- ====== PAYMENTS POLICIES ======
DROP POLICY IF EXISTS "payments_select_own" ON payments;
CREATE POLICY "payments_select_own" ON payments
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "payments_select_admin" ON payments;
CREATE POLICY "payments_select_admin" ON payments
  FOR SELECT
  USING (is_admin((current_setting('request.jwt.claims', true)::jsonb ->> 'email')));

DROP POLICY IF EXISTS "payments_insert_own" ON payments;
CREATE POLICY "payments_insert_own" ON payments
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "payments_update_own_pending" ON payments;
CREATE POLICY "payments_update_own_pending" ON payments
  FOR UPDATE
  USING (user_id = auth.uid() AND status = 'PENDING')
  WITH CHECK (user_id = auth.uid() AND status = 'PENDING');

-- Only admins can approve/reject payments
DROP POLICY IF EXISTS "payments_update_admin_only" ON payments;
CREATE POLICY "payments_update_admin_only" ON payments
  FOR UPDATE
  USING (is_admin((current_setting('request.jwt.claims', true)::jsonb ->> 'email')))
  WITH CHECK (is_admin((current_setting('request.jwt.claims', true)::jsonb ->> 'email')) AND status IN ('PENDING', 'APPROVED', 'REJECTED'));


-- ====== TICKETS POLICIES ======
DROP POLICY IF EXISTS "tickets_select_own" ON tickets;
CREATE POLICY "tickets_select_own" ON tickets
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "tickets_select_admin" ON tickets;
CREATE POLICY "tickets_select_admin" ON tickets
  FOR SELECT
  USING (is_admin((current_setting('request.jwt.claims', true)::jsonb ->> 'email')));

-- Only admins can create tickets (when payment is APPROVED)
DROP POLICY IF EXISTS "tickets_insert_admin_only" ON tickets;
CREATE POLICY "tickets_insert_admin_only" ON tickets
  FOR INSERT
  WITH CHECK (is_admin((current_setting('request.jwt.claims', true)::jsonb ->> 'email')));


-- ====== AUDIT_LOG POLICIES ======
DROP POLICY IF EXISTS "audit_log_select_admin" ON audit_log;
CREATE POLICY "audit_log_select_admin" ON audit_log
  FOR SELECT
  USING (is_admin((current_setting('request.jwt.claims', true)::jsonb ->> 'email')));

DROP POLICY IF EXISTS "audit_log_insert_system" ON audit_log;
CREATE POLICY "audit_log_insert_system" ON audit_log
  FOR INSERT
  WITH CHECK (TRUE);


-- ============================================================
-- G. VIEWS
-- ============================================================

CREATE OR REPLACE VIEW pending_payments AS
SELECT 
  p.id,
  p.team_id,
  p.event_id,
  p.user_id,
  p.amount,
  p.transaction_id,
  p.status,
  p.created_at,
  e.name AS event_name,
  t.team_name,
  u.email AS user_email
FROM payments p
JOIN events e ON e.id = p.event_id
JOIN teams t ON t.id = p.team_id
JOIN auth.users u ON u.id = p.user_id
WHERE p.status = 'PENDING'
ORDER BY p.created_at ASC;

CREATE OR REPLACE VIEW user_registrations_with_payment AS
SELECT 
  r.id AS registration_id,
  r.user_id,
  r.event_id,
  r.team_id,
  e.name AS event_name,
  t.team_name,
  p.status AS payment_status,
  p.amount,
  p.id AS payment_id,
  p.rejection_reason,
  CASE WHEN p.status = 'APPROVED' THEN TRUE ELSE FALSE END AS ticket_available,
  r.created_at
FROM registrations r
JOIN events e ON e.id = r.event_id
JOIN teams t ON t.id = r.team_id
LEFT JOIN payments p ON p.team_id = r.team_id
ORDER BY r.created_at DESC;


-- ============================================================
-- H. SEED DATA (Events for ROBOYUDH 2026)
-- ============================================================

-- Insert events (Feb 26-27, 2026)
INSERT INTO events (id, name, category, description, price_per_head, max_team_size, event_date, is_active)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Line Follower', 'tech', 'Autonomous robot follows a line', 500, 4, '2026-02-26', TRUE),
  ('550e8400-e29b-41d4-a716-446655440002', 'RC Racing', 'tech', 'Remote control car racing competition', 300, 2, '2026-02-26', TRUE),
  ('550e8400-e29b-41d4-a716-446655440003', 'RoboSumo', 'tech', 'Sumo wrestling robots battle', 400, 3, '2026-02-27', TRUE),
  ('550e8400-e29b-41d4-a716-446655440004', 'RoboSoccer', 'tech', 'Soccer-playing robots competition', 600, 5, '2026-02-27', TRUE),
  ('550e8400-e29b-41d4-a716-446655440005', 'GameVerse', 'tech', 'Gaming tournament', 200, 1, '2026-02-26', TRUE)
ON CONFLICT DO NOTHING;


-- ============================================================
-- I. FINAL SUMMARY
-- ============================================================
-- Payment Flow Implemented:
-- 
-- 1. USER REGISTERS
--    ↓
--    [Payment status: PENDING]
--    User sees: "Your payment has been registered"
--
-- 2. ADMIN COLLECTS CASH (offline, not in system)
--
-- 3. ADMIN LOGS IN as organizers.roboyudh@gmail.com
--    Admin Dashboard shows PENDING payments
--
-- 4a. ADMIN APPROVES PAYMENT
--     Payment status: PENDING → APPROVED
--     Ticket code generated: RBY26-{EVENT}-{TEAM}
--     Email sent to user with ticket code
--     User can now download/view ticket
--
-- 4b. ADMIN REJECTS PAYMENT
--     Payment status: PENDING → REJECTED
--     Rejection reason stored in database
--     Email sent to user with rejection reason
--     User sees rejection reason on payment page
--
-- FEATURES:
-- ✅ Offline payment flow (no Razorpay, Stripe, etc.)
-- ✅ Admin email-based access control
-- ✅ Rejection reasons visible to users
-- ✅ Email notifications (approval & rejection)
-- ✅ Simple ticket codes (no QR codes needed)
-- ✅ Database enforces PENDING → APPROVED/REJECTED only (no WAITING)
-- ✅ All admin data accessible only by organizers.roboyudh@gmail.com
--
-- EVENT DETAILS:
-- Dates: February 26-27, 2026
-- Venue: Sathyabama Institute of Science and Technology, Chennai
-- Reporting Time: 08:40 AM
-- Admin Email: organizers.roboyudh@gmail.com
-- ============================================================
-- END OF COMPLETE DATABASE SETUP
-- ============================================================
