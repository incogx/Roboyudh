import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, KeyRound, Loader2, Shield } from 'lucide-react';

const AdminLogin = () => {
  const { signInWithOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const { error } = await signInWithOtp(email);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess('OTP sent to your email! Check your inbox.');
      setStep('otp');
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await verifyOtp(email, otp);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess('Login successful!');
      setTimeout(() => {
        navigate('/admin');
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 pt-24">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="relative bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-orange-500/20">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500/20 border border-orange-500/30 rounded-full mb-4">
            <Shield className="w-8 h-8 text-orange-400" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 text-transparent bg-clip-text mb-2">
            Admin Access
          </h2>
          <p className="text-gray-400 text-sm">
            {step === 'email' ? 'Enter admin email to receive OTP' : 'Enter the OTP sent to your email'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
            {success}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="roboyudh.admin@gmail.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-black/50 border border-orange-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending OTP...</span>
                </>
              ) : (
                <span>Send OTP</span>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                One-Time Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  required
                  maxLength={6}
                  className="w-full pl-10 pr-4 py-3 bg-black/50 border border-orange-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Verify & Login</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full text-orange-400 hover:text-orange-300 text-sm transition-colors"
            >
              ← Back to email
            </button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            🔒 Authorized personnel only. This is a restricted area.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
