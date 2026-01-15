-- ============================================================
-- CLEAN DATABASE FOR PRODUCTION LAUNCH
-- ============================================================
-- This script removes all test data while keeping:
-- ✅ Events
-- ✅ Admin user (abdulsist23@gmail.com)
-- ✅ Database structure
-- ============================================================

-- Step 1: Delete all test tickets
DELETE FROM tickets;

-- Step 2: Delete all test payments
DELETE FROM payments;

-- Step 3: Delete all test team members
DELETE FROM team_members;

-- Step 4: Delete all test registration details
DELETE FROM registration_details;

-- Step 5: Delete all test leaderboard entries
DELETE FROM leaderboard;

-- Step 6: Delete all test teams
DELETE FROM teams;

-- Step 7: Reset auto-increment sequences (if any)
-- This ensures new registrations start from clean IDs

-- Step 8: Verify cleanup
SELECT 'teams' as table_name, COUNT(*) as count FROM teams
UNION ALL
SELECT 'team_members', COUNT(*) FROM team_members
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'tickets', COUNT(*) FROM tickets
UNION ALL
SELECT 'registration_details', COUNT(*) FROM registration_details
UNION ALL
SELECT 'leaderboard', COUNT(*) FROM leaderboard
UNION ALL
SELECT 'events', COUNT(*) FROM events;

-- Expected Results:
-- teams: 0
-- team_members: 0
-- payments: 0
-- tickets: 0
-- registration_details: 0
-- leaderboard: 0
-- events: 6 (your 6 events should remain)

-- ============================================================
-- ✅ DATABASE IS NOW CLEAN AND READY FOR PRODUCTION
-- ============================================================
