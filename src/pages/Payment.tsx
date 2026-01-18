import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Upload, CheckCircle2, AlertCircle, Loader2, Copy, Check } from 'lucide-react';

interface PaymentData {
  id: string;
  team_id: string;
  event_id: string;
  user_id: string;
  amount: number;
  transaction_id: string | null;
  screenshot_url: string | null;
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
  const [submitted, setSubmitted] = useState(false);

  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [eventCategory, setEventCategory] = useState<string>('');
  const [teamSize, setTeamSize] = useState<number>(1);
  const [pricePerHead, setPricePerHead] = useState<number>(0);

  // UPI ID
  const UPI_ID = '9150463252@pz';

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

        // Check if already submitted
        if (paymentData.status !== 'PENDING') {
          setSubmitted(true);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setScreenshot(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!transactionId.trim()) {
      setError('Transaction ID / UTR Number is required');
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
      // Upload screenshot to Supabase Storage
      const fileExt = screenshot.name.split('.').pop();
      const fileName = `${user.id}/${payment.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(fileName, screenshot, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setError('Failed to upload screenshot. Please try again.');
        setSubmitting(false);
        return;
      }

      // Update payment record with proof
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          transaction_id: transactionId.trim(),
          screenshot_url: fileName,
          status: 'WAITING',
        })
        .eq('id', payment.id);

      if (updateError) {
        console.error('Update error:', updateError);
        setError('Failed to submit payment. Please try again.');
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      setSubmitting(false);
    } catch (err) {
      console.error('Submit error:', err);
      setError('An unexpected error occurred');
      setSubmitting(false);
    }
  };

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

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-md w-full bg-gradient-to-br from-gray-900 to-gray-800 border border-green-500/30 rounded-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-green-400 mb-4">Payment Submitted!</h2>
          <p className="text-gray-300 mb-2">Your payment proof has been submitted successfully.</p>
          <p className="text-gray-400 text-sm mb-8">
            Our admin team will verify your payment within 24 hours. You'll receive your ticket once approved.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/my-registrations')}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all"
            >
              View My Registrations
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!payment || !event) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-16 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">
              Complete Payment
            </span>
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">{event.name}</p>
        </div>

        {/* Registration Summary */}
        {team && (
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Registration Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Team Name:</span>
                <p className="text-white font-medium">{team.team_name}</p>
              </div>
              <div>
                <span className="text-gray-400">College:</span>
                <p className="text-white font-medium">{team.college_name}</p>
              </div>
              <div>
                <span className="text-gray-400">Team Size:</span>
                <p className="text-white font-medium">{teamSize} member{teamSize > 1 ? 's' : ''}</p>
              </div>
              <div>
                <span className="text-gray-400">Event Type:</span>
                <p className="text-white font-medium capitalize">{eventCategory}</p>
              </div>
            </div>
          </div>
        )}

        {/* Amount Card with Calculation */}
        <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-2 border-cyan-500/50 rounded-xl p-6 mb-6">
          <div className="text-center mb-4">
            <p className="text-gray-300 mb-2">Amount to Pay</p>
            <p className="text-5xl font-bold text-white">₹{payment.amount}</p>
          </div>
          
          {/* Calculation Breakdown */}
          <div className="border-t border-cyan-500/30 pt-4 mt-4">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-gray-400">Event Type:</span>
              <span className="text-cyan-400 font-medium capitalize">{eventCategory} Event</span>
            </div>
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-gray-400">Price per Head:</span>
              <span className="text-white">₹{pricePerHead}</span>
            </div>
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-gray-400">Team Members:</span>
              <span className="text-white">× {teamSize}</span>
            </div>
            <div className="flex justify-between items-center text-base font-bold border-t border-cyan-500/30 pt-2 mt-2">
              <span className="text-gray-300">Total:</span>
              <span className="text-cyan-400">₹{pricePerHead} × {teamSize} = ₹{payment.amount}</span>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
          <h3 className="text-xl font-bold text-white text-center mb-4">Scan & Pay with Any UPI App</h3>
          
          {/* QR Code Image - Portrait 9:16 aspect ratio */}
          <div className="flex justify-center mb-6">
            <div className="bg-white p-2 rounded-2xl shadow-lg shadow-cyan-500/20 max-w-[280px]">
              <img 
                src="/images/gpay-qr.png" 
                alt="GPay QR Code" 
                className="w-full h-auto rounded-xl"
                style={{ aspectRatio: '9/16' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.aspectRatio = '9/16';
                  target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="270" height="480" viewBox="0 0 270 480"><rect fill="%23f0f0f0" width="270" height="480" rx="12"/><text x="135" y="240" text-anchor="middle" dominant-baseline="middle" font-size="16" fill="%23666">QR Code</text></svg>';
                }}
              />
            </div>
          </div>

          {/* UPI ID */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-gray-400">UPI ID:</span>
            <code className="bg-black/50 px-3 py-1 rounded text-cyan-400 font-mono">{UPI_ID}</code>
            <button 
              onClick={copyUpiId}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Copy UPI ID"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>


          {/* Instructions */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-sm">
            <p className="text-yellow-400 font-semibold mb-2">📱 Payment Steps:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-300">
              <li>Scan the QR code with GPay, PhonePe, or Paytm</li>
              <li>Pay exactly <span className="text-cyan-400 font-bold">₹{payment.amount}</span></li>
              <li>Take a screenshot of successful payment</li>
              <li>Upload the screenshot below</li>
            </ol>
          </div>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Upload Payment Proof</h3>

            {/* Transaction ID */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Transaction ID / UTR Number <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter 12-digit UTR or Transaction ID"
                className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Find this in your UPI app payment history</p>
            </div>

            {/* Screenshot Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Payment Screenshot <span className="text-red-400">*</span>
              </label>
              
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-cyan-500/30 rounded-xl cursor-pointer hover:border-cyan-400 hover:bg-cyan-500/5 transition-all">
                {previewUrl ? (
                  <div className="relative w-full h-full p-2">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-full object-contain rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                      <p className="text-white text-sm">Click to change</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6">
                    <Upload className="w-10 h-10 text-cyan-400 mb-2" />
                    <p className="text-gray-400 text-sm">Click to upload screenshot</p>
                    <p className="text-gray-500 text-xs mt-1">PNG, JPG up to 5MB</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  required
                />
              </label>
              
              {screenshot && (
                <p className="text-green-400 text-sm mt-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {screenshot.name}
                </p>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Submit Payment Proof
              </>
            )}
          </button>
        </form>

        {/* Footer Note */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Your payment will be verified within 24 hours. You'll receive your ticket once approved.
        </p>
      </div>
    </div>
  );
};

export default Payment;
