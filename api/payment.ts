import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  try {
    // STEP 1: Validate environment variables
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;

    console.log('🔍 ENV CHECK:', {
      hasUrl: !!SUPABASE_URL,
      hasRole: !!SERVICE_ROLE_KEY,
      hasSecret: !!RAZORPAY_KEY_SECRET,
      hasId: !!RAZORPAY_KEY_ID,
    });

    if (!SUPABASE_URL) {
      return res.status(500).json({
        success: false,
        error: 'SUPABASE_URL not configured',
      });
    }

    if (!SERVICE_ROLE_KEY) {
      return res.status(500).json({
        success: false,
        error: 'SUPABASE_SERVICE_ROLE_KEY not configured',
      });
    }

    if (!RAZORPAY_KEY_SECRET || !RAZORPAY_KEY_ID) {
      return res.status(500).json({
        success: false,
        error: 'Razorpay credentials not configured',
      });
    }

    // STEP 2: Initialize clients
    const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });

    // STEP 3: Handle requests
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
      });
    }

    const { action } = req.body;

    // CREATE ORDER
    if (action === 'create-order') {
      const { teamId, eventName } = req.body;

      console.log('📝 Creating order for team:', teamId);

      try {
        const { data: team, error: teamError } = await adminSupabase
          .from('teams')
          .select('team_size, events(price_per_head)')
          .eq('id', teamId)
          .single();

        if (teamError) {
          console.error('❌ Team fetch error:', teamError);
          return res.status(400).json({
            success: false,
            error: 'Team not found or database error',
          });
        }

        if (!team) {
          return res.status(400).json({
            success: false,
            error: 'Team not found',
          });
        }

        const pricePerHead = team.events?.price_per_head;
        const teamSize = team.team_size;

        if (!pricePerHead || !teamSize) {
          return res.status(400).json({
            success: false,
            error: 'Invalid team or event pricing data',
          });
        }

        const amountInPaise = Math.round(pricePerHead * teamSize * 100);

        console.log('💰 Order amount:', {
          pricePerHead,
          teamSize,
          total: pricePerHead * teamSize,
          paise: amountInPaise,
        });

        const order = await razorpay.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `team_${teamId}_${Date.now()}`,
          notes: {
            team_id: teamId,
            event_name: eventName,
          },
        });

        console.log('✅ Order created:', order.id);

        return res.status(200).json({
          success: true,
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
        });
      } catch (error) {
        console.error('❌ Order creation failed:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to create order. Please try again.',
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

      console.log('🔐 Verifying payment:', razorpay_payment_id);

      try {
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
          .createHmac('sha256', RAZORPAY_KEY_SECRET)
          .update(body)
          .digest('hex');

        if (expectedSignature !== razorpay_signature) {
          console.error('❌ Signature mismatch');
          return res.status(400).json({
            success: false,
            error: 'Invalid payment signature',
          });
        }

        console.log('✅ Signature verified');

        const payment = await razorpay.payments.fetch(razorpay_payment_id);

        console.log('📊 Payment status:', payment.status);

        if (payment.status !== 'captured') {
          return res.status(400).json({
            success: false,
            error: `Payment not captured. Status: ${payment.status}`,
          });
        }

        const { data: payments, error: payFetchError } = await adminSupabase
          .from('payments')
          .select('id')
          .eq('team_id', teamId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (payFetchError || !payments || payments.length === 0) {
          console.error('❌ Payment record fetch error:', payFetchError);
          return res.status(400).json({
            success: false,
            error: 'Payment record not found in database',
          });
        }

        const paymentIdDb = payments[0].id;

        const { error: payUpdateError, data: updatedPayment } = await adminSupabase
          .from('payments')
          .update({
            status: 'paid',
            payment_ref: razorpay_payment_id,
          })
          .eq('id', paymentIdDb)
          .select()
          .single();

        if (payUpdateError) {
          console.error('❌ Payment update error:', payUpdateError);
          return res.status(500).json({
            success: false,
            error: 'Failed to update payment status',
          });
        }

        console.log('✅ Payment marked as paid');

        const { data: ticket, error: ticketError } = await adminSupabase
          .from('tickets')
          .upsert(
            { team_id: teamId },
            { onConflict: 'team_id' }
          )
          .select()
          .single();

        if (ticketError) {
          console.error('❌ Ticket creation error:', ticketError);
          return res.status(500).json({
            success: false,
            error: 'Failed to create ticket',
          });
        }

        console.log('✅ Ticket created:', ticket.ticket_code);

        return res.status(200).json({
          success: true,
          message: 'Payment verified successfully',
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          amount: payment.amount / 100,
          payment: updatedPayment,
          ticket,
        });
      } catch (error) {
        console.error('❌ Payment verification failed:', error);
        return res.status(500).json({
          success: false,
          error: 'Payment verification failed. Please contact support.',
        });
      }
    }

    return res.status(400).json({
      success: false,
      error: 'Invalid action',
    });
  } catch (error) {
    console.error('❌ FATAL ERROR:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
