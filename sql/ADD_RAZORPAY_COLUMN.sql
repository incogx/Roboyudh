-- ============================================================
-- MIGRATION: Add razorpay_order_id to payments table
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add razorpay_order_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'razorpay_order_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN razorpay_order_id TEXT UNIQUE;
    CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON payments(razorpay_order_id);
  END IF;
END $$;

-- Update status column to allow 'created' status
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check 
  CHECK (status IN ('paid', 'unpaid', 'created'));

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'payments'
ORDER BY ordinal_position;
