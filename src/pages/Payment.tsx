import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle, AlertCircle, IndianRupee } from 'lucide-react';
import { loadRazorpayScript } from '../lib/razorpay';

// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

const Payment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    initializePayment();
  }, []);

  const initializePayment = async () => {
    try {
      // Get registration data from session storage
      const storedData = sessionStorage.getItem('registrationData');
      if (!storedData) {
        setError('No registration data found. Please register again.');
        setLoading(false);
        return;
      }

      const data = JSON.parse(storedData);
      setPaymentData(data);

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError('Failed to load payment gateway. Please refresh and try again.');
      }
    } catch (err) {
      console.error('Initialization error:', err);
      setError('Failed to initialize payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async () => {
    if (!paymentData) {
      setError('Payment data not found');
      return;
    }

    if (!window.Razorpay) {
      setError('Payment gateway is not available. Please refresh the page.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
      console.log('🔍 Checking Razorpay setup...');
      console.log('  - Key ID exists:', !!razorpayKeyId);
      console.log('  - Payment data:', { amount: paymentData.amount, teamId: paymentData.team_id });
      
      if (!razorpayKeyId) {
        setError('Payment gateway is not configured. Please contact support.');
        setIsProcessing(false);
        return;
      }

      // Create order via backend API
      console.log('📝 Creating order via backend...');
      const orderResponse = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-order',
          amount: paymentData.amount,
          teamId: paymentData.team_id,
          eventName: paymentData.eventName,
        }),
      });

      const orderData = await orderResponse.json();
      if (!orderData.success) {
        setError('Failed to create order. Please try again.');
        setIsProcessing(false);
        return;
      }

      const amountInPaise = orderData.amount;
      const amountInInr = orderData.amount / 100;
      
      console.log('💳 Razorpay Configuration:');
      console.log('  - Order ID:', orderData.orderId);
      console.log('  - Amount (INR):', amountInInr);
      console.log('  - Amount (paise):', amountInPaise);
      console.log('  - Currency: INR');
      
      // Razorpay configuration
      const options = {
        key: razorpayKeyId,
        amount: amountInPaise,
        currency: 'INR',
        name: 'ROBOYUDH 2026',
        description: `Registration for ${paymentData.eventName}`,
        order_id: orderData.orderId,
        image: '/roboyudh-logo.png',
        prefill: {
          name: paymentData.formData?.fullName || paymentData.teamName,
          email: paymentData.formData?.email || '',
          contact: paymentData.formData?.mobileNumber || '',
        },
        notes: {
          team_id: paymentData.team_id,
          event_name: paymentData.eventName,
          team_name: paymentData.teamName,
        },
        theme: {
          color: '#06b6d4',
        },
        handler: async function (response: any) {
          console.log('🎉 Razorpay handler called with response');
          await handlePaymentSuccess(response);
        },
      };

      console.log('🚀 Opening Razorpay modal...');
      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', function (response: any) {
        console.error('❌ Razorpay payment.failed event:', response.error);
        setError(response.error.description || 'Payment failed. Please try again.');
        setIsProcessing(false);
      });

      razorpay.on('payment.closed', function () {
        console.warn('⚠️ Razorpay modal closed by user');
        setError('Payment cancelled. Please try again.');
        setIsProcessing(false);
      });

      razorpay.open();
      console.log('✅ Razorpay modal should now be visible');

    } catch (err) {
      console.error('❌ Payment initiation error:', err);
      setError('Failed to open payment gateway. Please try again.');
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async (razorpayResponse: any) => {
    try {
      console.log('Payment Success Response:', razorpayResponse);
      setIsProcessing(true);

      if (!razorpayResponse.razorpay_payment_id || !razorpayResponse.razorpay_signature) {
        setError('Invalid payment response. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Step 1: Verify payment via backend
      console.log('🔐 Verifying payment via backend...');
      const verifyResponse = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-payment',
          razorpay_order_id: razorpayResponse.razorpay_order_id,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_signature: razorpayResponse.razorpay_signature,
          teamId: paymentData.team_id,
        }),
      });

      const verifyData = await verifyResponse.json();
      if (!verifyData.success || !verifyData.ticket) {
        setError('Payment verification failed. Please contact support.');
        setIsProcessing(false);
        return;
      }

      console.log('✅ Payment verified successfully');
      const paymentId = verifyData.paymentId;
      const ticket = verifyData.ticket;

      // Update session storage with ticket info from server
      const updatedData = {
        ...paymentData,
        ticket_id: ticket.id,
        ticketCode: ticket.ticket_code,
        paymentStatus: 'paid',
        razorpay_payment_id: paymentId,
      };
      sessionStorage.setItem('registrationData', JSON.stringify(updatedData));
      console.log('✅ Session storage updated');

      // Redirect to ticket page
      console.log('🚀 Redirecting to ticket page...');
      navigate('/ticket');
    } catch (err) {
      console.error('❌ Post-payment processing error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Payment processing failed: ${errorMsg}`);
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-16 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">
              Complete Payment
            </span>
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-blue-600 mx-auto mb-6"></div>
          <p className="text-xl text-gray-400">Secure payment via Razorpay</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400">{error}</p>
              {error.includes('Payment successful') && (
                <button
                  onClick={() => navigate('/my-registrations')}
                  className="mt-2 text-cyan-400 hover:text-cyan-300 underline"
                >
                  View My Registrations
                </button>
              )}
            </div>
          </div>
        )}

        {paymentData && (
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <IndianRupee className="w-6 h-6 text-cyan-400" />
                Payment Summary
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-700">
                  <span className="text-gray-400">Event</span>
                  <span className="text-white font-semibold">{paymentData.eventName}</span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-gray-700">
                  <span className="text-gray-400">Team Name</span>
                  <span className="text-white font-semibold">{paymentData.teamName}</span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-gray-700">
                  <span className="text-gray-400">College</span>
                  <span className="text-white font-semibold">{paymentData.collegeName}</span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-gray-700">
                  <span className="text-gray-400">Team Size</span>
                  <span className="text-white font-semibold">{paymentData.teamSize} members</span>
                </div>

                <div className="flex justify-between items-center py-3 border-b border-gray-700">
                  <span className="text-gray-400">Rate per Person</span>
                  <span className="text-white font-semibold">₹{Math.round(paymentData.amount / paymentData.teamSize)}</span>
                </div>

                <div className="flex justify-between items-center py-4 mt-4 bg-cyan-500/10 rounded-lg px-4">
                  <span className="text-xl font-bold text-cyan-400">Total Amount</span>
                  <span className="text-3xl font-bold text-cyan-400">₹{paymentData.amount}</span>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-yellow-400 font-bold mb-2">⚠️ Important Information</h3>
                  <ul className="text-gray-300 space-y-2 text-sm">
                    <li>• Payment is processed securely through Razorpay</li>
                    <li>• Your ticket will be generated only after successful payment</li>
                    <li>• Keep your payment ID safe for future reference</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Payment Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/register')}
                disabled={isProcessing}
                className="flex-1 px-6 py-4 border border-gray-700 text-gray-300 font-bold rounded-lg hover:border-gray-600 hover:bg-gray-800/30 transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={initiatePayment}
                disabled={isProcessing}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Pay ₹{paymentData.amount}
                  </>
                )}
              </button>
            </div>

            {/* Secure Payment Badge */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-semibold">Secured by Razorpay</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;
