# 🔧 IMPLEMENTATION GUIDE - PRODUCTION FIXES

Quick reference for implementing all 7 security fixes.

---

## STEP 1: DATABASE DEPLOYMENT (15 minutes)

### 1.1 Login to Supabase

Go to: https://supabase.com → Project Console

### 1.2 Run SQL Migrations

Navigate to: **SQL Editor** → Create new query

**Paste entire contents of:** `sql/schema.sql`

⚠️ **IMPORTANT:** This replaces existing schema. Backup first if you have data!

**What gets deployed:**
- 2 new trigger functions (admin claim auto-set)
- 2 validation functions (status transitions)
- 2 atomic approval functions
- Updated RLS policies (48 total)
- New database views
- Constraints

### 1.3 Create Storage Bucket

Navigate to: **Storage** → Create new bucket

**Bucket name:** `payment-screenshots`  
**Access:** Private  
**File size limit:** 5 MB  
**Allowed MIME types:** image/png, image/jpeg

### 1.4 Enable Storage RLS

Navigate to: **Storage** → **payment-screenshots** → Policies

**Create policy:**

```sql
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

### 1.5 Verify Admin User

Go to: **Authentication** → **Users**

Find: `abdulsist23@gmail.com`

Check: `raw_user_meta_data` should have `"is_admin": true`

⚠️ **If missing:** The trigger will auto-set it on next login/update

---

## STEP 2: BACKEND DEPLOYMENT (30 minutes)

### 2.1 Create New Directories

```bash
mkdir -p api/admin/payments/[id]
```

### 2.2 Add/Update Backend Files

**File 1:** `api/utils/auth.ts`

Copy from: `API_ENDPOINTS_FIXED.md` → Section "ENHANCED AUTH UTILITIES"

**What's new:**
- `verifyAdmin()` function (checks email + is_admin claim)
- Helper functions (unauthorized, forbidden, badRequest, success)

**File 2:** `api/utils/paymentTransitions.ts`

```typescript
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  'PENDING': ['WAITING_FOR_ADMIN_CONFIRMATION'],
  'WAITING_FOR_ADMIN_CONFIRMATION': ['APPROVED', 'REJECTED'],
  'APPROVED': [],
  'REJECTED': [],
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
```

**File 3:** Update `api/payments/[id]/submit.ts`

Copy from: `API_ENDPOINTS_FIXED.md` → Section "PAYMENT SUBMISSION ENDPOINT"

**What's new:**
- File validation (MIME type, size)
- Ownership check
- Status validation
- Upload to PRIVATE bucket
- Status transition validation

**File 4:** Create `api/admin/payments/[id]/approve.ts`

Copy from: `API_ENDPOINTS_FIXED.md` → Section "ADMIN APPROVAL ENDPOINT"

**What's new:**
- Calls `approve_payment_atomic()` SQL function
- Atomic transaction (payment + ticket + audit)
- Email sent AFTER approval
- Comprehensive logging

**File 5:** Create `api/admin/payments/[id]/reject.ts`

Copy from: `API_ENDPOINTS_FIXED.md` → Section "ADMIN REJECTION ENDPOINT"

**File 6:** Create `api/admin/payments/[id]/screenshot-url.ts`

Copy from: `API_ENDPOINTS_FIXED.md` → Section "ADMIN-ONLY SCREENSHOT URL"

**File 7:** Create `api/admin/payments/[id]/user-phone.ts`

Copy from: `API_ENDPOINTS_FIXED.md` → Section "ADMIN-ONLY PHONE NUMBER"

### 2.3 Deploy to Vercel

```bash
git add .
git commit -m "Production security fixes: admin verification, screenshot privacy, status locking, atomic operations"
git push origin main
```

Vercel will auto-deploy → Watch build logs for errors

---

## STEP 3: FRONTEND UPDATES (20 minutes)

### 3.1 Update Payment Form

File: `src/components/PaymentForm.tsx`

**Remove:** Any direct Supabase Storage upload code

**Keep:** Form for transaction ID + screenshot upload

**Key changes:**
- Read file as base64
- Send to `/api/payments/:id/submit` endpoint
- Don't ask user for storage token
- Don't generate bucket URLs

**Example:**

```typescript
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
    
    const data = await response.json();
    if (data.success) {
      setStatus('WAITING_FOR_ADMIN_CONFIRMATION');
      alert('Proof submitted. Awaiting admin verification.');
    } else {
      alert(`Error: ${data.error}`);
    }
  };
  
  reader.readAsDataURL(fileInput.files[0]);
};
```

### 3.2 Update Admin Dashboard

File: `src/pages/Admin.tsx`

**Add new feature: View Screenshots**

```typescript
const viewScreenshot = async (paymentId: string) => {
  const response = await fetch(
    `/api/admin/payments/${paymentId}/screenshot-url`,
    {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    }
  );
  
  const data = await response.json();
  if (data.success) {
    // Open in new tab (link expires in 30 minutes)
    window.open(data.data.signedUrl, '_blank');
  } else {
    alert(`Error: ${data.error}`);
  }
};

const viewPhoneNumber = async (paymentId: string) => {
  const response = await fetch(
    `/api/admin/payments/${paymentId}/user-phone`,
    {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    }
  );
  
  const data = await response.json();
  if (data.success) {
    alert(`Phone: ${data.data.phone_number}`);
  } else {
    alert(`Error: ${data.error}`);
  }
};
```

### 3.3 Update Payment Status Display

File: `src/components/PaymentStatus.tsx`

**Status values:**
- `PENDING` → "Waiting for proof upload"
- `WAITING_FOR_ADMIN_CONFIRMATION` → "Admin reviewing..."
- `APPROVED` → "✅ Approved - Ticket ready"
- `REJECTED` → "❌ Rejected - See comments"

**Show admin comment if rejected**

---

## STEP 4: TESTING (30 minutes)

### 4.1 Admin Security Test

```
1. Login as regular user (not abdulsist23@gmail.com)
2. Try to access /api/admin/payments/[id]/approve
3. Should get 403 Forbidden
4. Try to use admin token with wrong email
5. Should get 403 Forbidden
✅ Test passes: Non-admin blocked
```

### 4.2 Payment Submission Test

```
1. Upload file > 5MB
2. Should error: "File size exceeds 5MB limit"
3. Upload .txt file
4. Should error: "Only PNG, JPEG allowed"
5. Upload valid PNG
6. Payment status should change to WAITING_FOR_ADMIN_CONFIRMATION
7. Try to upload again (should be blocked)
✅ Test passes: Validation works
```

### 4.3 Status Locking Test

```
1. Admin approves a payment
2. Try to update that payment
3. Should error: "Payment is locked"
4. Try to create another ticket for same team
5. Should error: UNIQUE constraint
✅ Test passes: Status locking works
```

### 4.4 Atomic Approval Test

```
1. Submit payment proof
2. Admin clicks approve
3. Check:
   - Payment status = APPROVED ✓
   - Ticket created ✓
   - Audit log entry exists ✓
   - User gets ticket code ✓
   - Email sent (or logged if failed) ✓
4. All must succeed together
✅ Test passes: Atomic operation works
```

### 4.5 Screenshot Privacy Test

```
1. User submits payment with screenshot
2. Check database: screenshot_file_path is stored (not URL)
3. Try to access screenshot directly: Should get 403 Forbidden
4. Admin gets signed URL: Should work
5. Wait 31 minutes: Signed URL expires
✅ Test passes: Screenshots are private
```

### 4.6 Phone Privacy Test

```
1. User queries their own team: Can see phone_number ✓
2. User queries another team: Cannot access ✓
3. Admin calls /api/admin/payments/[id]/user-phone: Can see ✓
4. Non-admin calls same endpoint: 403 Forbidden ✓
5. Check audit log: Phone access logged ✓
✅ Test passes: Phone privacy enforced
```

### 4.7 Status Transition Test

```
PENDING → WAITING: ✓ (user submit)
WAITING → APPROVED: ✓ (admin approve)
WAITING → REJECTED: ✓ (admin reject)
PENDING → APPROVED: ✗ (skip WAITING - blocked)
APPROVED → PENDING: ✗ (backwards - blocked)
REJECTED → APPROVED: ✗ (locked - blocked)
✅ All transitions enforce rules
```

---

## STEP 5: PRODUCTION LAUNCH (30 minutes)

### 5.1 Pre-Launch Checklist

```
Database:
  ☐ Schema deployed
  ☐ Triggers active (test with new user)
  ☐ RLS policies applied
  ☐ Storage bucket created (PRIVATE)
  ☐ Storage RLS policy applied

Backend:
  ☐ All 5 endpoints deployed
  ☐ auth.ts updated
  ☐ No build errors
  ☐ All secrets configured

Frontend:
  ☐ Payment form updated
  ☐ Admin dashboard updated
  ☐ No console errors
  ☐ No localStorage references

Testing:
  ☐ All 7 tests passing
  ☐ Admin cannot bypass security
  ☐ Status transitions enforced
  ☐ Screenshots private
  ☐ Phone private
  ☐ Atomic operations work
  ☐ Audit logging works
```

### 5.2 Launch Procedure

1. **Deploy database** ✓ (Supabase SQL)
2. **Deploy backend** ✓ (Vercel)
3. **Deploy frontend** ✓ (Vercel)
4. **Smoke tests:**
   - User registration works
   - Payment submission works
   - Admin approval works
   - Ticket generated
5. **Monitor for 24 hours:**
   - Check error logs
   - Check audit logs
   - Verify no payment issues

### 5.3 Monitoring

**First 24 hours:**
- Monitor `/api/admin/*` endpoints for 403 errors
- Monitor payment status changes
- Monitor audit_log for anomalies
- Check email delivery

**Daily for 2 weeks:**
- Review audit logs
- Look for failed admin attempts
- Check for invalid transitions
- Verify email sending

---

## ROLLBACK PLAN

If issues occur:

**Database:** 
- Backup table: `SELECT * INTO payments_backup FROM payments;`
- Restore: `TRUNCATE payments; INSERT INTO payments SELECT * FROM payments_backup;`

**Backend:**
- Revert commit: `git revert <commit-hash>`
- Push to Vercel: Auto-deploys

**Frontend:**
- Revert to previous version
- Clear cache

---

## POST-LAUNCH TASKS

```
Week 1:
  ☐ Review audit logs daily
  ☐ Monitor admin access patterns
  ☐ Test edge cases
  ☐ Verify email delivery rate

Week 2-4:
  ☐ Continue audit log review
  ☐ Set up automated alerts
  ☐ Document any issues found
  ☐ Prepare user documentation

Month 2+:
  ☐ Rotate admin credentials (if applicable)
  ☐ Review RLS policies effectiveness
  ☐ Plan security improvements
  ☐ Schedule security audit
```

---

## TROUBLESHOOTING

**Issue:** Admin can't approve payments
- Check: is_admin claim in Supabase Auth metadata
- Check: Email matches exactly: abdulsist23@gmail.com
- Check: RLS policies applied to payments table

**Issue:** Screenshots not uploading
- Check: Storage bucket exists and is PRIVATE
- Check: File size < 5MB
- Check: MIME type is PNG or JPEG

**Issue:** Atomic approval fails
- Check: SQL function exists (approve_payment_atomic)
- Check: Payment status is WAITING_FOR_ADMIN_CONFIRMATION
- Check: No existing ticket for team

**Issue:** Status transitions not enforced
- Check: SQL trigger active (validate_payment_transition)
- Check: Backend validation function called
- Check: Check constraint applied to status column

---

## COMPLETION CHECKLIST

Once all steps complete, mark:

```
☐ Database deployed
☐ Backend deployed
☐ Frontend updated
☐ All 7 tests passing
☐ Admin security verified
☐ Screenshots private
☐ Status locking verified
☐ Atomic operations verified
☐ Phone privacy verified
☐ Status transitions verified
☐ Audit logging verified
☐ Production launched
☐ Monitoring active
☐ Documentation updated
☐ Backup created
```

---

## SUPPORT CONTACTS

- **Database issues:** Supabase docs → https://supabase.com/docs
- **API issues:** Vercel logs → https://vercel.com/dashboard
- **RLS help:** Supabase guide → https://supabase.com/docs/guides/auth/row-level-security
- **Storage:** Supabase docs → https://supabase.com/docs/guides/storage

---

**Estimated total time: 2-3 hours**

**Risk level after deployment: 🟢 LOW**

**Production ready: ✅ YES**

