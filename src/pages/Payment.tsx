import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface PaymentData {
  id: string;
  team_id: string;
  event_id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
}

interface EventData {
  id: string;
  name: string;
  category: string;
  price_per_head: number;
}

interface TeamData {
  team_name: string;
  college_name: string;
  team_size: number;
}

const Payment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('id');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [event, setEvent] = useState<EventData | null>(null);
  const [team, setTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventCategory, setEventCategory] = useState<string>('');
  const [teamSize, setTeamSize] = useState<number>(1);
  const [pricePerHead, setPricePerHead] = useState<number>(0);

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
          setEventCategory(eventData.category);
          setPricePerHead(eventData.price_per_head);
        }

        // Fetch team
        const { data: teamData } = await supabase
          .from('teams')
          .select('team_name, college_name, team_size')
          .eq('id', paymentData.team_id)
          .single();

        if (teamData) {
          setTeam(teamData);
          setTeamSize(teamData.team_size);
        }

        if (teamData) {
          setTeam(teamData);
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

  return (
    <div className="min-h-screen bg-black pt-24 pb-16 px-4 flex items-center justify-center">
      <div className="relative max-w-md w-full bg-gradient-to-br from-gray-900 to-gray-800 border border-green-500/30 rounded-xl p-8 text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-400" />
        </div>
        <h2 className="text-3xl font-bold text-green-400 mb-4">Registration Submitted!</h2>
        <p className="text-gray-300 mb-2">Your registration details have been submitted.</p>
        <p className="text-gray-400 text-sm mb-8">
          Please wait for confirmation. <span className="font-semibold text-cyan-400">Payment will be collected on spot.</span> You will be notified once your registration is confirmed.
        </p>
        <button
          onClick={() => navigate('/')}
          className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-all"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default Payment;
