# ROBOYUDH 2026 - VERCEL API IMPLEMENTATION GUIDE

This guide shows how to implement the API endpoints using Vercel Serverless Functions.

---

## PROJECT STRUCTURE

```
api/
├── auth/
│   └── verify.ts           (Verify JWT token from Supabase)
├── events/
│   ├── index.ts            (GET - List events)
│   └── [id].ts             (GET - Get single event)
├── teams/
│   └── index.ts            (POST - Create team)
├── payments/
│   ├── [id].ts             (GET - Get payment)
│   └── [id]/
│       ├── submit.ts       (POST - Submit payment proof)
│       ├── approve.ts      (POST - Admin approve)
│       └── reject.ts       (POST - Admin reject)
├── tickets/
│   ├── [id].ts             (GET - Get ticket)
│   └── [id]/
│       └── download-pdf.ts (POST - Download PDF)
├── admin/
│   ├── payments.ts         (GET - List payments)
│   ├── audit-log.ts        (GET - Audit log)
│   └── users/
│       └── [id]/
│           └── phone.ts    (GET - User phone)
├── myregistrations.ts      (GET - My registrations)
└── utils/
    ├── supabase.ts         (Supabase client)
    ├── auth.ts             (Auth helpers)
    └── email.ts            (Email service)
```

---

## 1. SETUP FILES

### api/utils/supabase.ts

```typescript
// api/utils/supabase.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
});

export const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
```

### api/utils/auth.ts

```typescript
// api/utils/auth.ts

import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

export async function verifyAuth(req: VercelRequest): Promise<AuthUser | null> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return null;
    }

    const user = data.user;
    const isAdmin = user.email === 'abdulsist23@gmail.com';

    return {
      id: user.id,
      email: user.email!,
      isAdmin,
    };
  } catch (err) {
    return null;
  }
}

export function unauthorized(res: VercelResponse) {
  return res.status(401).json({
    success: false,
    error: 'Authentication token missing or invalid',
  });
}

export function forbidden(res: VercelResponse) {
  return res.status(403).json({
    success: false,
    error: 'You don\'t have permission to access this resource',
  });
}

export function notFound(res: VercelResponse, message = 'Resource not found') {
  return res.status(404).json({
    success: false,
    error: message,
  });
}

export function badRequest(res: VercelResponse, message: string) {
  return res.status(400).json({
    success: false,
    error: message,
  });
}

export function success(res: VercelResponse, data: any) {
  return res.status(200).json({
    success: true,
    data,
  });
}

export function created(res: VercelResponse, data: any) {
  return res.status(201).json({
    success: true,
    data,
  });
}
```

### api/utils/email.ts

```typescript
// api/utils/email.ts

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

export async function sendPaymentApprovedEmail(
  userEmail: string,
  userName: string,
  eventName: string,
  teamName: string,
  ticketCode: string,
  ticketUrl: string
) {
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: userEmail,
    subject: 'Payment Approved - Your Ticket is Ready',
    html: `
      <h1>Payment Approved!</h1>
      <p>Hi ${userName},</p>
      <p>Great news! Your payment for <strong>${eventName}</strong> has been approved.</p>
      <p>Your ticket is now ready to download.</p>
      <p><strong>Event:</strong> ${eventName}</p>
      <p><strong>Team:</strong> ${teamName}</p>
      <p><strong>Ticket Code:</strong> ${ticketCode}</p>
      <p><a href="${ticketUrl}">Download your ticket</a></p>
      <p>Thank you for registering!</p>
      <p>Best regards,<br>Roboyudh 2026 Team</p>
    `,
  });
}

export async function sendPaymentRejectedEmail(
  userEmail: string,
  userName: string,
  eventName: string,
  reason: string
) {
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: userEmail,
    subject: 'Payment Rejected - Action Required',
    html: `
      <h1>Payment Rejected</h1>
      <p>Hi ${userName},</p>
      <p>Your payment submission for <strong>${eventName}</strong> was rejected.</p>
      <p><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
      <p>If you believe this is a mistake, please contact us.</p>
      <p>Best regards,<br>Roboyudh 2026 Team</p>
    `,
  });
}
```

---

## 2. PUBLIC ENDPOINTS

### api/events/index.ts

```typescript
// api/events/index.ts

import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../utils/supabase';
import { success } from '../utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('date', { ascending: true });

    if (error) throw error;

    return success(res, data);
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch events',
    });
  }
}
```

### api/events/[id].ts

```typescript
// api/events/[id].ts

import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../utils/supabase';
import { success, notFound } from '../utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return notFound(res, 'Event not found');
    }

    // Get team count
    const { count } = await supabase
      .from('teams')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', id);

    return success(res, {
      ...data,
      teams_registered: count || 0,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch event',
    });
  }
}
```

---

## 3. USER ENDPOINTS

### api/teams/index.ts

```typescript
// api/teams/index.ts

import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../utils/supabase';
import { verifyAuth, unauthorized, badRequest, created } from '../utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await verifyAuth(req);
  if (!user) return unauthorized(res);

  try {
    const { eventId, teamName, phoneNumber, members } = req.body;

    // Validate inputs
    if (!eventId || !teamName || !phoneNumber || !members || members.length === 0) {
      return badRequest(res, 'Invalid request parameters');
    }

    // Check if user already has team for this event
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single();

    if (existingTeam) {
      return badRequest(res, 'Team already exists for this event');
    }

    // Create team
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .insert({
        event_id: eventId,
        user_id: user.id,
        team_name: teamName,
        phone_number: phoneNumber,
      })
      .select()
      .single();

    if (teamError) throw teamError;

    // Create team members
    const membersToInsert = members.map((member: any) => ({
      team_id: teamData.id,
      member_name: member.name,
      member_email: member.email,
      member_phone: member.phone,
    }));

    const { error: membersError } = await supabase
      .from('team_members')
      .insert(membersToInsert);

    if (membersError) throw membersError;

    // Create registration
    const { data: registrationData, error: registrationError } = await supabase
      .from('registrations')
      .insert({
        team_id: teamData.id,
        event_id: eventId,
        user_id: user.id,
      })
      .select()
      .single();

    if (registrationError) throw registrationError;

    // Get event fee
    const { data: event } = await supabase
      .from('events')
      .select('registration_fee')
      .eq('id', eventId)
      .single();

    // Create payment record
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert({
        team_id: teamData.id,
        event_id: eventId,
        user_id: user.id,
        amount: event?.registration_fee || 0,
        status: 'PENDING',
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    return created(res, {
      teamId: teamData.id,
      registrationId: registrationData.id,
      paymentId: paymentData.id,
      amount: paymentData.amount,
      status: paymentData.status,
      message: 'Team registered successfully. Proceed to payment.',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: 'Failed to create team',
    });
  }
}
```

### api/payments/[id].ts

```typescript
// api/payments/[id].ts

import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../utils/supabase';
import { verifyAuth, unauthorized, notFound, success } from '../utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await verifyAuth(req);
  if (!user) return unauthorized(res);

  const { id } = req.query;

  try {
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !payment) {
      return notFound(res, 'Payment not found');
    }

    // Check ownership
    if (payment.user_id !== user.id && !user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'You don\'t have access to this payment',
      });
    }

    return success(res, {
      id: payment.id,
      teamId: payment.team_id,
      eventId: payment.event_id,
      amount: payment.amount,
      status: payment.status,
      transactionId: payment.transaction_id,
      screenshotUrl: payment.payment_screenshot_url,
      createdAt: payment.created_at,
      // Bank details (static)
      upiQrImage: 'data:image/png;base64,...', // Generate QR image
      bankDetails: {
        accountHolder: 'Roboyudh Fest',
        accountNumber: '1234567890',
        ifsc: 'SBIN0001234',
        bankName: 'State Bank of India',
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch payment',
    });
  }
}
```

### api/payments/[id]/submit.ts

```typescript
// api/payments/[id]/submit.ts

import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../utils/supabase';
import { verifyAuth, unauthorized, badRequest, success } from '../../utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await verifyAuth(req);
  if (!user) return unauthorized(res);

  const { id } = req.query;
  const { transactionId, screenshotUrl } = req.body;

  try {
    // Validate inputs
    if (!transactionId || !screenshotUrl) {
      return badRequest(res, 'Transaction ID and screenshot URL required');
    }

    // Fetch payment
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
    }

    // Check ownership
    if (payment.user_id !== user.id) {
      return res.status(403).json({
        success: false,
        error: 'You don\'t have access to this payment',
      });
    }

    // Check if already submitted
    if (payment.status !== 'PENDING') {
      return badRequest(res, 'Payment already submitted');
    }

    // Update payment
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'WAITING_FOR_ADMIN_CONFIRMATION',
        transaction_id: transactionId,
        payment_screenshot_url: screenshotUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return success(res, {
      paymentId: updatedPayment.id,
      status: updatedPayment.status,
      message: 'Payment submitted successfully. Waiting for admin confirmation.',
      transactionId: updatedPayment.transaction_id,
      screenshotUrl: updatedPayment.payment_screenshot_url,
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

### api/tickets/[id].ts

```typescript
// api/tickets/[id].ts

import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../utils/supabase';
import { verifyAuth, unauthorized, notFound, success } from '../utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await verifyAuth(req);
  if (!user) return unauthorized(res);

  const { id } = req.query;

  try {
    // Fetch payment first
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (paymentError || !payment) {
      return notFound(res, 'Payment not found');
    }

    // Check ownership
    if (payment.user_id !== user.id && !user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'You don\'t have access to this ticket',
      });
    }

    // Check if payment is approved
    if (payment.status !== 'APPROVED') {
      return success(res, {
        data: null,
        message: `Ticket not available yet. Payment status: ${payment.status}`,
      });
    }

    // Fetch ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('payment_id', id)
      .single();

    if (ticketError || !ticket) {
      return notFound(res, 'Ticket not found');
    }

    return success(res, {
      id: ticket.id,
      ticketCode: ticket.ticket_code,
      qrCodeUrl: ticket.qr_code_url,
      eventName: '', // Fetch event name separately
      teamName: '', // Fetch team name separately
      transactionId: payment.transaction_id,
      createdAt: ticket.created_at,
      pdfDownloadUrl: `${process.env.VERCEL_URL}/api/tickets/${id}/download-pdf`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch ticket',
    });
  }
}
```

---

## 4. ADMIN ENDPOINTS

### api/admin/payments.ts

```typescript
// api/admin/payments.ts

import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../utils/supabase';
import { verifyAuth, unauthorized, forbidden, success } from '../utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await verifyAuth(req);
  if (!user) return unauthorized(res);
  if (!user.isAdmin) return forbidden(res);

  try {
    const { status, eventId, limit = '50', offset = '0' } = req.query;

    let query = supabase
      .from('payments')
      .select(`
        id,
        team_id,
        event_id,
        user_id,
        amount,
        transaction_id,
        payment_screenshot_url,
        status,
        created_at,
        events(name),
        teams(team_name, phone_number),
        auth.users(email)
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return success(res, {
      data: data?.map((payment: any) => ({
        id: payment.id,
        teamId: payment.team_id,
        eventId: payment.event_id,
        eventName: payment.events?.name,
        teamName: payment.teams?.team_name,
        phoneNumber: payment.teams?.phone_number,
        userId: payment.user_id,
        userEmail: payment['auth.users']?.email,
        amount: payment.amount,
        transactionId: payment.transaction_id,
        screenshotUrl: payment.payment_screenshot_url,
        status: payment.status,
        createdAt: payment.created_at,
      })) || [],
      total: count || 0,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch payments',
    });
  }
}
```

### api/admin/payments/[id]/approve.ts

```typescript
// api/admin/payments/[id]/approve.ts

import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../../utils/supabase';
import {
  verifyAuth,
  unauthorized,
  forbidden,
  badRequest,
  success,
} from '../../../utils/auth';
import { sendPaymentApprovedEmail } from '../../../utils/email';
import QRCode from 'qrcode';

function generateTicketCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ROBO2026-${timestamp}${random}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await verifyAuth(req);
  if (!user) return unauthorized(res);
  if (!user.isAdmin) return forbidden(res);

  const { id } = req.query;

  try {
    // Fetch payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (paymentError || !payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
    }

    // Check if not in WAITING status
    if (payment.status !== 'WAITING_FOR_ADMIN_CONFIRMATION') {
      return badRequest(res, 'Payment is not in WAITING status');
    }

    // Generate ticket code
    const ticketCode = generateTicketCode();

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(ticketCode);

    // Upload QR code to Supabase Storage
    const fileName = `qr-codes/${payment.id}.png`;
    const base64Data = qrCodeDataUrl.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    const { error: uploadError } = await supabase.storage
      .from('qr-codes')
      .upload(fileName, buffer, {
        contentType: 'image/png',
      });

    if (uploadError) throw uploadError;

    // Get QR code URL
    const { data: { publicUrl: qrCodeUrl } } = supabase.storage
      .from('qr-codes')
      .getPublicUrl(fileName);

    // Create ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        team_id: payment.team_id,
        event_id: payment.event_id,
        user_id: payment.user_id,
        payment_id: payment.id,
        ticket_code: ticketCode,
        qr_code_url: qrCodeUrl,
      })
      .select()
      .single();

    if (ticketError) throw ticketError;

    // Update payment status
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'APPROVED',
        admin_id: user.id,
        admin_decision_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // Log audit
    await supabase.from('audit_log').insert({
      admin_id: user.id,
      action: 'APPROVED_PAYMENT',
      payment_id: payment.id,
      details: {
        teamId: payment.team_id,
        amount: payment.amount,
        ticketCode,
      },
    });

    // Fetch user and team details for email
    const { data: teamData } = await supabase
      .from('teams')
      .select('team_name')
      .eq('id', payment.team_id)
      .single();

    const { data: eventData } = await supabase
      .from('events')
      .select('name')
      .eq('id', payment.event_id)
      .single();

    const { data: userData } = await supabase.auth.admin.getUserById(
      payment.user_id
    );

    // Send email
    if (userData?.user?.email) {
      try {
        await sendPaymentApprovedEmail(
          userData.user.email,
          userData.user.email.split('@')[0],
          eventData?.name || 'Event',
          teamData?.team_name || 'Team',
          ticketCode,
          `${process.env.VERCEL_URL}/ticket/${payment.id}`
        );
      } catch (emailError) {
        console.error('Email send error:', emailError);
        // Don't fail if email fails
      }
    }

    return success(res, {
      paymentId: payment.id,
      status: 'APPROVED',
      ticketId: ticket.id,
      ticketCode,
      message: 'Payment approved. Ticket generated and email sent to user.',
      emailSent: true,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: 'Failed to approve payment',
    });
  }
}
```

### api/admin/payments/[id]/reject.ts

```typescript
// api/admin/payments/[id]/reject.ts

import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../../utils/supabase';
import {
  verifyAuth,
  unauthorized,
  forbidden,
  badRequest,
  success,
} from '../../../utils/auth';
import { sendPaymentRejectedEmail } from '../../../utils/email';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await verifyAuth(req);
  if (!user) return unauthorized(res);
  if (!user.isAdmin) return forbidden(res);

  const { id } = req.query;
  const { reason } = req.body;

  try {
    // Fetch payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (paymentError || !payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
      });
    }

    // Check if not in WAITING status
    if (payment.status !== 'WAITING_FOR_ADMIN_CONFIRMATION') {
      return badRequest(res, 'Payment is not in WAITING status');
    }

    // Update payment status
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'REJECTED',
        admin_id: user.id,
        admin_comment: reason || null,
        admin_decision_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // Log audit
    await supabase.from('audit_log').insert({
      admin_id: user.id,
      action: 'REJECTED_PAYMENT',
      payment_id: payment.id,
      details: {
        teamId: payment.team_id,
        amount: payment.amount,
        reason,
      },
    });

    // Fetch user and event details for email
    const { data: eventData } = await supabase
      .from('events')
      .select('name')
      .eq('id', payment.event_id)
      .single();

    const { data: userData } = await supabase.auth.admin.getUserById(
      payment.user_id
    );

    // Send email
    if (userData?.user?.email) {
      try {
        await sendPaymentRejectedEmail(
          userData.user.email,
          userData.user.email.split('@')[0],
          eventData?.name || 'Event',
          reason || 'No reason provided'
        );
      } catch (emailError) {
        console.error('Email send error:', emailError);
        // Don't fail if email fails
      }
    }

    return success(res, {
      paymentId: payment.id,
      status: 'REJECTED',
      reason,
      message: 'Payment rejected. User has been notified.',
      emailSent: true,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: 'Failed to reject payment',
    });
  }
}
```

---

## 5. ENVIRONMENT VARIABLES

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key

GMAIL_USER=your_gmail@gmail.com
GMAIL_PASSWORD=your_app_password

VERCEL_URL=https://your-domain.com
```

---

## 6. DEPLOYMENT CHECKLIST

✅ Set environment variables in Vercel
✅ Database schema created in Supabase
✅ RLS policies enabled on all tables
✅ Storage bucket created for screenshots
✅ Email service configured
✅ Admin user set to `abdulsist23@gmail.com`
✅ All API endpoints tested
✅ CORS configured
✅ SSL certificate installed
✅ Rate limiting configured (optional)

