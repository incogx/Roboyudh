# ⚡ QUICK FIX: Right Now Instructions

## For LIVE Website - Immediate Action

---

## STEP 1: Check How Many Users Are Affected

Go to: https://supabase.com/dashboard/project/kbwntymxockacgzfabys/sql/new

Run this query:

```sql
SELECT COUNT(*) as affected_count
FROM payments p
LEFT JOIN tickets tk ON p.id = tk.payment_id
WHERE p.status = 'APPROVED' AND tk.id IS NULL;
```

**This shows**: How many approved registrations don't have tickets yet

---

## STEP 2: Get List of Affected Users

Run this query:

```sql
SELECT 
  p.id as payment_id,
  t.team_name,
  e.name as event_name,
  u.email,
  p.team_id,
  p.event_id,
  p.user_id
FROM payments p
LEFT JOIN teams t ON p.team_id = t.id
LEFT JOIN events e ON p.event_id = e.id
LEFT JOIN tickets tk ON p.id = tk.payment_id
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE p.status = 'APPROVED' AND tk.id IS NULL
ORDER BY p.created_at DESC;
```

**Copy this list** - you'll need it for the next step

---

## STEP 3: Generate Tickets Manually

For EACH row from Step 2, do this:

1. Go to: https://supabase.com/dashboard/project/kbwntymxockacgzfabys/editor/tickets

2. Click **Insert Row** or **Create record**

3. Fill in:
   - `team_id`: From query (column: team_id)
   - `event_id`: From query (column: event_id)  
   - `user_id`: From query (column: user_id)
   - `payment_id`: From query (column: payment_id)
   - `ticket_code`: Create as: `RBY26-{event_id[:4].upper()}-{team_id[:8].upper()}`
     - Example: `RBY26-550E-2B956CB6`
   - `ticket_pdf_url`: Leave blank (NULL)

4. Click **Save**

---

## STEP 4: Verify Tickets Created

Run this to confirm:

```sql
SELECT COUNT(*) as total_tickets
FROM tickets;
```

Should increase by the number of affected users

---

## STEP 5: Send Emails (Optional - Manual)

For each user, you can manually send emails or users will get them automatically on next approval.

---

## DONE! ✅

All affected users will now see their tickets in "My Registrations" page!

---

## EXAMPLE

If query returned:
```
| payment_id | team_name | event_name | email |
| P123 | MyTeam | RoboSoccer | user@email.com |
```

Create ticket:
```
team_id: T-456
event_id: E-789
user_id: U-ABC
payment_id: P123
ticket_code: RBY26-789-T456XXXX
```

---

## IF YOU HAVE MANY AFFECTED USERS (>5)

Use the TypeScript script instead (it's faster):

```powershell
cd C:\Users\jabdu\Downloads\Roboyudh
npx ts-node scripts/bulk-fix-tickets.ts
```

This will automatically:
1. Find all affected payments
2. Generate tickets
3. Send emails
4. Show summary

---
