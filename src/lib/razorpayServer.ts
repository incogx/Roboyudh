/**
 * Razorpay Server-Side Utilities
 * CRITICAL: This file contains sensitive operations that MUST run only on backend
 * Never expose Key Secret to frontend
 */

import crypto from 'crypto';

/**
 * Create Razorpay Order ID - BACKEND ONLY
 * This should be called from your backend API endpoint, not from frontend
 * 
 * For frontend: Use API endpoint that calls this function
 */
export function createRazorpayOrder(_amount: number, _currency: string = 'INR') {
  // In production, this would call:
  // const Razorpay = require('razorpay');
  // const razorpay = new Razorpay({
  //   key_id: process.env.RAZORPAY_KEY_ID,
  //   key_secret: process.env.RAZORPAY_KEY_SECRET
  // });
  // const order = await razorpay.orders.create({
  //   amount: amount * 100,
  //   currency,
  //   receipt: `receipt_${Date.now()}`
  // });
  // return order.id;

  // For now, return a mock order ID
  return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Verify Razorpay Payment Signature - BACKEND ONLY
 * This MUST run on backend only to prevent spoofing
 * 
 * How it works:
 * 1. Frontend sends: razorpay_payment_id, razorpay_order_id, razorpay_signature
 * 2. Backend creates HMAC SHA256 using Key Secret: order_id|payment_id
 * 3. Backend compares generated signature with received signature
 * 4. If signatures match → payment is legitimate
 * 5. If signatures don't match → payment was spoofed/tampered
 */
export function verifyRazorpayPaymentSignature(
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string,
  keySecret: string
): boolean {
  // Create the expected signature
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex');

  // Compare signatures
  return expectedSignature === razorpay_signature;
}

/**
 * Security Guidelines:
 * 
 * ✅ DO THIS:
 * - Store RAZORPAY_KEY_SECRET in environment variables on server only
 * - Verify payment signatures on backend before updating database
 * - Only mark payment as 'paid' after signature verification succeeds
 * - Log all payment verification attempts (success and failure)
 * - Return generic error messages to frontend (don't reveal signature details)
 * - Always update payment status server-side, never trust frontend
 * 
 * ❌ NEVER DO THIS:
 * - Put RAZORPAY_KEY_SECRET in .env that gets sent to frontend
 * - Verify signatures on frontend
 * - Trust payment status sent by frontend
 * - Skip signature verification to "save time"
 * - Log sensitive data like payment IDs in user-visible logs
 * - Let frontend directly update payment database
 */

export const RAZORPAY_SECURITY_NOTES = {
  keySecret: 'MUST be in backend .env ONLY - NEVER in VITE_* variables',
  signatureVerification: 'MUST happen on backend - protects against spoofed payments',
  paymentStatusUpdate: 'MUST be done after signature verification succeeds',
  errorHandling: 'Return generic errors to frontend, log details server-side only',
};
