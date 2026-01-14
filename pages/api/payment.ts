import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay with LIVE credentials
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export default async function handler(req: any, res: any) {
  if (req.method === 'POST') {
    const { action } = req.body;

    // CREATE ORDER
    if (action === 'create-order') {
      const { amount, teamId, eventName } = req.body;

      try {
        const order = await razorpay.orders.create({
          amount: amount * 100, // Convert to paise
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
          .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
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
          return res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            amount: payment.amount / 100, // Convert back to rupees
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
