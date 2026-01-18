# ROBOYUDH 2026 - API ENDPOINTS SPECIFICATION

**Framework:** Vercel Serverless Functions  
**Base URL:** `/api/`  
**Auth:** Supabase Auth (JWT in Authorization header)

---

## AUTHENTICATION PATTERN

All protected endpoints require:
```
Authorization: Bearer <supabase_jwt_token>
```

The token is obtained from `supabase.auth.getSession()` on the frontend.

---

## PUBLIC ENDPOINTS

### 1. GET /api/events
**Purpose:** Fetch all active events  
**Auth Required:** NO  
**Query Parameters:** None

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-event-1",
      "name": "Tech Fest 2026",
      "description": "Annual technology festival",
      "date": "2026-03-15",
      "location": "College Auditorium",
      "max_teams": 100,
      "registration_fee": 500.00,
      "is_active": true
    }
  ]
}
```

**Error (500):**
```json
{
  "success": false,
  "error": "Failed to fetch events"
}
```

---

### 2. GET /api/events/:eventId
**Purpose:** Get single event details  
**Auth Required:** NO  
**Path Parameters:**
- `eventId` (UUID) - Event ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-event-1",
    "name": "Tech Fest 2026",
    "description": "Annual technology festival",
    "date": "2026-03-15",
    "location": "College Auditorium",
    "max_teams": 100,
    "registration_fee": 500.00,
    "is_active": true,
    "teams_registered": 45
  }
}
```

**Error (404):**
```json
{
  "success": false,
  "error": "Event not found"
}
```

---

## PROTECTED ENDPOINTS (USER)

### 3. POST /api/teams
**Purpose:** Create team + registration + payment  
**Auth Required:** YES  
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "eventId": "uuid-event-1",
  "teamName": "Team Phoenix",
  "phoneNumber": "9876543210",
  "members": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210"
    },
    {
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "9876543211"
    }
  ]
}
```

**Validations:**
- teamName not empty and unique per user per event
- phoneNumber valid format (10-15 digits)
- At least 1 member
- Max 5 members per team

**Response (201):**
```json
{
  "success": true,
  "data": {
    "teamId": "uuid-team-1",
    "registrationId": "uuid-registration-1",
    "paymentId": "uuid-payment-1",
    "amount": 500.00,
    "status": "PENDING",
    "message": "Team registered successfully. Proceed to payment."
  }
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "Team already exists for this event"
}
```

**Error (403):**
```json
{
  "success": false,
  "error": "Not authenticated"
}
```

---

### 4. GET /api/teams/:teamId
**Purpose:** Get team details (only owner or admin)  
**Auth Required:** YES  
**Path Parameters:**
- `teamId` (UUID) - Team ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-team-1",
    "eventId": "uuid-event-1",
    "eventName": "Tech Fest 2026",
    "teamName": "Team Phoenix",
    "phoneNumber": "9876543210",
    "members": [
      {
        "id": "uuid-member-1",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "9876543210"
      }
    ],
    "createdAt": "2026-01-18T10:30:00Z"
  }
}
```

**Error (403):**
```json
{
  "success": false,
  "error": "You don't have access to this team"
}
```

---

### 5. GET /api/payments/:paymentId
**Purpose:** Get payment details (only owner or admin)  
**Auth Required:** YES  
**Path Parameters:**
- `paymentId` (UUID) - Payment ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-payment-1",
    "teamId": "uuid-team-1",
    "eventId": "uuid-event-1",
    "amount": 500.00,
    "status": "PENDING",
    "transactionId": null,
    "screenshotUrl": null,
    "createdAt": "2026-01-18T10:30:00Z",
    "upiQrImage": "data:image/png;base64,...",
    "bankDetails": {
      "accountHolder": "Roboyudh Fest",
      "accountNumber": "1234567890",
      "ifsc": "SBIN0001234",
      "bankName": "State Bank of India"
    }
  }
}
```

**Error (403):**
```json
{
  "success": false,
  "error": "You don't have access to this payment"
}
```

---

### 6. POST /api/payments/:paymentId/submit
**Purpose:** Submit payment proof (screenshot + transaction ID)  
**Auth Required:** YES  
**Content-Type:** `multipart/form-data`

**Request Body:**
```
paymentId: uuid-payment-1 (path parameter)
transactionId: TXN12345 (form field)
screenshot: [file] (form file, max 5MB, type: image/*)
```

**Validations:**
- transactionId not empty (5-50 chars)
- screenshot file size < 5MB
- screenshot type is image
- Payment status is PENDING
- User owns the payment

**Response (200):**
```json
{
  "success": true,
  "data": {
    "paymentId": "uuid-payment-1",
    "status": "WAITING_FOR_ADMIN_CONFIRMATION",
    "message": "Payment submitted successfully. Waiting for admin confirmation.",
    "transactionId": "TXN12345",
    "screenshotUrl": "https://storage.url/payments/..."
  }
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "Invalid transaction ID or screenshot"
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "Payment already submitted"
}
```

---

### 7. GET /api/tickets/:paymentId
**Purpose:** Get ticket (only if payment APPROVED)  
**Auth Required:** YES  
**Path Parameters:**
- `paymentId` (UUID) - Payment ID

**Response (200) - Ticket Available:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-ticket-1",
    "ticketCode": "ROBO2026-20260118-ABC12XYZ9",
    "qrCodeUrl": "https://storage.url/qr-codes/...",
    "eventName": "Tech Fest 2026",
    "teamName": "Team Phoenix",
    "transactionId": "TXN12345",
    "createdAt": "2026-01-18T14:30:00Z",
    "pdfDownloadUrl": "https://api.url/tickets/uuid-ticket-1/download-pdf"
  }
}
```

**Response (200) - Ticket Not Available:**
```json
{
  "success": true,
  "data": null,
  "message": "Ticket not available yet. Payment status: WAITING_FOR_ADMIN_CONFIRMATION"
}
```

**Error (403):**
```json
{
  "success": false,
  "error": "You don't have access to this ticket"
}
```

---

### 8. POST /api/tickets/:paymentId/download-pdf
**Purpose:** Download ticket as PDF  
**Auth Required:** YES  
**Path Parameters:**
- `paymentId` (UUID) - Payment ID

**Response (200):**
Returns PDF file with:
- Ticket Code
- QR Code (embedded as image)
- Event Name
- Team Name
- Transaction ID
- Issued Date

**Error (403):**
```json
{
  "success": false,
  "error": "You don't have access to this ticket"
}
```

---

### 9. GET /api/myregistrations
**Purpose:** Get all user's registrations with payment status  
**Auth Required:** YES  
**Query Parameters:**
- `status` (optional): Filter by payment status (PENDING, WAITING_FOR_ADMIN_CONFIRMATION, APPROVED, REJECTED)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "registrationId": "uuid-registration-1",
      "eventId": "uuid-event-1",
      "eventName": "Tech Fest 2026",
      "teamId": "uuid-team-1",
      "teamName": "Team Phoenix",
      "paymentId": "uuid-payment-1",
      "paymentStatus": "WAITING_FOR_ADMIN_CONFIRMATION",
      "amount": 500.00,
      "ticketAvailable": false,
      "createdAt": "2026-01-18T10:30:00Z"
    }
  ]
}
```

---

## ADMIN ENDPOINTS

All admin endpoints require:
1. Valid JWT token
2. User email = `abdulsist23@gmail.com`
3. User is_admin = TRUE

---

### 10. GET /api/admin/payments
**Purpose:** List all payments (filter by status)  
**Auth Required:** YES (Admin only)  
**Query Parameters:**
- `status` (optional): PENDING, WAITING_FOR_ADMIN_CONFIRMATION, APPROVED, REJECTED
- `eventId` (optional): Filter by event
- `limit` (optional, default: 50): Number of records
- `offset` (optional, default: 0): Pagination

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-payment-1",
      "teamId": "uuid-team-1",
      "eventId": "uuid-event-1",
      "eventName": "Tech Fest 2026",
      "teamName": "Team Phoenix",
      "userId": "uuid-user-1",
      "userEmail": "user@example.com",
      "phoneNumber": "9876543210",
      "amount": 500.00,
      "transactionId": "TXN12345",
      "screenshotUrl": "https://storage.url/payments/...",
      "status": "WAITING_FOR_ADMIN_CONFIRMATION",
      "createdAt": "2026-01-18T10:30:00Z"
    }
  ],
  "total": 25,
  "limit": 50,
  "offset": 0
}
```

---

### 11. POST /api/admin/payments/:paymentId/approve
**Purpose:** Approve payment and generate ticket  
**Auth Required:** YES (Admin only)  
**Path Parameters:**
- `paymentId` (UUID) - Payment ID

**Request Body:**
```json
{
  "comment": "Payment verified. Approved."
}
```

**Side Effects:**
1. Update payment status to APPROVED
2. Set admin_id and admin_decision_at
3. Generate unique ticket_code
4. Generate QR code image
5. Create ticket record
6. Log audit entry
7. Send email to user with ticket link

**Response (200):**
```json
{
  "success": true,
  "data": {
    "paymentId": "uuid-payment-1",
    "status": "APPROVED",
    "ticketId": "uuid-ticket-1",
    "ticketCode": "ROBO2026-20260118-ABC12XYZ9",
    "message": "Payment approved. Ticket generated and email sent to user.",
    "emailSent": true
  }
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "Payment is not in WAITING status"
}
```

---

### 12. POST /api/admin/payments/:paymentId/reject
**Purpose:** Reject payment  
**Auth Required:** YES (Admin only)  
**Path Parameters:**
- `paymentId` (UUID) - Payment ID

**Request Body:**
```json
{
  "reason": "Screenshot not clear. Please re-submit."
}
```

**Side Effects:**
1. Update payment status to REJECTED
2. Set admin_id, admin_comment, and admin_decision_at
3. Log audit entry
4. Send email to user with rejection reason

**Response (200):**
```json
{
  "success": true,
  "data": {
    "paymentId": "uuid-payment-1",
    "status": "REJECTED",
    "reason": "Screenshot not clear. Please re-submit.",
    "message": "Payment rejected. User has been notified.",
    "emailSent": true
  }
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "Payment is not in WAITING status"
}
```

---

### 13. GET /api/admin/audit-log
**Purpose:** View all admin actions  
**Auth Required:** YES (Admin only)  
**Query Parameters:**
- `action` (optional): APPROVED_PAYMENT, REJECTED_PAYMENT
- `limit` (optional, default: 100)
- `offset` (optional, default: 0)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-log-1",
      "adminId": "uuid-admin",
      "adminEmail": "abdulsist23@gmail.com",
      "action": "APPROVED_PAYMENT",
      "paymentId": "uuid-payment-1",
      "details": {
        "teamName": "Team Phoenix",
        "eventName": "Tech Fest 2026",
        "amount": 500.00,
        "ticketCode": "ROBO2026-20260118-ABC12XYZ9"
      },
      "createdAt": "2026-01-18T14:30:00Z"
    }
  ]
}
```

---

### 14. GET /api/admin/users/:userId/phone
**Purpose:** Get user phone number (admin only)  
**Auth Required:** YES (Admin only)  
**Path Parameters:**
- `userId` (UUID) - User ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "uuid-user-1",
    "email": "user@example.com",
    "phoneNumber": "9876543210"
  }
}
```

---

## ERROR RESPONSES

### Common Error Codes

**400 - Bad Request**
```json
{
  "success": false,
  "error": "Invalid request parameters"
}
```

**401 - Unauthorized**
```json
{
  "success": false,
  "error": "Authentication token missing or invalid"
}
```

**403 - Forbidden**
```json
{
  "success": false,
  "error": "You don't have permission to access this resource"
}
```

**404 - Not Found**
```json
{
  "success": false,
  "error": "Resource not found"
}
```

**409 - Conflict**
```json
{
  "success": false,
  "error": "Resource already exists"
}
```

**413 - Payload Too Large**
```json
{
  "success": false,
  "error": "File size exceeds 5MB limit"
}
```

**500 - Internal Server Error**
```json
{
  "success": false,
  "error": "Internal server error. Please try again later."
}
```

---

## AUTHENTICATION FLOW

1. **Frontend Login:**
   ```typescript
   const { data, error } = await supabase.auth.signInWithPassword({
     email: userEmail,
     password: userPassword
   });
   
   const token = (await supabase.auth.getSession()).data.session.access_token;
   ```

2. **API Request:**
   ```typescript
   const response = await fetch('/api/teams', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({...})
   });
   ```

3. **Server Verification:**
   ```typescript
   // Extract token from Authorization header
   const token = req.headers.authorization?.split('Bearer ')[1];
   
   // Verify with Supabase
   const { data, error } = await supabase.auth.getUser(token);
   
   if (error) return res.status(401).json({ success: false, error });
   ```

---

## EMAIL TEMPLATES

### Template 1: Payment Approved
```
Subject: Payment Approved - Your Ticket is Ready

Body:
Hi [User Name],

Great news! Your payment for [Event Name] has been approved.

Your ticket is now ready to download.

Ticket Code: [TICKET_CODE]
Event: [EVENT_NAME]
Team: [TEAM_NAME]

Download your ticket: [TICKET_URL]

Thank you for registering!

Best regards,
Roboyudh 2026 Team
```

### Template 2: Payment Rejected
```
Subject: Payment Rejected - Action Required

Body:
Hi [User Name],

Your payment submission for [Event Name] was rejected.

Reason: [ADMIN_REASON]

If you believe this is a mistake, please contact us.

Best regards,
Roboyudh 2026 Team
```

---

## RATE LIMITING (Recommended)

- Per IP: 100 requests/minute
- Per user: 50 requests/minute
- Per admin: 200 requests/minute

---

## DEPLOYMENT NOTES

1. All endpoints should use HTTPS
2. CORS should be configured for frontend domain only
3. Sensitive data (phone, screenshots) should be encrypted
4. API keys should be stored as environment variables
5. Supabase RLS policies provide second layer of security
6. All admin actions are logged for audit trail

