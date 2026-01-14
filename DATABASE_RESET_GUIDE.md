# 🔄 DATABASE RESET INSTRUCTIONS - ROBOYUDH 2026

## Complete Clean Database Setup

---

## STEP 1: Access Supabase Console

1. Go to: https://app.supabase.com
2. Click on your project: **umidkzbqpfveovsxalcj** (Roboyudh)
3. In the left sidebar, click **SQL Editor**

---

## STEP 2: Clear Old Database

### Option A: Full Reset (Recommended)
1. Click **New Query** in SQL Editor
2. Copy the entire content from: `sql/CLEAN_SLATE_SETUP.sql`
3. Paste it into the SQL Editor
4. Click **Run** button (green play icon)
5. Wait for completion - you'll see:
   ```
   SETUP COMPLETE!
   ```

**This script will:**
- ✅ Drop all old tables (events, teams, payments, tickets, leaderboard, etc.)
- ✅ Create fresh tables with proper constraints
- ✅ Insert 6 events (RC Racing, Robo Soccer, Line Follower, Obstacle Run, Robo Sumo, Game Verse)
- ✅ Set event dates to Feb 26-27, 2026
- ✅ Enable Row-Level Security (RLS) on all tables
- ✅ Create RLS policies for admin/user access
- ✅ Create auto-triggers for ticket codes and timestamps

---

## STEP 3: Verify Database Is Clean

After running the script, you should see:
- **6 events** in the events table
- **0 teams** (no registrations yet)
- **0 payments**
- **0 tickets**
- **0 leaderboard entries**

To verify, run this query:

```sql
SELECT 
  (SELECT COUNT(*) FROM events) as events,
  (SELECT COUNT(*) FROM teams) as teams,
  (SELECT COUNT(*) FROM payments) as payments,
  (SELECT COUNT(*) FROM tickets) as tickets,
  (SELECT COUNT(*) FROM leaderboard) as leaderboard;
```

Expected output:
```
events | teams | payments | tickets | leaderboard
-------|-------|----------|---------|------------
  6    |   0   |    0     |    0    |     0
```

---

## STEP 4: Apply Ticket Uniqueness Constraint

**Critical for payment integrity** - This ensures only ONE ticket per team:

```sql
ALTER TABLE tickets ADD CONSTRAINT tickets_team_id_unique UNIQUE (team_id);
```

Run this in SQL Editor to prevent duplicate tickets.

---

## STEP 5: Verify Tables

Run this to check all tables exist:

```sql
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Should show:
- ✅ events
- ✅ teams
- ✅ team_members
- ✅ registration_details
- ✅ payments
- ✅ tickets
- ✅ leaderboard

---

## STEP 6: Verify RLS is Enabled

Run this query:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

All tables should show `rowsecurity = true`

---

## STEP 7: Restart Frontend (if needed)

If you're running the development server locally:

```bash
npm run dev
```

Or if deploying to Vercel, trigger a redeploy:
```bash
git add .
git commit -m "Fresh database reset"
git push origin main
```

Vercel will auto-deploy in ~2-5 minutes.

---

## STEP 8: Test Payment Flow

1. Go to the website (local or Vercel)
2. Click **Register for Event**
3. Fill in team details
4. Proceed to payment
5. Verify:
   - ✅ Order amount is correct (team_size × event_price)
   - ✅ Razorpay popup opens
   - ✅ Payment processes
   - ✅ Ticket code is generated

---

## 🚨 IMPORTANT NOTES

### Before Starting Event:
- [ ] Run the **CLEAN_SLATE_SETUP.sql** script in Supabase
- [ ] Apply the **UNIQUE constraint** on tickets.team_id
- [ ] Verify **RLS is enabled** on all tables
- [ ] Set **env variables** in Vercel:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `RAZORPAY_KEY_SECRET`
  - `RAZORPAY_KEY_ID`
  - `VITE_RAZORPAY_KEY_ID`

### Event Dates (Confirmed):
- 📅 **Feb 26-27, 2026**
- All 6 events active during these dates

### Admin Access:
- 👤 Email: `abdulsist23@gmail.com`
- Only this email can access admin dashboard and modify scores/payments

---

## Rollback (If Needed)

To revert to a previous database state, you would need a backup or must run the setup script again.

---

## Questions?

If any step fails:
1. Check error message in SQL Editor
2. Verify Supabase credentials
3. Ensure you have admin access to the project
4. Contact support with the error message

---

**Last Updated:** January 15, 2026  
**Database:** Roboyudh 2026  
**Version:** Clean Slate (v1.0)
