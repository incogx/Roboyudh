-- ============================================================
-- ROBOYUDH 2026 - FIX MISSING TEAM DETAILS
-- ============================================================
-- This script adds missing columns and tables that are required
-- for team details to show properly in the application
-- ============================================================

-- ============================================================
-- FIX 1: Add team_size column to teams table (if missing)
-- ============================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teams' AND column_name = 'team_size'
  ) THEN
    ALTER TABLE teams ADD COLUMN team_size INTEGER DEFAULT 1;
    RAISE NOTICE '✅ Added team_size column to teams table';
  ELSE
    RAISE NOTICE '⏭️  team_size column already exists';
  END IF;
END $$;


-- ============================================================
-- FIX 2: Create registration_details table (if missing)
-- ============================================================
CREATE TABLE IF NOT EXISTS registration_details (
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

-- Create index
CREATE INDEX IF NOT EXISTS idx_registration_details_team_id ON registration_details(team_id);


-- ============================================================
-- FIX 3: Enable RLS on registration_details
-- ============================================================
ALTER TABLE registration_details ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "registration_details_select_own" ON registration_details;
DROP POLICY IF EXISTS "registration_details_select_admin" ON registration_details;
DROP POLICY IF EXISTS "registration_details_insert_own" ON registration_details;
DROP POLICY IF EXISTS "registration_details_update_own" ON registration_details;

-- Users can read their own registration details (via team ownership)
CREATE POLICY "registration_details_select_own" ON registration_details
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = registration_details.team_id 
      AND teams.user_id = auth.uid()
    )
  );

-- Admin can read all registration details
CREATE POLICY "registration_details_select_admin" ON registration_details
  FOR SELECT
  USING (is_admin((current_setting('request.jwt.claims', true)::jsonb ->> 'email')));

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
      AND teams.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = registration_details.team_id 
      AND teams.user_id = auth.uid()
    )
  );


-- ============================================================
-- FIX 4: Add missing columns to events table (if needed)
-- ============================================================
DO $$ 
BEGIN
  -- Add rules column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'rules'
  ) THEN
    ALTER TABLE events ADD COLUMN rules TEXT[] DEFAULT '{}';
    RAISE NOTICE '✅ Added rules column to events table';
  END IF;
  
  -- Add rulebook_url column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'rulebook_url'
  ) THEN
    ALTER TABLE events ADD COLUMN rulebook_url TEXT;
    RAISE NOTICE '✅ Added rulebook_url column to events table';
  END IF;
  
  -- Add image_url column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE events ADD COLUMN image_url TEXT;
    RAISE NOTICE '✅ Added image_url column to events table';
  END IF;
END $$;


-- ============================================================
-- FIX 5: Add missing admin policies for teams and team_members
-- ============================================================
DROP POLICY IF EXISTS "teams_select_admin" ON teams;
CREATE POLICY "teams_select_admin" ON teams
  FOR SELECT
  USING (is_admin((current_setting('request.jwt.claims', true)::jsonb ->> 'email')));

-- Add admin policy for team_members (CRITICAL - admin needs to see all team members)
DROP POLICY IF EXISTS "team_members_select_admin" ON team_members;
CREATE POLICY "team_members_select_admin" ON team_members
  FOR SELECT
  USING (is_admin((current_setting('request.jwt.claims', true)::jsonb ->> 'email')));


-- ============================================================
-- FIX 6: Add missing columns to payments table (if needed)
-- ============================================================
DO $$ 
BEGIN
  -- Add transaction_id column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'transaction_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN transaction_id VARCHAR(255);
    RAISE NOTICE '✅ Added transaction_id column to payments table';
  END IF;
  
  -- Add screenshot_file_path column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'screenshot_file_path'
  ) THEN
    ALTER TABLE payments ADD COLUMN screenshot_file_path VARCHAR(500);
    RAISE NOTICE '✅ Added screenshot_file_path column to payments table';
  END IF;
  
  -- Add rejection_reason column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE payments ADD COLUMN rejection_reason TEXT;
    RAISE NOTICE '✅ Added rejection_reason column to payments table';
  END IF;
  
  -- Add admin_comment column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'admin_comment'
  ) THEN
    ALTER TABLE payments ADD COLUMN admin_comment TEXT;
    RAISE NOTICE '✅ Added admin_comment column to payments table';
  END IF;
  
  -- Add admin_decision_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'admin_decision_at'
  ) THEN
    ALTER TABLE payments ADD COLUMN admin_decision_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✅ Added admin_decision_at column to payments table';
  END IF;
END $$;


-- ============================================================
-- VERIFICATION SUMMARY
-- ============================================================
DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔══════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║       TEAM DETAILS FIX COMPLETE!                         ║';
  RAISE NOTICE '╠══════════════════════════════════════════════════════════╣';
  RAISE NOTICE '║                                                          ║';
  RAISE NOTICE '║  FIXED:                                                  ║';
  RAISE NOTICE '║    ✅ Added team_size column to teams                    ║';
  RAISE NOTICE '║    ✅ Created registration_details table                 ║';
  RAISE NOTICE '║    ✅ Added RLS policies for registration_details        ║';
  RAISE NOTICE '║    ✅ Added missing event columns (rules, images, etc)   ║';
  RAISE NOTICE '║    ✅ Added admin access to teams table                  ║';
  RAISE NOTICE '║    ✅ Added missing payment columns                      ║';
  RAISE NOTICE '║                                                          ║';
  RAISE NOTICE '║  Now team details should show correctly!                 ║';
  RAISE NOTICE '║                                                          ║';
  RAISE NOTICE '╚══════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
END $$;
