-- ============================================================
-- BULK FIX: Generate Missing Tickets for Approved Payments
-- ============================================================
-- This SQL script creates tickets for all APPROVED payments
-- that don't have tickets yet
-- ============================================================

-- Step 1: Check how many are affected
SELECT 
  COUNT(*) as affected_registrations
FROM payments p
LEFT JOIN tickets tk ON p.id = tk.payment_id
WHERE p.status = 'APPROVED' AND tk.id IS NULL;

-- Step 2: Get list of affected payments with details
SELECT 
  p.id as payment_id,
  p.team_id,
  p.event_id,
  p.user_id,
  t.team_name,
  e.name as event_name,
  u.email
FROM payments p
LEFT JOIN teams t ON p.team_id = t.id
LEFT JOIN events e ON p.event_id = e.id
LEFT JOIN tickets tk ON p.id = tk.payment_id
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE p.status = 'APPROVED' AND tk.id IS NULL
ORDER BY p.created_at DESC;

-- Step 3: INSERT missing tickets
-- IMPORTANT: Run this ONLY ONCE!
INSERT INTO tickets (team_id, event_id, user_id, payment_id, ticket_code)
SELECT 
  p.team_id,
  p.event_id,
  p.user_id,
  p.id,
  'RBY26-' || SUBSTRING(p.event_id, 1, 4) || '-' || SUBSTRING(p.team_id, 1, 8)
FROM payments p
LEFT JOIN tickets tk ON p.id = tk.payment_id
WHERE p.status = 'APPROVED' AND tk.id IS NULL
ON CONFLICT DO NOTHING;

-- Step 4: Verify - should return 0 for still missing
SELECT COUNT(*) as still_missing
FROM payments p
LEFT JOIN tickets tk ON p.id = tk.payment_id
WHERE p.status = 'APPROVED' AND tk.id IS NULL;

-- Step 5: Final count - verify all approved have tickets
SELECT 
  COUNT(DISTINCT p.id) as total_approved_payments,
  COUNT(DISTINCT CASE WHEN tk.id IS NOT NULL THEN p.id END) as have_tickets,
  COUNT(DISTINCT CASE WHEN tk.id IS NULL THEN p.id END) as missing_tickets
FROM payments p
LEFT JOIN tickets tk ON p.id = tk.payment_id
WHERE p.status = 'APPROVED';
