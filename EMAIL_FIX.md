# Quick Fix: Email Not Sending

## Problem
"Edge Function returned a non-2xx status code"

## Solution Options

### Option 1: Deploy Edge Function (Recommended)

Run these commands in PowerShell:

```powershell
# 1. Install Supabase CLI (if not installed)
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Get your project reference from Supabase Dashboard
# Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/general
# Copy the "Reference ID"

# 4. Link project
supabase link --project-ref YOUR_PROJECT_REF

# 5. Get Resend API Key
# Go to: https://resend.com/api-keys
# Create free account and get API key (starts with re_)

# 6. Set the API key as a secret
supabase secrets set RESEND_API_KEY=re_your_api_key_here

# 7. Deploy the function
cd C:\Users\jabdu\Downloads\Roboyudh
supabase functions deploy send-email
```

### Option 2: Manual Email Notification (Quick Workaround)

For now, manually send emails to users:

**Copy this email template and send manually:**

---
**Subject:** 🎉 ROBOYUDH 2026 - Registration Confirmed for [EVENT_NAME]

**To:** [USER_EMAIL]

**Body:**
```
Hello Team [TEAM_NAME],

Congratulations! 🎉 Your team has been selected for [EVENT_NAME].

Your Ticket Code: [TICKET_CODE]

Event Details:
📍 Venue: Sathyabama Institute of Science and Technology, Chennai
📅 Date: [EVENT_DATE]
⏰ Reporting Time: 08:40 AM

Important:
- Carry a printed or digital copy of this ticket
- Arrive at the venue by the reporting time
- Ensure all team members are present
- Bring valid ID proof for verification

See you at the event! 🚀

Regards,
ROBOYUDH Team
Sathyabama Institute of Science and Technology
```
---

## Verify Edge Function is Working

After deployment, check:

1. **Supabase Dashboard** → Edge Functions → send-email → Should show "Active"
2. **Test by approving a payment** in admin panel
3. **Check logs**: Supabase Dashboard → Edge Functions → send-email → Logs

## Current Status

✅ Payment approved: Yes
✅ Ticket generated: Yes (RBY26-550E-2B956CB6)
❌ Email sent: No

User email: wishnuvardhanreddy7@gmail.com
Team: Naveen
Event: RC Racing
