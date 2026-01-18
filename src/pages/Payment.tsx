import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface Payment {
  id: string;
  team_id: string;
  event_id: string;
  user_id: string;
  amount: number;
  transaction_id: string | null;
  screenshot_file_path: string | null;
  status: string;
  created_at: string;
}

interface Event {
  id: string;
  name: string;
}

const Payment: React.FC = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkAuth = async (): Promise<void> => {
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

        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('id, name')
          .eq('id', paymentData.event_id)
          .single();

        if (eventError) {
          setError('Event not found');
        } else {
          setEvent(eventData);
        }

        setLoading(false);
      } catch (err) {
        setError('Failed to load payment details');
        setLoading(false);
      }
    };

    checkAuth();
  }, [user, paymentId, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!transactionId.trim()) {
      setError('Transaction ID is required');
      return;
    }

    if (!screenshot) {
      setError('Please upload a payment screenshot');
      return;
    }

    if (!payment || !user) {
      setError('Payment information missing');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const fileName = `payments/${payment.id}/${Date.now()}_${screenshot.name}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(fileName, screenshot, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        setError('Failed to upload screenshot');
        setSubmitting(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('payments')
        .update({
          transaction_id: transactionId,
          screenshot_file_path: fileName,
          status: 'WAITING',
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      if (updateError) {
        setError('Failed to update payment status');
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      setSubmitting(false);
    } catch (err) {
      setError('An unexpected error occurred');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error && !submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-600 mb-4">Payment Submitted</h2>
            <p className="text-gray-700 mb-2">Your payment proof has been submitted successfully.</p>
            <p className="text-gray-600 text-sm mb-6">
              Our admin team will verify and approve your payment shortly. You will receive a confirmation once verified.
            </p>
            <button
              onClick={() => navigate('/my-registrations')}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              View My Registrations
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!payment || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Payment information not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Submission</h1>
        <p className="text-gray-600 mb-8">{event.name}</p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Amount</h2>
          <p className="text-4xl font-bold text-blue-600">₹{payment.amount}</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">UPI Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Use any UPI app (Google Pay, PhonePe, BHIM, etc.)</li>
            <li>Send ₹{payment.amount} to: <span className="font-mono font-bold">roboyudh@upi</span></li>
            <li>Note the Transaction ID from your payment app</li>
            <li>Take a screenshot of the successful transaction confirmation</li>
            <li>Upload the screenshot and enter the Transaction ID below</li>
          </ol>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="transactionId" className="block text-sm font-medium text-gray-700 mb-2">
              Transaction ID <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="transactionId"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter UPI Transaction ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Usually starts with numbers or UPI ref code</p>
          </div>

          <div>
            <label htmlFor="screenshot" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Screenshot <span className="text-red-600">*</span>
            </label>
            <input
              type="file"
              id="screenshot"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload a clear screenshot of successful payment confirmation. Max 5MB.
            </p>
            {screenshot && <p className="text-sm text-green-600 mt-2">✓ {screenshot.name}</p>}
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {submitting ? 'Submitting...' : 'Submit Payment Proof'}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-6">
          Your payment will be verified by our admin team within 24 hours.
        </p>
      </div>
    </div>
  );
};

export default Payment;
