import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

interface CreateOrderRequest {
  teamId: string;
}

interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  teamId: string;
}

// ============================================================================
// RAZORPAY HELPERS
// ============================================================================

/**
 * Creates a Razorpay order using their REST API
 * @param keyId - Razorpay Key ID
 * @param keySecret - Razorpay Key Secret
 * @param amount - Amount in paise (smallest currency unit)
 * @param receipt - Receipt identifier (max 40 characters)
 * @param notes - Additional metadata
 */
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
    console.error('❌ Razorpay order creation failed:', errorBody);
    throw new Error(`Razorpay API error: ${response.statusText} - ${errorBody}`);
  }

  return response.json();
}

/**
 * Fetches payment details from Razorpay
 * @param paymentId - Razorpay payment ID
 * @param keyId - Razorpay Key ID
 * @param keySecret - Razorpay Key Secret
 */
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
    const errorBody = await response.text();
    console.error('❌ Razorpay payment fetch failed:', errorBody);
    throw new Error(`Razorpay API error: ${response.statusText}`);
  }

  return response.json();
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default async function handler(req: any, res: any): Promise<void> {
  try {
    // ========================================================================
    // 1. VALIDATE ENVIRONMENT VARIABLES
    // ========================================================================
    
    // Support both VITE_ prefixed and non-prefixed env vars for flexibility
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;

    console.log('🔍 Payment API Request:', {
      hasSupabaseUrl: !!SUPABASE_URL,
      hasServiceRole: !!SUPABASE_SERVICE_ROLE_KEY,
      hasRazorpaySecret: !!RAZORPAY_KEY_SECRET,
      hasRazorpayId: !!RAZORPAY_KEY_ID,
      method: req.method,
      action: req.body?.action,
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

    // ========================================================================
    // 2. VALIDATE HTTP METHOD
    // ========================================================================
    
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
      });
    }

    // ========================================================================
    // 3. INITIALIZE SUPABASE CLIENT
    // ========================================================================
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { action } = req.body;

    // ========================================================================
    // 4. HANDLE CREATE-ORDER ACTION
    // ========================================================================
    
    if (action === 'create-order') {
      const { teamId } = req.body as CreateOrderRequest;

      if (!teamId) {
        return res.status(400).json({
          success: false,
          error: 'teamId is required',
        });
      }

      try {
        console.log('📋 Creating order for team:', teamId);
        
        // Step 1: Get team details
        const { data: team, error: teamError } = await supabase
          .from('teams')
          .select('team_size, event_id')
          .eq('id', teamId)
          .single();

        if (teamError || !team) {
          console.error('❌ Team not found:', teamError?.message);
          return res.status(400).json({
            success: false,
            error: 'Team not found',
          });
        }

        console.log('✅ Team found:', { teamSize: team.team_size, eventId: team.event_id });

        // Step 2: Get event pricing
        const { data: event, error: eventError } = await supabase
          .from('events')
          .select('price_per_head')
          .eq('id', team.event_id)
          .single();

        if (eventError || !event) {
          console.error('❌ Event not found:', eventError?.message);
          return res.status(400).json({
            success: false,
            error: 'Event not found',
          });
        }

        console.log('✅ Event found:', { pricePerHead: event.price_per_head });

        // Step 3: Calculate amount
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

        console.log('💰 Amount calculated:', { 
          pricePerHead, 
          teamSize, 
          totalInr: amountInPaise / 100,
          amountInPaise 
        });

        // Step 4: Create Razorpay order
        // Receipt must be max 40 chars - use last 8 chars of UUID + timestamp
        const shortReceipt = `T${teamId.slice(-8)}_${Date.now().toString().slice(-10)}`;
        
        const razorpayOrder = await createRazorpayOrder(
          RAZORPAY_KEY_ID,
          RAZORPAY_KEY_SECRET,
          amountInPaise,
          shortReceipt,
          { team_id: teamId }
        );

        console.log('✅ Razorpay order created:', razorpayOrder.id);

        // Step 5: Save payment record in database
        const { error: insertError } = await supabase
          .from('payments')
          .insert({
            team_id: teamId,
            razorpay_order_id: razorpayOrder.id,
            amount: amountInPaise,
            status: 'created',
          });

        if (insertError) {
          console.error('❌ Failed to save payment record:', insertError.message);
          return res.status(500).json({
            success: false,
            error: 'Failed to create payment record',
          });
        }

        console.log('✅ Payment record saved');

        // Step 6: Return order details to frontend
        return res.status(200).json({
          success: true,
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        });
        
      } catch (error: any) {
        console.error('❌ Create order error:', error.message);
        return res.status(500).json({
          success: false,
          error: error.message || 'Failed to create order',
        });
      }
    }

    // ========================================================================
    // 5. HANDLE VERIFY-PAYMENT ACTION
    // ========================================================================
    
    if (action === 'verify-payment') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, teamId } =
        req.body as VerifyPaymentRequest;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !teamId) {
        return res.status(400).json({
          success: false,
          error: 'Missing payment verification data',
        });
      }

      try {
        console.log('🔐 Verifying payment:', razorpay_payment_id);

        // Step 1: Verify signature
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

        // Step 2: Fetch payment status from Razorpay
        const razorpayPayment = await fetchRazorpayPayment(
          razorpay_payment_id,
          RAZORPAY_KEY_ID,
          RAZORPAY_KEY_SECRET
        );

        console.log('📊 Payment status:', razorpayPayment.status);

        if (razorpayPayment.status !== 'captured') {
          return res.status(400).json({
            success: false,
            error: `Payment status is ${razorpayPayment.status}`,
          });
        }

        // Step 3: Get payment record from database
        const { data: paymentRecord, error: fetchError } = await supabase
          .from('payments')
          .select('id, team_id')
          .eq('razorpay_order_id', razorpay_order_id)
          .single();

        if (fetchError || !paymentRecord) {
          console.error('❌ Payment record not found:', fetchError?.message);
          return res.status(400).json({
            success: false,
            error: 'Payment record not found',
          });
        }

        // Step 4: Update payment status
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: 'paid',
            payment_ref: razorpay_payment_id,
          })
          .eq('id', paymentRecord.id);

        if (updateError) {
          console.error('❌ Failed to update payment:', updateError.message);
          return res.status(500).json({
            success: false,
            error: 'Failed to update payment',
          });
        }

        console.log('✅ Payment marked as paid');

        // Step 5: Create ticket
        const { data: ticket, error: ticketError } = await supabase
          .from('tickets')
          .upsert(
            { team_id: paymentRecord.team_id },
            { onConflict: 'team_id' }
          )
          .select()
          .single();

        if (ticketError) {
          console.error('❌ Failed to create ticket:', ticketError.message);
          return res.status(500).json({
            success: false,
            error: 'Failed to create ticket',
          });
        }

        console.log('✅ Ticket created:', ticket.ticket_code);

        // Step 6: Return success response
        return res.status(200).json({
          success: true,
          ticketId: ticket.id,
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
        });
        
      } catch (error: any) {
        console.error('❌ Payment verification error:', error.message);
        return res.status(500).json({
          success: false,
          error: error.message || 'Payment verification failed',
        });
      }
    }

    // ========================================================================
    // 6. HANDLE INVALID ACTION
    // ========================================================================
    
    return res.status(400).json({
      success: false,
      error: 'Invalid action',
    });
    
  } catch (error: any) {
    console.error('❌ FATAL ERROR:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
