import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

interface CreateOrderRequest {
  teamId: string;
}

interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

async function createRazorpayOrder(
  keyId: string,
  keySecret: string,
  amount: number,
  receipt: string,
  notes: Record<string, string>
): Promise<any> {
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency: 'INR',
      receipt,
      notes,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Razorpay API Error Response:', errorBody);
    throw new Error(`Razorpay API error: ${response.statusText} - ${errorBody}`);
  }

  return response.json();
}

async function fetchRazorpayPayment(
  paymentId: string,
  keyId: string,
  keySecret: string
): Promise<any> {
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Razorpay API error: ${response.statusText}`);
  }

  return response.json();
}

export default async function handler(req: any, res: any): Promise<void> {
  try {
    // Try both with and without VITE_ prefix for compatibility
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;

    console.log('🔍 PAYMENT API ENV CHECK:', {
      hasSupabaseUrl: !!SUPABASE_URL,
      hasServiceRole: !!SUPABASE_SERVICE_ROLE_KEY,
      hasRazorpaySecret: !!RAZORPAY_KEY_SECRET,
      hasRazorpayId: !!RAZORPAY_KEY_ID,
      method: req.method,
      action: req.body?.action,
      teamId: req.body?.teamId,
    });

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Supabase credentials missing');
      return res.status(500).json({
        success: false,
        error: 'Supabase not configured',
      });
    }

    if (!RAZORPAY_KEY_SECRET || !RAZORPAY_KEY_ID) {
      console.error('❌ Razorpay credentials missing');
      return res.status(500).json({
        success: false,
        error: 'Razorpay not configured',
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { action } = req.body;

    if (action === 'create-order') {
      const { teamId } = req.body as CreateOrderRequest;

      if (!teamId) {
        return res.status(400).json({
          success: false,
          error: 'teamId is required',
        });
      }

      try {
        console.log('📋 Fetching team:', teamId);
        
        // First, get the team with event_id
        const { data: team, error: teamError } = await supabase
          .from('teams')
          .select('team_size, event_id')
          .eq('id', teamId)
          .single();

        if (teamError || !team) {
          console.error('❌ Team fetch error:', teamError?.message || 'No team found');
          return res.status(400).json({
            success: false,
            error: 'Team not found',
          });
        }

        console.log('✅ Team found:', { teamSize: team.team_size, eventId: team.event_id });

        // Then, get the event details
        const { data: event, error: eventError } = await supabase
          .from('events')
          .select('price_per_head')
          .eq('id', team.event_id)
          .single();

        if (eventError || !event) {
          console.error('❌ Event fetch error:', eventError?.message || 'No event found');
          return res.status(400).json({
            success: false,
            error: 'Event not found',
          });
        }

        console.log('✅ Event found:', { pricePerHead: event.price_per_head });

        const pricePerHead = event.price_per_head;
        const teamSize = team.team_size;

        if (!pricePerHead || !teamSize) {
          return res.status(400).json({
            success: false,
            error: 'Invalid team or pricing data',
          });
        }

        const amountInPaise = Math.round(pricePerHead * teamSize * 100);

        if (amountInPaise <= 0) {
          return res.status(400).json({
            success: false,
            error: 'Invalid amount',
          });
        }

        console.log('💰 Creating Razorpay order:', { amountInPaise });

        const razorpayOrder = await createRazorpayOrder(
          RAZORPAY_KEY_ID,
          RAZORPAY_KEY_SECRET,
          amountInPaise,
          `team_${teamId}_${Date.now()}`,
          { team_id: teamId }
        );

        console.log('✅ Razorpay order created:', razorpayOrder.id);

        const { error: insertError } = await supabase
          .from('payments')
          .insert({
            team_id: teamId,
            razorpay_order_id: razorpayOrder.id,
            amount: amountInPaise,
            status: 'created',
          });

        if (insertError) {
          return res.status(500).json({
            success: false,
            error: 'Failed to create payment record',
          });
        }

        return res.status(200).json({
          success: true,
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        });
      } catch (error: any) {
        console.error('❌ Create order error:', error.message, error.stack);
        return res.status(500).json({
          success: false,
          error: error.message || 'Failed to create order',
        });
      }
    }

    if (action === 'verify-payment') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        req.body as VerifyPaymentRequest;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          error: 'Missing payment verification data',
        });
      }

      try {
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

        const razorpayPayment = await fetchRazorpayPayment(
          razorpay_payment_id,
          RAZORPAY_KEY_ID,
          RAZORPAY_KEY_SECRET
        );

        if (razorpayPayment.status !== 'captured') {
          return res.status(400).json({
            success: false,
            error: `Payment status is ${razorpayPayment.status}`,
          });
        }

        const { data: paymentRecord, error: fetchError } = await supabase
          .from('payments')
          .select('id, team_id')
          .eq('razorpay_order_id', razorpay_order_id)
          .single();

        if (fetchError || !paymentRecord) {
          return res.status(400).json({
            success: false,
            error: 'Payment record not found',
          });
        }

        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: 'paid',
            payment_ref: razorpay_payment_id,
          })
          .eq('id', paymentRecord.id);

        if (updateError) {
          return res.status(500).json({
            success: false,
            error: 'Failed to update payment',
          });
        }

        const { data: ticket, error: ticketError } = await supabase
          .from('tickets')
          .upsert({ team_id: paymentRecord.team_id }, { onConflict: 'team_id' })
          .select()
          .single();

        if (ticketError) {
          return res.status(500).json({
            success: false,
            error: 'Failed to create ticket',
          });
        }

        return res.status(200).json({
          success: true,
          ticketId: ticket.id,
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
        });
      } catch (error: any) {
        return res.status(500).json({
          success: false,
          error: error.message || 'Payment verification failed',
        });
      }
    }

    return res.status(400).json({
      success: false,
      error: 'Invalid action',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}