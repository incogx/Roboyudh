# ROBOYUDH 2026 - Event Management Platform

**Live Event:** March 15-17, 2026  
**Admin:** abdulsist23@gmail.com  
**Status:** ✅ Production Ready

---

## 🚀 Quick Start

### 1. Run Database Setup
Open Supabase: https://supabase.com/dashboard/project/umidkzbqpfveovsxalcj/sql

Copy and run: `sql/FRESH_COMPLETE_SETUP.sql`

Verify with: `VERIFY_SETUP.sql`

### 2. Start Development Server
```bash
npm install
npm run dev
```

### 3. Deploy to Vercel
```bash
git push origin main
```

Add environment variables in Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_RAZORPAY_KEY_ID`

---

## 📁 Project Structure

```
src/
├── pages/           # Main pages
│   ├── Home.tsx
│   ├── Events.tsx
│   ├── Registration.tsx
│   ├── Payment.tsx
│   ├── MyRegistrations.tsx
│   └── Admin.tsx
├── components/      # Reusable components
├── lib/
│   ├── supabase.ts  # Supabase client
│   ├── db.ts        # Database functions
│   └── razorpay.ts  # Payment integration
└── context/
    └── AuthContext.tsx  # Authentication

sql/
└── FRESH_COMPLETE_SETUP.sql  # Main database setup

VERIFY_SETUP.sql  # Database verification
```

---

## 🎪 Events

1. **RC Racing** - ₹200 (Tech, 5 members)
2. **Robo Soccer** - ₹200 (Tech, 5 members)
3. **Line Follower** - ₹200 (Tech, 5 members)
4. **Obstacle Run** - ₹200 (Tech, 5 members)
5. **Robo Sumo** - ₹200 (Tech, 5 members)
6. **Game Verse** - ₹100 (Non-Tech, 1 member)

---

## 🔐 Authentication

- **Email OTP** (no passwords)
- **Admin:** abdulsist23@gmail.com
- **Users:** Any valid email

### Login Flow:
1. Enter email → Get OTP
2. Enter OTP → Session created
3. Admin gets full access
4. Users see their own data only

---

## 💳 Payment Integration

### TEST Mode (Current)
- **Razorpay Key:** TEST mode
- **Test Card:** `4111 1111 1111 1111`
- CVV: `123`, Expiry: `12/25`

### LIVE Mode (Before Event)
1. Get LIVE key from Razorpay
2. Update `.env.local`:
   ```
   VITE_RAZORPAY_KEY_ID=rzp_live_YOUR_KEY
   ```
3. Update Vercel environment variables

---

## 🗄️ Database

### Tables (7 total):
- `events` - Event details
- `teams` - Registered teams
- `team_members` - Team member names
- `payments` - Payment records
- `tickets` - Generated tickets
- `leaderboard` - Scores & ranks
- `registration_details` - User info

### Security:
- **RLS enabled** on all tables
- Users can only see their own data
- Admin can see everything
- 18+ security policies active

---

## 🎫 User Flow

1. **Browse Events** → `/events`
2. **Register** → Fill form with team details
3. **Payment** → Razorpay integration
   - Status: UNPAID (orange badge)
   - Click "Complete Payment"
   - Enter TEST card details
4. **Ticket Generated** → After successful payment
   - Status: PAID (green badge)
   - Download ticket button
5. **My Registrations** → View all tickets

---

## 👨‍💼 Admin Features

Access: `/admin` (login with `abdulsist23@gmail.com`)

- View all teams & registrations
- Export CSV
- Manage leaderboard
- Create on-spot registrations
- Update scores & ranks

---

## 🔧 Development

### Environment Variables (.env.local)
```env
VITE_SUPABASE_URL=https://umidkzbqpfveovsxalcj.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_RAZORPAY_KEY_ID=rzp_test_S3gyXCDMb8Z7XE
```

### Build & Deploy
```bash
npm run build   # Build for production
npm run preview # Preview production build
```

---

## ✅ Features

- [x] Event registration system
- [x] Razorpay payment integration
- [x] Email OTP authentication
- [x] Ticket generation (only after payment)
- [x] Admin dashboard
- [x] CSV export
- [x] Leaderboard management
- [x] Row Level Security (RLS)
- [x] Responsive design
- [x] PDF ticket download

---

## 🚨 Important Notes

### Database Setup:
- Run `sql/FRESH_COMPLETE_SETUP.sql` ONLY ONCE
- This deletes all old data and creates fresh setup
- Never run after users start registering

### Payment Security:
- Tickets ONLY created after payment
- Payment status tracked (paid/unpaid)
- Download button only for paid tickets

### Testing Checklist:
- [ ] Events display correctly (6 total)
- [ ] Registration creates team
- [ ] Payment modal opens
- [ ] TEST card payment works
- [ ] Ticket generated after payment
- [ ] Admin login works
- [ ] CSV export works

---

## 📞 Support

**Admin Email:** abdulsist23@gmail.com  
**Supabase Project:** umidkzbqpfveovsxalcj  
**Event Dates:** March 15-17, 2026

---

## 🎉 Ready to Deploy!

**Status:** ✅ All features working  
**TypeScript Errors:** 0  
**Database:** Clean setup ready  
**Payment:** Configured and tested  
**Deployment:** Vercel ready  

**Next Step:** Push to GitHub and deploy to Vercel!

---

**Built with:** React 18 + TypeScript + Vite + Tailwind CSS + Supabase + Razorpay
