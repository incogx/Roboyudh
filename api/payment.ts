import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  // Check environment variables at request time
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
  const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return res.status(500).json({
      success: false,
      error: 'Server misconfigured: missing Supabase credentials',
    });
  }

  if (!RAZORPAY_KEY_SECRET || !RAZORPAY_KEY_ID) {
    return res.status(500).json({
      success: false,
      error: 'Server misconfigured: missing Razorpay credentials',
    });
  }

  const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Initialize Razorpay with LIVE credentials
  const razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
  if (req.method === 'POST') {
    const { action } = req.body;

    // CREATE ORDER
    if (action === 'create-order') {
      const { teamId, eventName } = req.body;

      try {
        const { data: team, error: teamError } = await adminSupabase
          .from('teams')
          .select(`team_size, event_id, events ( price_per_head )`)
          .eq('id', teamId)
          .single();

        if (teamError || !team) {
          console.error('Team lookup error:', teamError);
          return res.status(400).json({ success: false, error: 'Invalid team' });
        }

        const pricePerHead = team.events?.price_per_head;
        const teamSize = team.team_size;
        if (typeof pricePerHead !== 'number' || typeof teamSize !== 'number') {
          return res.status(400).json({ success: false, error: 'Invalid pricing data' });
        }

        const amount = Math.round(pricePerHead * teamSize * 100); // paise

        const order = await razorpay.orders.create({
          amount,
          currency: 'INR',
          receipt: `team_${teamId}_${Date.now()}`,
          notes: {
            team_id: teamId,
            event_name: eventName,
          },
        });

        return res.status(200).json({
          success: true,
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
        });
      } catch (error) {
        console.error('Order creation error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to create order',
        });
      }
    }

    // VERIFY PAYMENT
    if (action === 'verify-payment') {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        teamId,
      } = req.body;

      try {
        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
          .createHmac('sha256', RAZORPAY_KEY_SECRET)
          .update(body)
          .digest('hex');

        if (expectedSignature !== razorpay_signature) {
          return res.status(400).json({
            success: false,
            error: 'Invalid payment signature',
          });
        }

        // Fetch payment details to confirm
        const payment = await razorpay.payments.fetch(razorpay_payment_id);

        if (payment.status === 'captured') {
          // Update latest payment row and create ticket atomically as much as possible client-side
          const { data: payments, error: payFetchError } = await adminSupabase
            .from('payments')
            .select('id')
            .eq('team_id', teamId)
            .order('created_at', { ascending: false })
            .limit(1);

          if (payFetchError || !payments || payments.length === 0) {
            console.error('Payment row fetch error:', payFetchError);
            return res.status(400).json({ success: false, error: 'No payment record found' });
          }

          const paymentIdDb = payments[0].id;

          const { error: payUpdateError, data: updatedPayment } = await adminSupabase
            .from('payments')
            .update({ status: 'paid', payment_ref: razorpay_payment_id })
            .eq('id', paymentIdDb)
            .select()
            .single();

          if (payUpdateError) {
            console.error('Payment update error:', payUpdateError);
            return res.status(500).json({ success: false, error: 'Failed to update payment status' });
          }

          const { data: ticket, error: ticketError } = await adminSupabase
            .from('tickets')
            .upsert({ team_id: teamId }, { onConflict: 'team_id' })
            .select()
            .single();

          if (ticketError) {
            console.error('Ticket upsert error:', ticketError);
            return res.status(500).json({ success: false, error: 'Failed to create ticket' });
          }

          return res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            amount: payment.amount / 100, // Convert back to rupees
            payment: updatedPayment,
            ticket,
          });
        } else {
          return res.status(400).json({
            success: false,
            error: 'Payment not captured',
          });
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to verify payment',
        });
      }
    }

    return res.status(400).json({
      success: false,
      error: 'Invalid action',
    });
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed',
  });
}
