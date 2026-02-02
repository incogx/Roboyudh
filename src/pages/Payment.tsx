import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface PaymentData {
  id: string;
  team_id: string;
  event_id: string;
  user_id: string;
  amount: number;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

interface EventData {
  id: string;
  name: string;
  category: string;
  price_per_head: number;
}



const Payment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('id');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [event, setEvent] = useState<EventData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPaymentDetails = async (): Promise<void> => {
      if (!user) {
        navigate('/login');
        return;
      }

      if (!paymentId) {
        setError('Payment ID not found');
        setLoading(false);
        return;
      }

      try {
        // Fetch payment
        const { data: paymentData, error: paymentError } = await supabase
          .from('payments')
          .select('*')
          .eq('id', paymentId)
          .single();

        if (paymentError || !paymentData) {
          setError('Payment not found');
          setLoading(false);
          return;
        }

        if (paymentData.user_id !== user.id) {
          setError('Not authorized to view this payment');
          setLoading(false);
          return;
        }

        setPayment(paymentData);

        // Fetch event
        const { data: eventData } = await supabase
          .from('events')
          .select('id, name, category, price_per_head')
          .eq('id', paymentData.event_id)
          .single();

        if (eventData) {
          setEvent(eventData);
        }



        setLoading(false);
      } catch (err) {
        setError('Failed to load payment details');
        setLoading(false);
      }
    };

    loadPaymentDetails();
  }, [user, paymentId, navigate]);

  // ...existing code...

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading payment details...</p>
        </div>
      </div>
    );
  }

  // Error state (no payment found)
  if (error && !payment) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-gradient-to-br from-gray-900 to-gray-800 border border-red-500/30 rounded-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-400 mb-2">Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-all"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // ...existing code...

  if (!payment || !event) {
    return null;
  }

  // Check payment status
  const isApproved = payment.status === 'APPROVED';
  const isRejected = payment.status === 'REJECTED';
  const isPending = payment.status === 'PENDING';

  return (
    <div className="min-h-screen bg-black pt-24 pb-16 px-4 flex items-center justify-center">
      <div className={`relative max-w-md w-full bg-gradient-to-br from-gray-900 to-gray-800 border rounded-xl p-8 text-center ${
        isApproved ? 'border-green-500/30' : isRejected ? 'border-red-500/30' : 'border-cyan-500/30'
      }`}>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
          isApproved ? 'bg-green-500/20' : isRejected ? 'bg-red-500/20' : 'bg-cyan-500/20'
        }`}>
          {isApproved ? (
            <CheckCircle2 className="w-12 h-12 text-green-400" />
          ) : isRejected ? (
            <AlertCircle className="w-12 h-12 text-red-400" />
          ) : (
            <CheckCircle2 className="w-12 h-12 text-cyan-400" />
          )}
        </div>
        
        {isApproved && (
          <>
            <h2 className="text-3xl font-bold text-green-400 mb-4">Payment Approved!</h2>
            <p className="text-gray-300 mb-2">Your registration has been confirmed.</p>
            <p className="text-gray-400 text-sm mb-8">
              Your ticket has been generated. Check your email or view it in My Registrations.
            </p>
          </>
        )}
        
        {isRejected && (
          <>
            <h2 className="text-3xl font-bold text-red-400 mb-4">Registration Rejected</h2>
            <p className="text-gray-300 mb-2">Unfortunately, your registration was not approved.</p>
            {payment.rejection_reason && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                <p className="text-red-300 font-semibold mb-1">Reason:</p>
                <p className="text-gray-300 text-sm">{payment.rejection_reason}</p>
              </div>
            )}
            <p className="text-gray-400 text-sm mb-8">
              For more information, please contact the event organizers.
            </p>
          </>
        )}
        
        {isPending && (
          <>
            <h2 className="text-3xl font-bold text-cyan-400 mb-4">Registration Submitted!</h2>
            <p className="text-gray-300 mb-2">Your registration details have been submitted.</p>
            <p className="text-gray-400 text-sm mb-8">
              <span className="font-semibold text-cyan-400">Payment will be collected at the event desk on the event day.</span>
              <br/>You will receive a confirmation email once the admin approves your registration after payment collection.
            </p>
          </>
        )}
        
        <button
          onClick={() => navigate('/')}
          className={`w-full py-3 text-white font-bold rounded-lg transition-all ${
            isApproved ? 'bg-green-500 hover:bg-green-600' : 
            isRejected ? 'bg-red-500 hover:bg-red-600' : 
            'bg-cyan-500 hover:bg-cyan-600'
          }`}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default Payment;
