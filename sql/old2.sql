-- ============================================================
-- A. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- B. UTILITY FUNCTIONS (DEFINE BEFORE RLS POLICIES USE THEM)
-- ============================================================

-- Function: is_admin(user_email TEXT)
-- Purpose: Email-based admin check ONLY (Rule 3: "Admin check: email-based only")
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
-- Rule 6: "ONE payment per team, ONE ticket per team"
-- Constraint: UNIQUE(event_id, user_id) - ONE team per user per event
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(15) NOT NULL,
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
-- Constraint: UNIQUE(team_id) - ONE registration per team
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
-- Rule 7 (UPDATED): "Status: PENDING → APPROVED/REJECTED (final)" - NO WAITING STATE
-- Rule 8: "ONE mechanism for status validation (prefer trigger, not CHECK duplication)"
-- Constraint: UNIQUE(team_id) - ONE payment per team
-- Status values: PENDING | APPROVED | REJECTED (WAITING removed for offline payment flow)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  transaction_id VARCHAR(255),  -- Optional, for reference only
  screenshot_file_path VARCHAR(500),  -- Deprecated, kept for backward compatibility
  
  -- Status with CHECK constraint for valid values only
  -- Transition rules enforced by trigger (single mechanism - Rule 8)
  status VARCHAR(50) DEFAULT 'PENDING' 
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  
  -- Admin decision
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_comment TEXT,
  rejection_reason TEXT,  -- Specific reason for rejection (user-facing)
  admin_decision_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: ONE payment per team (Rule 6)
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
-- Constraint: UNIQUE(team_id) - ONE ticket per team (Rule 6)
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  
  ticket_code VARCHAR(255) UNIQUE NOT NULL,
  qr_code_url VARCHAR(500) NOT NULL,
  ticket_pdf_url VARCHAR(500),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: ONE ticket per team (Rule 6)
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
-- Note: admin_email stored (not admin_id) to preserve audit trail if admin deleted
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
-- D. TRIGGERS (ONLY on payments table - Rule 1)
-- ============================================================
-- Rule 1: "NO triggers on auth.users (Supabase forbids)"
-- Rule 8: "ONE mechanism for status validation (prefer trigger)"
-- This trigger enforces the ONLY status transition mechanism

CREATE OR REPLACE FUNCTION validate_payment_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- If status hasn't changed, allow update (e.g., comment-only update)
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Validate transition rules: PENDING → (APPROVED or REJECTED) - OFFLINE FLOW ONLY
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


-- Attach trigger to payments table (ONLY table with status transitions)
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
-- F. RLS POLICIES (Non-conflicting, email-based admin check)
-- ============================================================
-- Rule 3: "Admin check: email-based only (is_admin function)"
-- Rule 9: "RLS policies must NOT conflict"
-- Implementation: Using is_admin(auth.jwt()->>'email') for all admin checks

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

-- Users can update their OWN payments when status = PENDING (e.g., update contact info)
-- Cannot change status themselves
DROP POLICY IF EXISTS "payments_update_own_pending" ON payments;
CREATE POLICY "payments_update_own_pending" ON payments
  FOR UPDATE
  USING (user_id = auth.uid() AND status = 'PENDING')
  WITH CHECK (user_id = auth.uid() AND status = 'PENDING');

-- Only admins can change payment status (approve/reject)
-- Admins can update payments from PENDING to APPROVED/REJECTED directly (offline flow)
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

-- Only admins can create tickets (via backend function, not direct insert)
DROP POLICY IF EXISTS "tickets_insert_admin_only" ON tickets;
CREATE POLICY "tickets_insert_admin_only" ON tickets
  FOR INSERT
  WITH CHECK (is_admin((current_setting('request.jwt.claims', true)::jsonb ->> 'email')) AND 
    EXISTS (
      SELECT 1 FROM payments
      WHERE payments.id = payment_id
      AND payments.status = 'APPROVED'
    ));


-- ====== AUDIT_LOG POLICIES ======
-- Only admins can read audit logs
DROP POLICY IF EXISTS "audit_log_select_admin" ON audit_log;
CREATE POLICY "audit_log_select_admin" ON audit_log
  FOR SELECT
  USING (is_admin((current_setting('request.jwt.claims', true)::jsonb ->> 'email')));

-- Backend can insert audit logs (no RLS check, relies on backend validation)
DROP POLICY IF EXISTS "audit_log_insert_system" ON audit_log;
CREATE POLICY "audit_log_insert_system" ON audit_log
  FOR INSERT
  WITH CHECK (TRUE);


-- ============================================================
-- G. VIEWS (Optional, safe)
-- ============================================================

-- View: Pending payments awaiting admin approval (offline payments)
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


-- View: User registrations with payment status
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
  CASE WHEN p.status = 'APPROVED' THEN TRUE ELSE FALSE END AS ticket_available,
  r.created_at
FROM registrations r
JOIN events e ON e.id = r.event_id
JOIN teams t ON t.id = r.team_id
LEFT JOIN payments p ON p.team_id = r.team_id
ORDER BY r.created_at DESC;


-- ============================================================
-- H. SANITY TEST QUERIES (Run these to verify schema)
-- ============================================================

-- Test 1: Verify extensions created
-- SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto');

-- Test 2: Verify is_admin function exists and works
-- SELECT is_admin('organizers.roboyudh@gmail.com') AS should_be_true;
-- SELECT is_admin('other@example.com') AS should_be_false;

-- Test 3: Verify all required tables exist
-- SELECT tablename FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('events', 'teams', 'team_members', 'registrations', 'payments', 'tickets', 'audit_log')
-- ORDER BY tablename;

-- Test 4: Verify payment status trigger exists
-- SELECT tgname FROM pg_trigger WHERE tgrelid = 'payments'::regclass;

-- Test 5: Verify RLS is enabled on all tables
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
-- AND EXISTS (SELECT 1 FROM pg_class WHERE oid = ('public.' || tablename)::regclass AND relrowsecurity = true);

-- Test 6: Verify UNIQUE constraints exist
-- SELECT constraint_name, table_name FROM information_schema.table_constraints 
-- WHERE table_name IN ('payments', 'teams', 'registrations', 'tickets')
-- AND constraint_type = 'UNIQUE'
-- ORDER BY table_name, constraint_name;

-- Test 7: Verify CHECK constraint on payments.status
-- SELECT constraint_name FROM information_schema.check_constraints WHERE table_name = 'payments';

-- Test 8: Verify RLS policies exist
-- SELECT policyname, tablename FROM pg_policies WHERE tablename IN ('events', 'teams', 'payments', 'tickets');

-- Test 9: Verify all required indexes exist
-- SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('events', 'teams', 'payments', 'tickets');

-- Test 10: Verify views exist
-- SELECT table_name FROM information_schema.views WHERE table_schema = 'public' AND table_name IN ('pending_payments', 'user_registrations_with_payment');

-- ============================================================
-- END OF SCHEMA
-- ============================================================
