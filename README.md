🏆 ROBOYUDH 2026 – Event Registration System

Roboyudh 2026 is a college tech-fest event registration platform designed with secure login, team-based registration, and offline payment collection handled by admins on the event day.

This system intentionally does NOT use online payments, payment proof uploads, or QR payment flows to avoid payment failures, fraud, and operational complexity.

🚀 Key Principles (NON-NEGOTIABLE)

🔐 Login required for registration (no guest entries)

👥 Team-based registration

💰 NO online payment
❌ NO payment proof upload
❌ NO QR payment flows

🧾 Payment collected offline on event day

🧑‍💼 Admin-only payment approval

🎟️ Ticket generated ONLY after admin approval

❌ No Razorpay, No UPI QR, No screenshots, No transaction IDs, No payment uploads

🧭 User Flow (Student / Participant)
1️⃣ Login using OTP / Magic Link
2️⃣ Select an Event
3️⃣ Register Team
   - Team details
   - Team members
4️⃣ Registration completed
5️⃣ Payment status = PENDING
6️⃣ Message shown:
   "Please pay the registration fee at the event desk on the event day."
7️⃣ Ticket NOT generated yet

👉 The user does nothing online after registration. No payment upload, no verification UI, no online payment step.

🧑‍💼 Admin Flow (Event Organizer)
1️⃣ Admin logs in
2️⃣ Opens Admin Dashboard
3️⃣ Views all registrations
4️⃣ On event day:
   - Collects payment (cash / UPI)
   - Verifies team
5️⃣ Clicks "MARK AS PAID"
6️⃣ System actions:
   - payment.status → APPROVED
   - Ticket generated automatically
   - PDF created

🎟️ Ticket Rules

One ticket per team

Ticket generated only after admin marks payment as APPROVED

Ticket includes:

Event name

Team name

Unique ticket code



🗄️ Database Design Overview
Core Tables

events – Event details

teams – Team registration

team_members – Individual members

registrations – User ↔ Event mapping

payments – Offline payment tracking (status: PENDING/APPROVED/REJECTED)

tickets – Entry ticket (post payment)

audit_log – Admin action tracking

Payment Status Lifecycle
Status	Meaning
PENDING	Registered, payment not yet collected
APPROVED	Payment collected & verified by admin
REJECTED	Registration cancelled
🔒 Security Model

RLS (Row Level Security) enabled on all tables

Users can only access their own data

Admin access strictly email-based

No client-side payment manipulation

No financial trust on frontend

🛠️ Tech Stack

Frontend: React + TypeScript + Vite

Backend: Supabase (PostgreSQL + Auth + RLS)

Hosting: Vercel

Auth: OTP / Magic Link

Payments: Offline (Manual)

🧪 Environment Variables
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=


⚠️ No payment keys required.

🧹 What Is Intentionally NOT Included

❌ Online payment gateways

❌ QR payment flows


❌ Screenshot uploads
❌ Payment proof uploads

❌ Auto-verification

❌ QR payment flows

❌ Razorpay / Stripe / UPI logic

This is by design. All payment is offline, admin approval only. No payment upload, no verification UI, no QR, no online payment.

📌 Deployment Status

✅ Production-ready
✅ Safe to deploy
✅ Admin-controlled
✅ Event-day friendly

👤 Admin Account

Admin Email: abdulsist23@gmail.com

Admin rights are strictly enforced via database policies.

📣 Final Note

This system is built specifically for college tech fests where:

Payments are easier to collect offline

Admin verification is mandatory

Reliability matters more than automation

Simple. Secure. Scalable.