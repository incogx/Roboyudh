-- ============================================================
-- CHECK EXISTING DATA
-- ============================================================
-- Run this to see if your registration data still exists
-- ============================================================

-- Check events
SELECT 'EVENTS' as table_name, COUNT(*) as count FROM events
UNION ALL
SELECT 'TEAMS', COUNT(*) FROM teams
UNION ALL
SELECT 'REGISTRATIONS', COUNT(*) FROM registrations
UNION ALL
SELECT 'PAYMENTS', COUNT(*) FROM payments
UNION ALL
SELECT 'TICKETS', COUNT(*) FROM tickets;

-- Show all events with details
SELECT id, name, category, price_per_head, max_team_size, is_active 
FROM events 
ORDER BY name;

-- Show all registrations with team details
SELECT 
  r.id as registration_id,
  e.name as event_name,
  t.team_name,
  t.college_name,
  p.amount,
  p.status as payment_status,
  r.created_at
FROM registrations r
JOIN events e ON e.id = r.event_id
JOIN teams t ON t.id = r.team_id
LEFT JOIN payments p ON p.team_id = r.team_id
ORDER BY r.created_at DESC;
