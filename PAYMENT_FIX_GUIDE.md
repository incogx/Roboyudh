# 🔧 QUICK FIX GUIDE

## Issue Found
The `payments` table was missing the `razorpay_order_id` column needed to track Razorpay orders.

## ✅ What Was Fixed

### 1. Database Schema Updated
- Added `razorpay_order_id TEXT UNIQUE` column to payments table
- Added 'created' status to payment statuses
- Added index for faster lookups

### 2. Files Modified
- ✅ `sql/FRESH_COMPLETE_SETUP.sql` - Updated for fresh installs
- ✅ `sql/CLEAN_SLATE_SETUP.sql` - Updated clean slate setup
- ✅ `sql/ADD_RAZORPAY_COLUMN.sql` - NEW migration script
- ✅ `api/payment.ts` - Already updated with proper logic

## 🚀 How to Apply the Fix

### Option 1: Run Migration (Recommended)
1. Go to Supabase: https://supabase.com/dashboard/project/umidkzbqpfveovsxalcj/sql
2. Open `sql/ADD_RAZORPAY_COLUMN.sql`
3. Copy and paste the entire script
4. Click "Run"
5. Verify the output shows the new column

### Option 2: Fresh Setup (If you want to start clean)
1. Go to Supabase SQL Editor
2. Run `sql/FRESH_COMPLETE_SETUP.sql`
3. This will drop everything and recreate with the fix

## 🧪 Test the Fix

After running the migration:

1. Clear browser cache (Ctrl+Shift+Delete)
2. Go to https://roboyudh-phi.vercel.app
3. Register for an event
4. Click "Proceed to Payment"
5. You should see the Razorpay payment modal open!

## 📊 New Payment Flow

1. User registers → Team created
2. Clicks "Proceed to Payment" → API creates Razorpay order
3. Order ID saved to `payments.razorpay_order_id`
4. User completes payment → Webhook verifies
5. Payment marked as 'paid', ticket generated

## 🎉 You're All Set!

The payment system is now fully configured and should work perfectly.

**Next Steps:**
- Run the migration script
- Test a payment
- Switch to LIVE Razorpay keys before March 15, 2026
