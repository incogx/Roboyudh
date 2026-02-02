# Deploy Email Function to Supabase

## Prerequisites
- Supabase CLI installed: https://supabase.com/docs/guides/cli
- Resend API key: https://resend.com/api-keys

## Steps

### 1. Install Supabase CLI (if not installed)
```powershell
npm install -g supabase
```

### 2. Login to Supabase
```powershell
supabase login
```

### 3. Link Your Project
```powershell
# Get your project reference from Supabase Dashboard > Project Settings > General
supabase link --project-ref YOUR_PROJECT_REF
```

### 4. Get Resend API Key
1. Go to https://resend.com
2. Sign up / Log in
3. Create API key
4. Copy the key (starts with `re_`)

### 5. Set Resend API Key as Secret
```powershell
supabase secrets set RESEND_API_KEY=re_your_resend_api_key_here
```

### 6. Deploy the Email Function
```powershell
cd C:\Users\jabdu\Downloads\Roboyudh
supabase functions deploy send-email
```

### 7. Verify Deployment
```powershell
supabase functions list
```

You should see `send-email` in the list.

## Test the Function

After deployment, approve any payment in the admin panel and the email will be sent automatically!

## How It Works

When you click "Approve" in Admin panel:
1. ✅ Payment status → APPROVED
2. 🎫 Ticket generated with code: `RBY26-XXXX-XXXXXXXX`
3. 📧 Email sent to user with:
   - Ticket code
   - Event details
   - Venue & reporting time
   - Important instructions

## Troubleshooting

If email doesn't send:
1. Check Supabase Dashboard > Edge Functions > send-email > Logs
2. Verify RESEND_API_KEY is set correctly
3. Check Resend dashboard for delivery status
