# ROBOYUDH 2026 - FIXED BACKEND ENDPOINTS

Complete backend implementations with all security fixes applied.

---

## ============================================================
## 1. PAYMENT SUBMISSION ENDPOINT (FIXED)
## ============================================================

File: `api/payments/[id]/submit.ts`

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../utils/supabase';
import { verifyAuth, badRequest, success } from '../../utils/auth';

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MIN_TRANSACTION_ID = 5;
const MAX_TRANSACTION_ID = 50;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Authenticate user
  const user = await verifyAuth(req);
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }

  const { id: paymentId } = req.query;
  const { transactionId, screenshot_base64 } = req.body;

  try {
    // 2. Validate input
    if (!transactionId || typeof transactionId !== 'string') {
      return badRequest(res, 'Transaction ID is required');
    }

    if (transactionId.length < MIN_TRANSACTION_ID || transactionId.length > MAX_TRANSACTION_ID) {
      return badRequest(res, `Transaction ID must be ${MIN_TRANSACTION_ID}-${MAX_TRANSACTION_ID} characters`);
    }

    if (!screenshot_base64 || typeof screenshot_base64 !== 'string') {
      return badRequest(res, 'Screenshot is required');
    }

    // 3. Validate screenshot format
    const mimeMatch = screenshot_base64.match(/^data:([^;]+);base64,/);
    if (!mimeMatch) {
      return badRequest(res, 'Invalid screenshot format (must be data URL)');
    }

    const mimeType = mimeMatch[1];
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return badRequest(res, `Only PNG, JPEG, JPG allowed. Received: ${mimeType}`);
    }

    // 4. Validate screenshot size
    const buffer = Buffer.from(screenshot_base64.split(',')[1], 'base64');
    if (buffer.length > MAX_FILE_SIZE) {
      return badRequest(res, `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
    }

    // 5. Fetch payment and validate ownership
    const { data: payment, error: fetchErr } = await supabase
      .from('payments')
      .select('*, teams(user_id)')
      .eq('id', paymentId)
      .single();

    if (fetchErr || !payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
    }

    // 6. Verify ownership
    if (payment.user_id !== user.id) {
      console.warn(`Ownership check failed: ${user.id} !== ${payment.user_id}`);
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // 7. Verify status is PENDING (must be in PENDING to submit proof)
    if (payment.status !== 'PENDING') {
      return badRequest(res, `Payment must be in PENDING status. Current: ${payment.status}`);
    }

    // 8. Validate status transition (PENDING → WAITING_FOR_ADMIN_CONFIRMATION)
    const validTransition = validateStatusTransition('PENDING', 'WAITING_FOR_ADMIN_CONFIRMATION');
    if (!validTransition.valid) {
      return badRequest(res, validTransition.error!);
    }

    // 9. Upload screenshot to PRIVATE bucket
    const fileName = `${payment.team_id}/${paymentId}/screenshot_${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from('payment-screenshots') // PRIVATE bucket
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return res.status(500).json({
        success: false,
        error: 'Failed to upload screenshot',
      });
    }

    // 10. Update payment (store file path, NOT URL)
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'WAITING_FOR_ADMIN_CONFIRMATION',
        transaction_id: transactionId,
        screenshot_file_path: fileName, // Store path only
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .eq('user_id', user.id); // Double-check ownership at DB level

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update payment',
      });
    }

    // 11. Log in audit trail
    await supabase.from('audit_log').insert({
      admin_id: null,
      action: 'USER_SUBMITTED_PROOF',
      payment_id: paymentId,
      details: {
        user_id: user.id,
        transaction_id: transactionId,
        file_size: buffer.length,
        timestamp: new Date().toISOString(),
      },
    });

    return success(res, {
      paymentId,
      status: 'WAITING_FOR_ADMIN_CONFIRMATION',
      message: 'Payment proof submitted. Awaiting admin verification.',
    }, 201);

  } catch (err) {
    console.error('Submission error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit payment',
    });
  }
}

// Helper function
function validateStatusTransition(currentStatus: string, newStatus: string) {
  const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    'PENDING': ['WAITING_FOR_ADMIN_CONFIRMATION'],
    'WAITING_FOR_ADMIN_CONFIRMATION': ['APPROVED', 'REJECTED'],
    'APPROVED': [],
    'REJECTED': [],
  };

  if (!ALLOWED_TRANSITIONS[currentStatus]) {
    return {
      valid: false,
      error: `Unknown status: ${currentStatus}`,
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
```

---

## ============================================================
## 2. ADMIN APPROVAL ENDPOINT (ATOMIC)
## ============================================================

File: `api/admin/payments/[id]/approve.ts`

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../../utils/supabase';
import { verifyAdmin, success } from '../../../utils/auth';
import { sendPaymentApprovedEmail } from '../../../utils/email';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Verify admin (BOTH email AND is_admin claim)
  const admin = await verifyAdmin(req);
  if (!admin) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
  }

  const { id: paymentId } = req.query;

  try {
    // 2. Execute atomic approval (payment + ticket + audit in one transaction)
    const { data, error } = await supabase.rpc('approve_payment_atomic', {
      payment_id: paymentId,
      admin_id: admin.id,
      admin_email: admin.email,
    });

    if (error) {
      console.error('Approval error:', error);
      return res.status(400).json({
        success: false,
        error: 'Approval failed: ' + error.message,
      });
    }

    // 3. Extract results
    const ticketCode = data[0].ticket_code;
    const ticketId = data[0].ticket_id;

    // 4. Fetch payment and user for email
    const { data: payment } = await supabase
      .from('payments')
      .select('*, auth.users(email)')
      .eq('id', paymentId)
      .single();

    // 5. Try to send email (non-critical - doesn't fail the approval)
    let emailSent = false;
    try {
      if (payment && payment.auth?.users?.email) {
        await sendPaymentApprovedEmail(
          payment.auth.users.email,
          ticketCode,
          paymentId
        );
        emailSent = true;
      }
    } catch (emailErr) {
      console.error('Email failed:', emailErr);
      // Continue anyway - approval succeeded, email is secondary
    }

    console.log(`[ADMIN] ${admin.email} approved payment ${paymentId} - Ticket: ${ticketCode}`);

    return success(res, {
      paymentId,
      ticketId,
      ticketCode,
      status: 'APPROVED',
      emailSent,
      message: 'Payment approved successfully',
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({
      success: false,
      error: 'Approval failed. No changes made.',
    });
  }
}
```

---

## ============================================================
## 3. ADMIN REJECTION ENDPOINT (ATOMIC)
## ============================================================

File: `api/admin/payments/[id]/reject.ts`

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../../utils/supabase';
import { verifyAdmin, badRequest, success } from '../../../utils/auth';
import { sendPaymentRejectedEmail } from '../../../utils/email';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Verify admin
  const admin = await verifyAdmin(req);
  if (!admin) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
  }

  const { id: paymentId } = req.query;
  const { reason } = req.body;

  // 2. Validate reason
  if (!reason || typeof reason !== 'string' || reason.length < 5) {
    return badRequest(res, 'Rejection reason must be at least 5 characters');
  }

  try {
    // 3. Execute atomic rejection
    const { data, error } = await supabase.rpc('reject_payment_atomic', {
      payment_id: paymentId,
      admin_id: admin.id,
      rejection_reason: reason,
    });

    if (error) {
      console.error('Rejection error:', error);
      return res.status(400).json({
        success: false,
        error: 'Rejection failed: ' + error.message,
      });
    }

    // 4. Fetch payment and user for email
    const { data: payment } = await supabase
      .from('payments')
      .select('*, auth.users(email)')
      .eq('id', paymentId)
      .single();

    // 5. Try to send email
    let emailSent = false;
    try {
      if (payment && payment.auth?.users?.email) {
        await sendPaymentRejectedEmail(
          payment.auth.users.email,
          reason,
          paymentId
        );
        emailSent = true;
      }
    } catch (emailErr) {
      console.error('Email failed:', emailErr);
    }

    console.log(`[ADMIN] ${admin.email} rejected payment ${paymentId}`);

    return success(res, {
      paymentId,
      status: 'REJECTED',
      reason,
      emailSent,
      message: 'Payment rejected',
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({
      success: false,
      error: 'Rejection failed. No changes made.',
    });
  }
}
```

---

## ============================================================
## 4. ADMIN-ONLY SCREENSHOT URL GENERATION
## ============================================================

File: `api/admin/payments/[id]/screenshot-url.ts`

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../../utils/supabase';
import { verifyAdmin } from '../../../utils/auth';

const SIGNED_URL_EXPIRY_MINUTES = 30;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Verify admin (BOTH email AND is_admin claim required)
  const admin = await verifyAdmin(req);
  if (!admin) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
  }

  const { id: paymentId } = req.query;

  try {
    // 2. Fetch payment screenshot path
    const { data: payment, error: paymentErr } = await supabase
      .from('payments')
      .select('screenshot_file_path')
      .eq('id', paymentId)
      .single();

    if (paymentErr || !payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
    }

    // 3. Verify screenshot exists
    if (!payment.screenshot_file_path) {
      return res.status(404).json({
        success: false,
        error: 'No screenshot uploaded for this payment',
      });
    }

    // 4. Generate signed URL (time-limited, admin only)
    const { data: signedData, error: signError } = await supabase.storage
      .from('payment-screenshots')
      .createSignedUrl(
        payment.screenshot_file_path,
        SIGNED_URL_EXPIRY_MINUTES * 60 // Convert to seconds
      );

    if (signError || !signedData) {
      console.error('Signed URL error:', signError);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate screenshot URL',
      });
    }

    // 5. Log access for security audit
    await supabase.from('audit_log').insert({
      admin_id: admin.id,
      action: 'VIEWED_SCREENSHOT',
      payment_id: paymentId,
      details: {
        timestamp: new Date().toISOString(),
        signed_url_expires_at: new Date(Date.now() + SIGNED_URL_EXPIRY_MINUTES * 60000).toISOString(),
      },
    }).catch(err => console.error('Audit log error:', err));

    console.log(`[ADMIN] ${admin.email} accessed screenshot for payment ${paymentId}`);

    return res.status(200).json({
      success: true,
      data: {
        signedUrl: signedData.signedUrl,
        expiresInMinutes: SIGNED_URL_EXPIRY_MINUTES,
      },
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate screenshot URL',
    });
  }
}
```

---

## ============================================================
## 5. ADMIN-ONLY PHONE NUMBER ENDPOINT
## ============================================================

File: `api/admin/payments/[id]/user-phone.ts`

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../../utils/supabase';
import { verifyAdmin } from '../../../utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Verify admin
  const admin = await verifyAdmin(req);
  if (!admin) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
  }

  const { id: paymentId } = req.query;

  try {
    // 2. Fetch payment with team relationship
    const { data: payment, error: paymentErr } = await supabase
      .from('payments')
      .select('team_id')
      .eq('id', paymentId)
      .single();

    if (paymentErr || !payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
    }

    // 3. Fetch team phone (via admin-readable row)
    const { data: team, error: teamErr } = await supabase
      .from('teams')
      .select('phone_number, team_name, user_id, email:auth.users(email)')
      .eq('id', payment.team_id)
      .single();

    if (teamErr || !team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found',
      });
    }

    // 4. Log sensitive access
    console.log(`[ADMIN] ${admin.email} accessed phone for payment ${paymentId}`);

    await supabase.from('audit_log').insert({
      admin_id: admin.id,
      action: 'ACCESSED_PHONE_NUMBER',
      payment_id: paymentId,
      details: {
        timestamp: new Date().toISOString(),
      },
    }).catch(err => console.error('Audit error:', err));

    return res.status(200).json({
      success: true,
      data: {
        phone_number: team.phone_number,
        team_name: team.team_name,
      },
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch phone number',
    });
  }
}
```

---

## ============================================================
## 6. ENHANCED AUTH UTILITIES
## ============================================================

File: `api/utils/auth.ts`

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  isAdmin?: boolean;
}

// Verify regular user (JWT token required)
export async function verifyAuth(req: VercelRequest): Promise<AuthUser | null> {
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

    return {
      id: user.id,
      email: user.email!,
      isAdmin: false,
    };
  } catch (err) {
    console.error('Auth verification error:', err);
    return null;
  }
}

// Verify admin (BOTH email AND is_admin claim required)
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
      console.warn('Failed to get user from token');
      return null;
    }

    const user = data.user;

    // CHECK 1: Email must match exactly
    if (user.email !== 'abdulsist23@gmail.com') {
      console.warn(`[SECURITY] Non-admin email attempt: ${user.email}`);
      return null;
    }

    // CHECK 2: is_admin claim must be TRUE
    const isAdmin = user.user_metadata?.is_admin === true;
    if (!isAdmin) {
      console.warn(`[SECURITY] Missing is_admin claim for ${user.email}`);
      return null;
    }

    // All checks passed
    console.log(`[ADMIN] Authenticated: ${user.email}`);

    return {
      id: user.id,
      email: user.email,
      isAdmin: true,
    };

  } catch (err) {
    console.error('Admin verification error:', err);
    return null;
  }
}

// Helper: Send 401 Unauthorized
export function unauthorized(res: VercelResponse, message = 'Unauthorized') {
  return res.status(401).json({
    success: false,
    error: message,
  });
}

// Helper: Send 403 Forbidden
export function forbidden(res: VercelResponse, message = 'Access denied') {
  return res.status(403).json({
    success: false,
    error: message,
  });
}

// Helper: Send 400 Bad Request
export function badRequest(res: VercelResponse, message = 'Bad request') {
  return res.status(400).json({
    success: false,
    error: message,
  });
}

// Helper: Send 200 Success
export function success(res: VercelResponse, data: any, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}
```

---

## ============================================================
## TESTING CHECKLIST
## ============================================================

```
Admin Approval Tests:
  ☐ Admin can approve payment in WAITING_FOR_ADMIN_CONFIRMATION status
  ☐ Ticket is created atomically with payment update
  ☐ Audit log entry is created
  ☐ Email is sent (or logged if failed)
  ☐ Non-admin cannot approve
  ☐ Admin email verification fails for wrong email
  ☐ is_admin claim is checked

Admin Rejection Tests:
  ☐ Admin can reject payment
  ☐ Rejection reason is stored
  ☐ Audit log entry created
  ☐ Email sent to user
  ☐ Non-admin cannot reject

Payment Submission Tests:
  ☐ User can submit screenshot when status = PENDING
  ☐ Screenshot is uploaded to PRIVATE bucket
  ☐ File path is stored (not URL)
  ☐ Status changes to WAITING_FOR_ADMIN_CONFIRMATION
  ☐ File size validation (max 5MB)
  ☐ MIME type validation (PNG, JPEG only)
  ☐ Ownership validation (user_id check)
  ☐ Cannot submit if not PENDING

Screenshot URL Tests:
  ☐ Admin can get signed URL
  ☐ Signed URL expires after 30 minutes
  ☐ Non-admin cannot get signed URL
  ☐ Signed URL is logged in audit
  ☐ User cannot get signed URL

Phone Number Tests:
  ☐ Admin can access phone number
  ☐ User cannot directly query phone numbers
  ☐ Access is logged in audit
  ☐ Phone not exposed in payment views

Status Transition Tests:
  ☐ PENDING → WAITING_FOR_ADMIN_CONFIRMATION (allowed)
  ☐ PENDING → APPROVED (blocked)
  ☐ PENDING → REJECTED (blocked)
  ☐ WAITING → APPROVED (allowed)
  ☐ WAITING → REJECTED (allowed)
  ☐ APPROVED → any (blocked)
  ☐ REJECTED → any (blocked)
```

