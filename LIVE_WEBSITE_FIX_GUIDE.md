# 🚨 LIVE WEBSITE: Fix Already-Approved Registrations

## THE PROBLEM 🔴

Users who were **already approved BEFORE our fix** are stuck:
- ✅ Payment Status: APPROVED
- ❌ Ticket: NOT created (API was failing)
- ❌ Email: NOT sent (can't send without ticket)
- 😞 Result: User sees "AWAITING CONFIRMATION" forever

**Current Status**: Your RoboSoccer registration shows this issue!

---

## IMMEDIATE ACTION NEEDED

### Step 1: Find All Affected Registrations

1. Go to: https://supabase.com/dashboard/project/kbwntymxockacgzfabys/sql/new
2. Copy-paste this query:

```sql
SELECT 
  p.id as payment_id,
  t.team_name,
  e.name as event_name,
  u.email,
  COUNT(tk.id) as ticket_count
FROM payments p
LEFT JOIN teams t ON p.team_id = t.id
LEFT JOIN events e ON p.event_id = e.id
LEFT JOIN tickets tk ON p.id = tk.payment_id
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE p.status = 'APPROVED'
GROUP BY p.id, t.team_name, e.name, u.email
HAVING COUNT(tk.id) = 0;
```

3. Click **Run** - this shows all affected users

---

### Step 2: Manually Fix Each Registration

For each affected payment:

1. **Get the ticket code format**:
   ```
   RBY26-{event_id_first_4_chars}-{team_id_first_8_chars}
   ```

2. **Go to Supabase Dashboard** → `tickets` table

3. **Insert new row**:
   ```
   team_id: (from the query result)
   event_id: (from the query result)
   user_id: (from the query result)
   payment_id: (from the query result)
   ticket_code: RBY26-XXXX-XXXXXXXX
   ticket_pdf_url: (leave null)
   ```

4. **Send email manually** or via Edge Function:
   ```
   POST https://kbwntymxockacgzfabys.supabase.co/functions/v1/send-email
   {
     "to": "user@email.com",
     "type": "approval",
     "teamName": "team_name_from_query",
     "eventName": "event_name_from_query",
     "eventDate": "February 26, 2026",
     "ticketCode": "RBY26-XXXX-XXXXXXXX"
   }
   ```

---

## AUTOMATED OPTION (Better)

### Option A: Use the Bulk Fix Script

1. **Create environment file** (`.env.local`):
   ```
   VITE_SUPABASE_URL=https://kbwntymxockacgzfabys.supabase.co
   VITE_SUPABASE_ANON_KEY=your_key_here
   ```

2. **Run the script**:
   ```powershell
   cd C:\Users\jabdu\Downloads\Roboyudh
   npx ts-node scripts/bulk-fix-tickets.ts
   ```

3. **Watch the output** - it will:
   - Find all approved payments without tickets
   - Generate tickets for each
   - Send emails automatically
   - Show summary

### Option B: Quick Manual List

Run this in Supabase SQL Editor to see exactly what needs fixing:

```sql
SELECT 
  p.id,
  t.team_name,
  e.name,
  u.email,
  p.team_id,
  p.event_id,
  p.user_id
FROM payments p
LEFT JOIN teams t ON p.team_id = t.id
LEFT JOIN events e ON p.event_id = e.id
LEFT JOIN tickets tk ON p.id = tk.payment_id
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE p.status = 'APPROVED' AND tk.id IS NULL;
```

---

## VERIFICATION AFTER FIX

Run this query to confirm all approved payments have tickets:

```sql
SELECT 
  COUNT(*) as total_approved,
  COUNT(CASE WHEN tk.id IS NOT NULL THEN 1 END) as have_tickets,
  COUNT(CASE WHEN tk.id IS NULL THEN 1 END) as still_missing
FROM payments p
LEFT JOIN tickets tk ON p.id = tk.payment_id
WHERE p.status = 'APPROVED';
```

**Expected Result**:
```
total_approved: X
have_tickets: X
still_missing: 0  ✅
```

---

## GOING FORWARD

**New approvals (after our fix) will work automatically!**

1. Admin clicks "Approve & Generate Ticket"
2. ✅ Ticket created immediately
3. ✅ Email sent automatically
4. ✅ User sees ticket in "My Tickets"

**Only OLD approvals need manual fixing** (one time!)

---

## CHECKLIST

- [ ] Query database to find affected users
- [ ] Note the count of affected registrations
- [ ] Run bulk fix script OR manually create tickets
- [ ] Verify all approved payments now have tickets
- [ ] Check email delivery (Resend dashboard)
- [ ] Confirm users can now see tickets

---

## FILES CREATED

- [scripts/bulk-fix-tickets.ts](scripts/bulk-fix-tickets.ts) - Automated fix script
- [sql/find-missing-tickets.sql](sql/find-missing-tickets.sql) - SQL queries to find affected users

---

## NEED HELP?

Check:
1. **Supabase Function Logs**: https://supabase.com/dashboard/project/kbwntymxockacgzfabys/functions
2. **Resend Email Logs**: https://resend.com/emails
3. **Database**: Check `tickets` table for created entries

