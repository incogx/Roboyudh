import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { action, teamId, eventName, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Validate env - Use VITE_ prefixed versions since they're set in Vercel
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
    const RAZORPAY_KEY_ID = process.env.VITE_RAZORPAY_KEY_ID;

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !RAZORPAY_KEY_SECRET || !RAZORPAY_KEY_ID) {
      console.log('[INIT] Missing env vars:', {
        SUPABASE_URL: !!SUPABASE_URL,
        SERVICE_ROLE_KEY: !!SERVICE_ROLE_KEY,
        RAZORPAY_KEY_SECRET: !!RAZORPAY_KEY_SECRET,
        RAZORPAY_KEY_ID: !!RAZORPAY_KEY_ID
      });
      return res.status(500).json({ success: false, error: 'Server misconfigured' });
    }

    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // CREATE ORDER
    if (action === 'create-order') {
      try {
        console.log('[CREATE ORDER] Starting...');
        
        const { data: team, error } = await adminSupabase
          .from('teams')
          .select('team_size,events(price_per_head)')
          .eq('id', teamId)
          .single();

        if (error || !team) {
          console.log('[CREATE ORDER] Team not found:', error);
          return res.status(400).json({ success: false, error: 'Team not found' });
        }

        const amount = Math.round(team.events.price_per_head * team.team_size * 100);
        console.log('[CREATE ORDER] Amount calculated:', amount);

        const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
        console.log('[CREATE ORDER] Auth header length:', auth.length);
        
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

        console.log('[CREATE ORDER] Razorpay response status:', orderRes.status);
        
        const contentType = orderRes.headers.get('content-type');
        console.log('[CREATE ORDER] Content-Type:', contentType);
        
        const responseText = await orderRes.text();
        console.log('[CREATE ORDER] Response text length:', responseText.length);
        
        if (!contentType?.includes('application/json')) {
          console.log('[CREATE ORDER] Non-JSON response:', responseText.substring(0, 100));
          return res.status(500).json({ success: false, error: 'Invalid response format from payment gateway' });
        }

        const orderData = JSON.parse(responseText);
        
        if (!orderRes.ok) {
          console.log('[CREATE ORDER] Razorpay error:', orderData);
          return res.status(500).json({ success: false, error: orderData.description || 'Razorpay error' });
        }

        console.log('[CREATE ORDER] Order created:', orderData.id);
        return res.status(200).json({ 
          success: true, 
          orderId: orderData.id, 
          amount: orderData.amount, 
          currency: orderData.currency 
        });
      } catch (err: any) {
        console.log('[CREATE ORDER] Exception:', err.message);
        return res.status(500).json({ success: false, error: `Exception: ${err.message}` });
      }
    }

    // VERIFY PAYMENT
    if (action === 'verify-payment') {
      try {
        console.log('[VERIFY] Starting verification...');
        
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSig = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET).update(body).digest('hex');

        if (expectedSig !== razorpay_signature) {
          console.log('[VERIFY] Signature mismatch');
          return res.status(400).json({ success: false, error: 'Invalid signature' });
        }

        console.log('[VERIFY] Signature valid, fetching payment details...');

        // Fetch payment to verify
        const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
        const payRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
          method: 'GET',
          headers: { 'Authorization': `Basic ${auth}` },
        });

        console.log('[VERIFY] Razorpay payment response status:', payRes.status);
        
        const paymentText = await payRes.text();
        const payment = JSON.parse(paymentText);
        
        if (!payRes.ok || payment.status !== 'captured') {
          console.log('[VERIFY] Payment not captured:', payment.status);
          return res.status(400).json({ success: false, error: 'Payment not captured' });
        }

        console.log('[VERIFY] Payment verified, updating database...');

        // Update payment in DB
        const { data: payments } = await adminSupabase
          .from('payments')
          .select('id')
          .eq('team_id', teamId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!payments?.length) {
          console.log('[VERIFY] Payment record not found');
          return res.status(400).json({ success: false, error: 'Payment record not found' });
        }

        await adminSupabase
          .from('payments')
          .update({ status: 'paid', payment_ref: razorpay_payment_id })
          .eq('id', payments[0].id);

        console.log('[VERIFY] Payment updated, creating ticket...');

        // Create ticket
        const ticketRes = await adminSupabase
          .from('tickets')
          .upsert({ team_id: teamId }, { onConflict: 'team_id' })
          .select()
          .single();

        if (ticketRes.error) {
          console.log('[VERIFY] Ticket creation error:', ticketRes.error);
          return res.status(500).json({ success: false, error: 'Ticket creation failed' });
        }

        console.log('[VERIFY] Success! Ticket created:', ticketRes.data.id);
        return res.status(200).json({ 
          success: true, 
          message: 'Payment verified', 
          paymentId: razorpay_payment_id, 
          ticket: ticketRes.data 
        });
      } catch (err: any) {
        console.log('[VERIFY] Exception:', err.message, err.stack);
        return res.status(500).json({ success: false, error: `Exception: ${err.message}` });
      }
    }

    return res.status(400).json({ success: false, error: 'Invalid action' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
