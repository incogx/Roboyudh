-- ============================================================
-- FIND AFFECTED USERS: Approved Payments WITHOUT Tickets
-- ============================================================
-- Run this in Supabase SQL Editor to see all affected registrations
-- ============================================================

SELECT 
  p.id as payment_id,
  p.status,
  t.team_name,
  e.name as event_name,
  u.email,
  p.amount,
  p.created_at as payment_date,
  COUNT(tk.id) as ticket_count,
  CASE 
    WHEN tk.id IS NULL THEN '❌ NO TICKET'
    ELSE '✅ Has Ticket'
  END as status_fix
FROM payments p
LEFT JOIN teams t ON p.team_id = t.id
LEFT JOIN events e ON p.event_id = e.id
LEFT JOIN tickets tk ON p.id = tk.payment_id
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE p.status = 'APPROVED'
GROUP BY p.id, p.status, t.team_name, e.name, u.email, p.amount, p.created_at, tk.id
HAVING tk.id IS NULL
ORDER BY p.created_at DESC;

-- ============================================================
-- ALTERNATIVE: Quick Count
-- ============================================================
-- Just see how many are affected:

SELECT COUNT(*) as affected_registrations
FROM payments p
LEFT JOIN tickets tk ON p.id = tk.payment_id
WHERE p.status = 'APPROVED' AND tk.id IS NULL;

-- ============================================================
-- AFTER FIX: Verify All Approved Payments Have Tickets
-- ============================================================

SELECT 
  COUNT(*) as total_approved,
  COUNT(CASE WHEN tk.id IS NOT NULL THEN 1 END) as have_tickets,
  COUNT(CASE WHEN tk.id IS NULL THEN 1 END) as missing_tickets
FROM payments p
LEFT JOIN tickets tk ON p.id = tk.payment_id
WHERE p.status = 'APPROVED';

