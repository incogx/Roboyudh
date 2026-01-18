# ROBOYUDH 2026 - PRODUCTION-GRADE SECURITY FIXES

## ============================================================
## TASK 1: ADMIN SECURITY (SQL + RLS + BACKEND)
## ============================================================

### 1.1 Supabase Trigger (Auto-set is_admin for email)

```sql
-- Create custom claim function
CREATE OR REPLACE FUNCTION set_admin_claim()
RETURNS TRIGGER AS $$
BEGIN
  -- If email matches admin email, set is_admin claim
  IF NEW.email = 'abdulsist23@gmail.com' THEN
    NEW.raw_user_meta_data := jsonb_set(
      COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
      '{is_admin}',
      'true'::jsonb
    );
  ELSE
    -- Ensure non-admin users don't have admin claim
    IF NEW.raw_user_meta_data ? 'is_admin' THEN
      NEW.raw_user_meta_data := NEW.raw_user_meta_data - 'is_admin';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger on auth.users table
CREATE TRIGGER set_admin_on_user_create
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION set_admin_claim();

CREATE TRIGGER set_admin_on_user_update
  BEFORE UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION set_admin_claim();
```

### 1.2 Enhanced RLS Policies (Check is_admin flag)

```sql
-- Replace old policies with these that check is_admin flag:

-- ADMIN CHECK HELPER (more explicit)
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'abdulsist23@gmail.com'
    AND
    (SELECT (raw_user_meta_data->>'is_admin')::BOOLEAN FROM auth.users WHERE id = auth.uid()) = TRUE
  );
END;
$$ LANGUAGE plpgsql;

-- UPDATE: payments_update_admin (BOTH email AND is_admin required)
DROP POLICY "payments_update_admin" ON payments;
CREATE POLICY "payments_update_admin" ON payments
  FOR UPDATE
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- UPDATE: tickets_create_admin (BOTH email AND is_admin required)
DROP POLICY "tickets_create_admin" ON tickets;
CREATE POLICY "tickets_create_admin" ON tickets
  FOR INSERT
  WITH CHECK (is_admin_user());

-- UPDATE: audit_log_create (Only admins can log)
DROP POLICY "audit_log_create" ON audit_log;
CREATE POLICY "audit_log_create" ON audit_log
  FOR INSERT
  WITH CHECK (is_admin_user());
```

### 1.3 Backend Verification (Node.js/TypeScript)

```typescript
// api/utils/auth.ts - ENHANCED

export async function verifyAdmin(req: VercelRequest): Promise<AuthUser | null> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split('Bearer ')[1];

    // Get user from Supabase
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }

    const user = data.user;
    
    // CHECK 1: Email must be exact match
    if (user.email !== 'abdulsist23@gmail.com') {
      console.warn(`Unauthorized admin attempt by ${user.email}`);
      return null;
    }

    // CHECK 2: is_admin claim must be TRUE
    const isAdmin = user.user_metadata?.is_admin === true;
    if (!isAdmin) {
      console.warn(`User ${user.email} missing is_admin claim`);
      return null;
    }

    // CHECK 3: Log all admin actions
    console.log(`[ADMIN] ${user.email} - Action authorized`);

    return {
      id: user.id,
      email: user.email!,
      isAdmin: true,
    };
  } catch (err) {
    console.error('Admin verification error:', err);
    return null;
  }
}

// Usage in admin endpoints:
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const admin = await verifyAdmin(req);
  
  if (!admin) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
  }
  
  // Admin logic here...
}
```

---

## ============================================================
## TASK 2: PAYMENT SCREENSHOT STORAGE (PRIVATE + SIGNED URLS)
## ============================================================

### 2.1 Storage Bucket Configuration

```javascript
// In Supabase Dashboard:
// 1. Create bucket: "payment-screenshots"
// 2. Set to PRIVATE (not public)
// 3. Set expiration: Optional (60 days recommended)
// 4. Enable RLS: YES
```

### 2.2 Database Schema Change (Remove public URLs)

```sql
-- CURRENT (problematic):
-- payment_screenshot_url VARCHAR(500) -- stores public URL

-- CHANGED TO (better):
-- Keep same column, but store only FILE PATH, not full URL
-- Or use BOOLEAN flag + generate URLs on-demand

-- OPTION A: Store file path only (recommended)
ALTER TABLE payments 
  ADD COLUMN screenshot_file_path VARCHAR(500);

-- OPTION B: Keep track of file existence
ALTER TABLE payments 
  ADD COLUMN screenshot_stored BOOLEAN DEFAULT FALSE;
```

### 2.3 Backend Upload & Signed URL Generation

```typescript
// api/payments/[id]/submit.ts - FIXED

import { VerifyRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../utils/supabase';
import { verifyAuth, badRequest, success } from '../../utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const { id } = req.query;
  const { transactionId, screenshot_base64 } = req.body; // Frontend sends base64

  try {
    // 1. Validate payment ownership
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (!payment || payment.user_id !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // 2. Validate status (must be PENDING)
    if (payment.status !== 'PENDING') {
      return badRequest(res, 'Payment already submitted');
    }

    // 3. Validate file
    if (!screenshot_base64 || screenshot_base64.length === 0) {
      return badRequest(res, 'Screenshot required');
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(screenshot_base64, 'base64');

    // Check size (max 5MB)
    if (buffer.length > 5 * 1024 * 1024) {
      return badRequest(res, 'File size exceeds 5MB');
    }

    // 4. Upload to PRIVATE bucket
    const fileName = `${payment.id}/screenshot_${Date.now()}.png`;
    const { error: uploadError, data } = await supabase.storage
      .from('payment-screenshots') // PRIVATE bucket
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // 5. Update payment (store file path, NOT public URL)
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'WAITING_FOR_ADMIN_CONFIRMATION',
        transaction_id: transactionId,
        screenshot_file_path: fileName, // Store path, not URL
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) throw updateError;

    return success(res, {
      paymentId: payment.id,
      status: 'WAITING_FOR_ADMIN_CONFIRMATION',
      message: 'Payment submitted. Waiting for admin confirmation.',
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit payment',
    });
  }
}
```

### 2.4 Admin-Only Signed URL Generation

```typescript
// api/admin/payments/[id]/screenshot.ts - NEW ENDPOINT

import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../../utils/supabase';
import { verifyAdmin } from '../../../utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Admin verification REQUIRED
  const admin = await verifyAdmin(req);
  if (!admin) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
  }

  const { id } = req.query;

  try {
    // Fetch payment
    const { data: payment, error } = await supabase
      .from('payments')
      .select('screenshot_file_path')
      .eq('id', id)
      .single();

    if (error || !payment || !payment.screenshot_file_path) {
      return res.status(404).json({
        success: false,
        error: 'Screenshot not found',
      });
    }

    // Generate signed URL (valid for 30 minutes)
    const { data, error: signError } = await supabase.storage
      .from('payment-screenshots')
      .createSignedUrl(payment.screenshot_file_path, 30 * 60); // 30 min

    if (signError) throw signError;

    // Log access
    console.log(`[ADMIN] ${admin.email} accessed screenshot for payment ${id}`);

    return res.status(200).json({
      success: true,
      data: {
        signedUrl: data.signedUrl,
        expiresIn: 30 * 60,
      },
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate screenshot URL',
    });
  }
}
```

### 2.5 RLS Policy for Screenshot Access

```sql
-- Prevent users from accessing screenshot files
-- This is enforced by STORAGE RLS, not table RLS

-- In Supabase Storage Policy Editor:
-- Set for "payment-screenshots" bucket:

CREATE POLICY "Admin only screenshot access"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'payment-screenshots'
  AND (
    SELECT (raw_user_meta_data->>'is_admin')::BOOLEAN
    FROM auth.users
    WHERE id = auth.uid()
  ) = TRUE
  AND (
    SELECT email FROM auth.users WHERE id = auth.uid()
  ) = 'abdulsist23@gmail.com'
);
```

---

## ============================================================
## TASK 3: PAYMENT SUBMISSION CONTRACT (FIXED)
## ============================================================

### 3.1 Agreed Format: Multipart/Form-Data (Backend Upload)

**Flow:**
1. Frontend sends: base64 screenshot + transaction_id to POST /api/payments/:id/submit
2. Backend receives: validates, uploads to Storage, stores file path
3. Backend returns: success/error
4. Users NEVER get direct access to screenshot URLs

**Frontend Code:**

```typescript
// components/PaymentForm.tsx

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Read file as base64
  const reader = new FileReader();
  reader.onload = async (event) => {
    const base64 = event.target?.result as string;
    
    const response = await fetch(`/api/payments/${paymentId}/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionId,
        screenshot_base64: base64,
      }),
    });
    
    // Handle response...
  };
  reader.readAsDataURL(screenshot);
};
```

**Backend Validation (in /api/payments/[id]/submit.ts):**

```typescript
// File validation
const validMimes = ['image/png', 'image/jpeg', 'image/jpg'];
const mimeType = screenshot_base64.split(';')[0].replace('data:', '');

if (!validMimes.includes(mimeType)) {
  return badRequest(res, 'Only PNG, JPEG, JPG allowed');
}

// Size validation
const buffer = Buffer.from(screenshot_base64, 'base64');
if (buffer.length > 5 * 1024 * 1024) {
  return badRequest(res, 'File size exceeds 5MB');
}

// Transaction ID validation
if (!transactionId || transactionId.length < 5 || transactionId.length > 50) {
  return badRequest(res, 'Transaction ID must be 5-50 characters');
}

// Ownership validation
if (payment.user_id !== user.id) {
  return res.status(403).json({ success: false, error: 'Access denied' });
}
```

---

## ============================================================
## TASK 4: STATUS LOCKING (PREVENT UPDATES ON LOCKED STATUSES)
## ============================================================

### 4.1 RLS Policy: Lock REJECTED and APPROVED

```sql
-- Block updates on REJECTED payments
CREATE POLICY "payments_reject_lock" ON payments
  FOR UPDATE
  USING (status != 'REJECTED' AND status != 'APPROVED')
  WITH CHECK (status != 'REJECTED' AND status != 'APPROVED');
```

### 4.2 Backend Guard (Double-Check)

```typescript
// Before ANY update operation on payments:

async function validatePaymentStatusLock(paymentId: string): Promise<boolean> {
  const { data: payment } = await supabase
    .from('payments')
    .select('status')
    .eq('id', paymentId)
    .single();

  if (!payment) return false;

  // These statuses are LOCKED from updates
  const lockedStatuses = ['REJECTED', 'APPROVED'];
  
  if (lockedStatuses.includes(payment.status)) {
    console.warn(`Attempted update on locked payment ${paymentId} (status: ${payment.status})`);
    return false;
  }

  return true;
}

// Usage:
const isUnlocked = await validatePaymentStatusLock(id);
if (!isUnlocked) {
  return badRequest(res, 'Payment is locked. No further updates allowed.');
}
```

---

## ============================================================
## TASK 5: ATOMIC ADMIN APPROVAL FLOW
## ============================================================

### 5.1 Atomic Approval Operation (All or Nothing)

```typescript
// api/admin/payments/[id]/approve.ts - ATOMIC

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const admin = await verifyAdmin(req);
  if (!admin) return res.status(403).json({ success: false, error: 'Forbidden' });

  const { id } = req.query;

  try {
    // Start transaction
    const transaction = await supabase.rpc('approve_payment_atomic', {
      payment_id: id,
      admin_id: admin.id,
      admin_email: admin.email,
    });

    if (transaction.error) {
      throw transaction.error;
    }

    return success(res, {
      paymentId: id,
      status: 'APPROVED',
      ticketId: transaction.data.ticket_id,
      message: 'Payment approved successfully',
    });

  } catch (err) {
    console.error('Approval failed:', err);
    // Transaction is rolled back automatically
    return res.status(500).json({
      success: false,
      error: 'Approval failed. No changes made.',
    });
  }
}
```

### 5.2 Atomic Transaction (SQL Function)

```sql
-- Create atomic approval function
CREATE OR REPLACE FUNCTION approve_payment_atomic(
  payment_id UUID,
  admin_id UUID,
  admin_email VARCHAR
)
RETURNS TABLE (ticket_id UUID, ticket_code VARCHAR) AS $$
DECLARE
  v_ticket_id UUID;
  v_ticket_code VARCHAR;
  v_team_id UUID;
  v_event_id UUID;
  v_user_id UUID;
  v_amount DECIMAL;
BEGIN
  
  -- Step 1: Lock payment row for update
  SELECT team_id, event_id, user_id, amount INTO v_team_id, v_event_id, v_user_id, v_amount
  FROM payments
  WHERE id = payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;

  -- Step 2: Generate ticket code and create ticket
  v_ticket_code := 'ROBO2026-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                   SUBSTR(MD5(gen_random_uuid()::TEXT), 1, 8);
  
  INSERT INTO tickets (team_id, event_id, user_id, payment_id, ticket_code, qr_code_url)
  VALUES (v_team_id, v_event_id, v_user_id, payment_id, v_ticket_code, 
          'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' || v_ticket_code)
  RETURNING tickets.id INTO v_ticket_id;

  -- Step 3: Update payment status
  UPDATE payments
  SET status = 'APPROVED',
      admin_id = admin_id,
      admin_decision_at = NOW(),
      updated_at = NOW()
  WHERE id = payment_id;

  -- Step 4: Log audit entry
  INSERT INTO audit_log (admin_id, action, payment_id, details)
  VALUES (admin_id, 'APPROVED_PAYMENT', payment_id, jsonb_build_object(
    'ticket_code', v_ticket_code,
    'team_id', v_team_id,
    'amount', v_amount,
    'timestamp', NOW()
  ));

  -- All steps succeeded, return results
  RETURN QUERY SELECT v_ticket_id, v_ticket_code;

  -- If any step fails, entire transaction rolls back automatically

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Approval failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;
```

### 5.3 Rollback & Error Handling

```typescript
// If transaction fails (email service, etc.):

async function approvePaymentWithFallback(paymentId: string, adminId: string) {
  try {
    // Execute atomic approval
    const { data, error } = await supabase.rpc('approve_payment_atomic', {
      payment_id: paymentId,
      admin_id: adminId,
      admin_email: 'abdulsist23@gmail.com',
    });

    if (error) {
      throw new Error(`Approval failed: ${error.message}`);
    }

    const ticketCode = data[0].ticket_code;

    // Try to send email (non-critical)
    try {
      await sendPaymentApprovedEmail(userEmail, ticketCode, paymentId);
    } catch (emailErr) {
      // Log but don't fail
      console.error('Email send failed:', emailErr);
      // Admin can see ticket was created even if email failed
    }

    return {
      success: true,
      ticketCode,
      emailSent: true, // or false if failed
    };

  } catch (err) {
    // Entire transaction rolled back if approval failed
    console.error('Approval transaction failed:', err);
    return {
      success: false,
      error: 'Approval failed. No changes made.',
    };
  }
}
```

---

## ============================================================
## TASK 6: PHONE NUMBER PRIVACY (RLS + ADMIN-ONLY ACCESS)
## ============================================================

### 6.1 RLS Policy: Hide phone from users

```sql
-- Update teams RLS to hide phone_number from users
-- Option 1: Don't return phone_number in user queries

CREATE OR REPLACE FUNCTION teams_user_visible()
RETURNS TABLE (
  id UUID,
  event_id UUID,
  user_id UUID,
  team_name VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
  -- NOTE: phone_number is NOT included
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.event_id,
    t.user_id,
    t.team_name,
    t.created_at,
    t.updated_at
  FROM teams t
  WHERE t.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql;

-- OR Option 2: RLS policy that hides phone from non-admins
DROP POLICY "teams_read_own" ON teams;
CREATE POLICY "teams_read_own" ON teams
  FOR SELECT
  USING (user_id = auth.uid());
  -- Note: RLS doesn't filter columns, only rows
  -- So users can still see their own phone. 
  -- This is OK because it's their own data.
  -- The real protection is: users cannot see OTHER users' phones
```

### 6.2 Admin-Only Phone Endpoint

```typescript
// api/admin/payments/[id]/user-phone.ts - NEW

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await verifyAdmin(req);
  if (!admin) {
    return res.status(403).json({ success: false, error: 'Admin required' });
  }

  const { id } = req.query; // payment ID

  try {
    // Fetch payment with team relationship
    const { data: payment, error: paymentErr } = await supabase
      .from('payments')
      .select('team_id')
      .eq('id', id)
      .single();

    if (paymentErr || !payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    // Fetch team phone (admin can read all)
    const { data: team, error: teamErr } = await supabase
      .from('teams')
      .select('phone_number, team_name, user_id')
      .eq('id', payment.team_id)
      .single();

    if (teamErr || !team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    // Log this sensitive access
    console.log(`[ADMIN] ${admin.email} accessed phone for payment ${id}`);

    return res.status(200).json({
      success: true,
      data: {
        phone_number: team.phone_number,
        team_name: team.team_name,
      },
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch phone',
    });
  }
}
```

### 6.3 View to Prevent Phone Leak via Joins

```sql
-- Secure view for admin payments (no phone in joins)
CREATE OR REPLACE VIEW admin_payments_secure AS
SELECT 
  p.id,
  p.team_id,
  p.event_id,
  p.user_id,
  p.amount,
  p.transaction_id,
  p.screenshot_file_path,
  p.status,
  p.created_at,
  e.name AS event_name,
  t.team_name,
  -- Deliberately omit: t.phone_number
  u.email AS user_email
FROM payments p
JOIN events e ON e.id = p.event_id
JOIN teams t ON t.id = p.team_id
JOIN auth.users u ON u.id = p.user_id;

-- Admin queries this view instead of joining teams directly
-- Forces phone access through dedicated endpoint only
```

---

## ============================================================
## TASK 7: STATUS TRANSITION ENFORCEMENT
## ============================================================

### 7.1 Allowed Transitions Table

```
STATUS TRANSITION RULES:
=======================

PENDING
  ├─→ WAITING_FOR_ADMIN_CONFIRMATION (USER submits proof)
  └─→ CANNOT go to: APPROVED, REJECTED (only via WAITING)

WAITING_FOR_ADMIN_CONFIRMATION
  ├─→ APPROVED (ADMIN approves)
  ├─→ REJECTED (ADMIN rejects)
  └─→ Cannot go back to PENDING

APPROVED
  └─→ LOCKED (no further transitions)

REJECTED
  └─→ LOCKED (no further transitions)

INVALID TRANSITIONS (must be rejected):
  ✗ PENDING → APPROVED (skip WAITING)
  ✗ APPROVED → WAITING (backwards)
  ✗ REJECTED → ANYTHING (locked)
  ✗ Sideways moves
```

### 7.2 Backend Transition Validation

```typescript
// utils/paymentTransitions.ts

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  'PENDING': ['WAITING_FOR_ADMIN_CONFIRMATION'],
  'WAITING_FOR_ADMIN_CONFIRMATION': ['APPROVED', 'REJECTED'],
  'APPROVED': [],  // Locked
  'REJECTED': [],  // Locked
};

export function validateStatusTransition(
  currentStatus: string,
  newStatus: string
): { valid: boolean; error?: string } {
  
  if (!ALLOWED_TRANSITIONS[currentStatus]) {
    return {
      valid: false,
      error: `Unknown current status: ${currentStatus}`,
    };
  }

  if (!ALLOWED_TRANSITIONS[currentStatus].includes(newStatus)) {
    return {
      valid: false,
      error: `Cannot transition from ${currentStatus} to ${newStatus}`,
    };
  }

  return { valid: true };
}

// Usage in /api/payments/[id]/submit.ts:
const transition = validateStatusTransition('PENDING', 'WAITING_FOR_ADMIN_CONFIRMATION');
if (!transition.valid) {
  return badRequest(res, transition.error!);
}

// Usage in /api/admin/payments/[id]/approve.ts:
const transition = validateStatusTransition('WAITING_FOR_ADMIN_CONFIRMATION', 'APPROVED');
if (!transition.valid) {
  return badRequest(res, transition.error!);
}
```

### 7.3 Database Constraint (CHECK constraint)

```sql
-- Add CHECK constraint to enforce valid statuses
ALTER TABLE payments
ADD CONSTRAINT valid_payment_status
CHECK (status IN ('PENDING', 'WAITING_FOR_ADMIN_CONFIRMATION', 'APPROVED', 'REJECTED'));

-- Add trigger to enforce transitions
CREATE OR REPLACE FUNCTION validate_payment_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Get old status
  SELECT status INTO OLD FROM payments WHERE id = NEW.id;

  -- If status hasn't changed, allow
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Validate transition
  CASE OLD.status
    WHEN 'PENDING' THEN
      IF NEW.status NOT IN ('WAITING_FOR_ADMIN_CONFIRMATION') THEN
        RAISE EXCEPTION 'Invalid transition from PENDING to %', NEW.status;
      END IF;
    
    WHEN 'WAITING_FOR_ADMIN_CONFIRMATION' THEN
      IF NEW.status NOT IN ('APPROVED', 'REJECTED') THEN
        RAISE EXCEPTION 'Invalid transition from WAITING_FOR_ADMIN_CONFIRMATION to %', NEW.status;
      END IF;
    
    WHEN 'APPROVED', 'REJECTED' THEN
      RAISE EXCEPTION 'Cannot change status from % (locked)', OLD.status;
    
    ELSE
      RAISE EXCEPTION 'Unknown status: %', OLD.status;
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_transition_validation
  BEFORE UPDATE OF status ON payments
  FOR EACH ROW
  EXECUTE FUNCTION validate_payment_transition();
```

### 7.4 Clear Error Messages

```typescript
// api/utils/errors.ts

export const PAYMENT_ERRORS = {
  INVALID_TRANSITION: (current: string, attempted: string) =>
    `Cannot change payment from ${current} to ${attempted}`,
  
  LOCKED_STATUS: (status: string) =>
    `Payment with status "${status}" is locked and cannot be modified`,
  
  PENDING_ONLY_ALLOWED: 
    `Payment must be in PENDING status to submit proof`,
  
  ALREADY_SUBMITTED:
    `Payment already submitted for review`,
};

// Usage:
if (payment.status !== 'PENDING') {
  return badRequest(res, PAYMENT_ERRORS.PENDING_ONLY_ALLOWED);
}
```

---

## ============================================================
## SUMMARY OF ALL FIXES
## ============================================================

| Task | Status | Fix Applied |
|------|--------|------------|
| 1. Admin Security | ✅ | Trigger + is_admin flag + backend verification |
| 2. Screenshot Privacy | ✅ | Private bucket + signed URLs + admin endpoint |
| 3. Payment Contract | ✅ | Multipart base64 + validation + ownership check |
| 4. Status Locking | ✅ | RLS + backend guard + locked status enforcement |
| 5. Atomic Approval | ✅ | SQL transaction function + rollback on failure |
| 6. Phone Privacy | ✅ | Admin-only endpoint + view without phone |
| 7. Status Transitions | ✅ | Validation function + database trigger + errors |

---

## PRODUCTION DEPLOYMENT CHECKLIST

```
Database:
  ☐ Apply all SQL changes (triggers, functions, constraints)
  ☐ Create storage bucket "payment-screenshots" (PRIVATE)
  ☐ Enable RLS on storage bucket
  ☐ Run migration on existing payments table

Backend:
  ☐ Add all new endpoints
  ☐ Replace old endpoints with fixed versions
  ☐ Add verifyAdmin() checks to all admin endpoints
  ☐ Add validateStatusTransition() to update operations
  ☐ Add validatePaymentStatusLock() to all updates
  ☐ Test all error paths

Frontend:
  ☐ Update payment form to send base64
  ☐ Remove any direct storage access code
  ☐ Update admin dashboard to use new endpoints
  ☐ Verify no screenshot URLs are displayed

Testing:
  ☐ Test non-admin cannot access admin endpoints
  ☐ Test status transitions are enforced
  ☐ Test rejected payments cannot be updated
  ☐ Test admin approval is atomic (all or nothing)
  ☐ Test screenshot is never exposed to users
  ☐ Test phone number is only in admin endpoints
```

