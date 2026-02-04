# 🔧 FIX APPLIED - Testing Guide

## Changes Made ✅

1. **Authorization Header Fixed**
   - ❌ Before: `Authorization: Bearer ${key}` → 401 error
   - ✅ After: `apikey: ${key}` → Correct format for Supabase Edge Functions

2. **Added x-client-info Header**
   - Better Supabase compatibility

3. **CORS Response Fixed**
   - Changed from `"ok"` string to `null` body in OPTIONS response

4. **Code Rebuilt**
   - All changes compiled into production build

---

## Testing Steps

### 1. Clear Browser Cache
```
Windows: Ctrl + Shift + R
Mac: Cmd + Shift + R
Or: F12 → Right-click refresh button → Empty cache and hard refresh
```

### 2. Open Admin Panel
- Go to: http://localhost:5173/admin (or your deployment URL)
- Login with: organizers.roboyudh@gmail.com

### 3. Find a Test Payment
- Go to **Registrations** tab
- Look for a team with payment status: **PENDING**
- Click on the team to expand

### 4. Click "Approve & Generate Ticket"
- Should see loading state
- Check console (F12) for any errors

### 5. Expected Success
```
✅ Payment status → APPROVED
✅ Ticket code generated: RBY26-XXXX-XXXXXXXX
✅ Email sent to user
✅ Success popup shown
```

---

## Troubleshooting

### Still Getting 401 Error?

1. **Check browser console** (F12):
   - Look for error messages
   - Network tab → filter by `create-ticket`
   - Check request headers

2. **Clear everything and restart**:
   ```powershell
   # 1. Stop dev server (if running)
   # Ctrl+C in terminal

   # 2. Clear node modules cache
   npm cache clean --force

   # 3. Restart dev server
   npm run dev
   ```

3. **Check Supabase Function Status**:
   - Go to: https://supabase.com/dashboard/project/kbwntymxockacgzfabys/functions/create-ticket
   - Click **Logs** tab
   - Trigger approval again and look for:
     - `📦 Create-Ticket Request received`
     - `✅ Request parsed`
     - `✅ Ticket created successfully!`

### Email Not Sending?

1. **Check secrets are set**:
   - Go to Supabase Dashboard → Functions Settings
   - Verify these exist:
     - `SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `RESEND_API_KEY`

2. **Check send-email logs**:
   - Go to: https://supabase.com/dashboard/project/kbwntymxockacgzfabys/functions/send-email
   - Click **Logs**
   - Look for error messages

---

## What Each Header Does

| Header | Purpose |
|--------|---------|
| `Content-Type: application/json` | Tells server request body is JSON |
| `apikey: ${supabaseAnonKey}` | Authenticates with Supabase (required) |
| `x-client-info: supabase-js/2.0` | Identifies client library |

---

## Common Issues & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Wrong auth header | Use `apikey` not `Authorization` ✅ Done |
| 404 Not Found | Function not deployed | Redeploy: `supabase functions deploy create-ticket` ✅ Done |
| CORS Error | Missing CORS headers | Edge function has correct CORS ✅ Done |
| "Failed to fetch" | Network/CORS issue | See above |
| Email not sent | `RESEND_API_KEY` not set | Set in Supabase Dashboard |

---

## Files Modified

- ✅ [src/lib/db.ts](src/lib/db.ts) - Fixed headers in createTicket()
- ✅ [supabase/functions/create-ticket/index.ts](supabase/functions/create-ticket/index.ts) - Fixed CORS response

---

## Next: Set Secrets (If Not Done)

If email is still not sending, verify these secrets are set in Supabase:

Go to: https://supabase.com/dashboard/project/kbwntymxockacgzfabys/settings/functions

Set these environment variables:
1. `SUPABASE_URL` = `https://kbwntymxockacgzfabys.supabase.co`
2. `SUPABASE_SERVICE_ROLE_KEY` = (from Settings → API)
3. `RESEND_API_KEY` = (from https://resend.com/api-keys)

---
