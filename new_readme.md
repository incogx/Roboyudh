🚀 ROBOYUDH 2026 – Event Registration & Manual Payment System

A secure, login-only, admin-verified event registration platform designed for real-world college tech fests where manual payment confirmation is safer than automated gateways.

⚠️ Important:
This system intentionally does NOT use Razorpay or any auto-payment gateway.
All payments are manually verified by admin to avoid financial and technical risks.

🧠 SYSTEM PHILOSOPHY

Zero trust on frontend

Database is the single source of truth

Admin approval = final authority

No auto ticket generation

Reload-safe pages (no 404s)

Simple > Complex > Risky

🔐 AUTHENTICATION RULES

User must be logged in to:

Register for events

Access payment page

Upload payment proof

View ticket

If user is not logged in:
→ Redirect to /login

No anonymous registration

No guest payment

No bypass allowed

👤 USER FLOW (STRICT & FINAL)
1️⃣ Login

User logs in using Supabase Auth.

2️⃣ Select Event

User chooses an event from available events.

3️⃣ Register Team

User fills:

Team name

Team members

Contact phone number

System creates:

Team

Registration

Payment record (status = PENDING)

4️⃣ Payment Page (Manual)

User is redirected to /payment

User sees:

UPI QR / Bank details

User must:

Upload payment screenshot (mandatory)

Enter transaction ID (mandatory)

5️⃣ Submit Payment Proof

After submission:

Payment status → PENDING

Message shown:

“Payment submitted. Waiting for admin confirmation.”

🚫 No ticket generated yet

6️⃣ Wait for Admin

User cannot:

Re-upload payment

Modify transaction

Bypass admin decision

🧑‍💼 ADMIN FLOW (SINGLE ADMIN)
Admin Email
abdulsist23@gmail.com


Only this account has admin access.

Admin Dashboard Shows

Event name

Team name

User phone number 📞

Payment screenshot

Transaction ID

Amount

Payment status

Admin Actions
✅ APPROVE

Payment status → APPROVED

Ticket generated

QR code created

Ticket unlocked for user

Confirmation email sent

❌ REJECT

Payment status → REJECTED

No ticket generated

User cannot re-submit

Decision is final

🎟️ TICKET SYSTEM

Ticket is generated ONLY after admin approval.

Each ticket includes:

Ticket Code

QR Code

Event Name

Team Name

Transaction ID

Features:

PDF download

Reload-safe

One team → one ticket

One payment → one ticket

🗄️ DATABASE DESIGN (NEW & CLEAN)
Tables Used

users

events

teams

team_members

registrations

payments

tickets

Payment Status ENUM
PENDING
APPROVED
REJECTED


❌ No Razorpay fields
❌ No auto-verification
❌ No gateway callbacks

🔒 SECURITY GUARANTEES

Admin is the only authority to approve payment

Screenshot + transaction ID stored securely

Phone number visible only to admin

No frontend-based approval

No duplicate payments per team

No duplicate tickets

🔁 RELOAD SAFETY

All pages are server-state driven

Reloading:

/payment

/ticket

/admin
will NEVER cause:

404 errors

Lost data

Broken flow

🚫 WHAT THIS SYSTEM WILL NEVER USE

❌ Razorpay

❌ Auto capture

❌ Webhooks

❌ Signature verification

❌ Client-side payment trust

❌ Session-only logic

❌ Multiple admins

✅ WHY THIS SYSTEM IS SAFE

No dependency on payment gateways

No money auto-accepted

No race conditions

No replay attacks

No gateway downtime risk

Perfect for college events & offline verification

📦 TECH STACK

Frontend: React + Vite

Backend: Vercel Serverless

Database: Supabase (Postgres + RLS)

Auth: Supabase Auth

Storage: Supabase Storage

QR & PDF: Server-side generation

🏁 FINAL VERDICT

This system is:

✅ Safer than Razorpay for college events

✅ Admin-controlled

✅ Reload-safe

✅ Audit-friendly

✅ Production-ready