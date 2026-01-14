/**
 * Razorpay Payment Service
 * Handles secure communication with Razorpay
 * 
 * SECURITY NOTES:
 * - This file runs on the frontend and uses only the Razorpay Public Key
 * - Never expose your Razorpay Key Secret here
 * - All sensitive operations should happen on your backend
 */

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  created_at: number;
}

interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

/**
 * IMPORTANT: In production, this should be called from your backend
 * The backend would:
 * 1. Verify the request is legitimate
 * 2. Create the order on Razorpay using the Key Secret
 * 3. Return only the order ID (never expose the secret key)
 */
export async function createRazorpayOrder(
  amount: number,
  teamId: string,
  eventName: string
): Promise<RazorpayOrder> {
  try {
    // For now, we'll do this on the frontend with the public key
    // In production, move this to your backend API
    
    // This is a simulated response - in production, call your backend instead
    // Example: const response = await fetch('/api/payment/create-order', { ... })
    
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // SECURITY: Never send Key Secret from frontend
        // This should be on your backend with proper authentication
      },
      body: JSON.stringify({
        amount: amount * 100, // Razorpay expects paise
        currency: 'INR',
        receipt: `team_${teamId}`,
        notes: {
          team_id: teamId,
          event_name: eventName,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create Razorpay order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
}

/**
 * Verify payment signature
 * CRITICAL FOR SECURITY: Always verify signature on your backend
 * Never trust client-side verification alone
 */
export async function verifyPaymentSignature(
  paymentId: string,
  orderId: string,
  signature: string,
  teamId: string
): Promise<boolean> {
  try {
    // This should be called from your backend API
    // NEVER perform this verification on the frontend
    // Your backend should:
    // 1. Use crypto to verify the signature with your Key Secret
    // 2. Update the database only after successful verification
    
    const response = await fetch('/api/payment/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        razorpay_signature: signature,
        team_id: teamId,
      }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.verified === true;
  } catch (error) {
    console.error('Error verifying payment:', error);
    return false;
  }
}

/**
 * Load Razorpay script
 */
export async function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Open Razorpay Checkout
 */
export function openRazorpayCheckout(options: any): Promise<RazorpayPaymentResponse> {
  return new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error('Razorpay not loaded'));
      return;
    }

    const razorpay = new window.Razorpay({
      ...options,
      handler: function (response: RazorpayPaymentResponse) {
        resolve(response);
      },
      modal: {
        ondismiss: function () {
          reject(new Error('Payment cancelled by user'));
        },
      },
    });

    razorpay.on('payment.failed', function (response: any) {
      reject(new Error(response.error.description || 'Payment failed'));
    });

    razorpay.open();
  });
}
