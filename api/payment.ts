import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { action, teamId, eventName, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Validate env
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !RAZORPAY_KEY_SECRET || !RAZORPAY_KEY_ID) {
      return res.status(500).json({ success: false, error: 'Server misconfigured' });
    }

    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // CREATE ORDER
    if (action === 'create-order') {
      try {
        const { data: team, error } = await adminSupabase
          .from('teams')
          .select('team_size,events(price_per_head)')
          .eq('id', teamId)
          .single();

        if (error || !team) {
          return res.status(400).json({ success: false, error: 'Team not found' });
        }

        const amount = Math.round(team.events.price_per_head * team.team_size * 100);

        const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
        const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            amount, 
            currency: 'INR', 
            receipt: `team_${teamId}_${Date.now()}`, 
            notes: { team_id: teamId, event_name: eventName } 
          }),
        });

        const orderData = await orderRes.json();
        if (!orderRes.ok) {
          return res.status(500).json({ success: false, error: 'Razorpay error' });
        }

        return res.status(200).json({ 
          success: true, 
          orderId: orderData.id, 
          amount: orderData.amount, 
          currency: orderData.currency 
        });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }

    // VERIFY PAYMENT
    if (action === 'verify-payment') {
      try {
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSig = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET).update(body).digest('hex');

        if (expectedSig !== razorpay_signature) {
          return res.status(400).json({ success: false, error: 'Invalid signature' });
        }

        // Fetch payment to verify
        const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
        const payRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
          method: 'GET',
          headers: { 'Authorization': `Basic ${auth}` },
        });

        const payment = await payRes.json();
        if (!payRes.ok || payment.status !== 'captured') {
          return res.status(400).json({ success: false, error: 'Payment not captured' });
        }

        // Update payment in DB
        const { data: payments } = await adminSupabase
          .from('payments')
          .select('id')
          .eq('team_id', teamId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!payments?.length) {
          return res.status(400).json({ success: false, error: 'Payment record not found' });
        }

        await adminSupabase
          .from('payments')
          .update({ status: 'paid', payment_ref: razorpay_payment_id })
          .eq('id', payments[0].id);

        // Create ticket
        const ticketRes = await adminSupabase
          .from('tickets')
          .upsert({ team_id: teamId }, { onConflict: 'team_id' })
          .select()
          .single();

        if (ticketRes.error) {
          return res.status(500).json({ success: false, error: 'Ticket creation failed' });
        }

        return res.status(200).json({ 
          success: true, 
          message: 'Payment verified', 
          paymentId: razorpay_payment_id, 
          ticket: ticketRes.data 
        });
      } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
      }
    }

    return res.status(400).json({ success: false, error: 'Invalid action' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
