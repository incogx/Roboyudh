import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Calendar, Users, Building2, Ticket as TicketIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserRegistrations } from '../lib/db';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Registration {
  id: string;
  event_name: string;
  team_name: string;
  college_name: string;
  team_size: number;
  amount: number;
  payment_status: string;
  ticket_code: string | null;
  created_at: string;
  member_names: string[];
}

export default function MyRegistrations() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadRegistrations();
    }
  }, [user]);

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const data = await getUserRegistrations();
      setRegistrations(data);
    } catch (error) {
      console.error('Error loading registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTicket = async (registration: Registration) => {
    setDownloadingId(registration.id);
    try {
      // Create ticket element for PDF
      const ticketElement = document.getElementById(`ticket-${registration.id}`);
      if (!ticketElement) return;

      const canvas = await html2canvas(ticketElement, {
        scale: 2,
        backgroundColor: '#000000',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`ROBOYUDH-2026-Ticket-${registration.ticket_code}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setDownloadingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your registrations...</p>
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

      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">
              My Registrations
            </span>
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-blue-600 mx-auto mb-6"></div>
          <p className="text-xl text-gray-400">View and download your event tickets</p>
        </div>

        {registrations.length === 0 ? (
          <div className="text-center py-16">
            <TicketIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400 mb-6">No registrations yet</p>
            <button
              onClick={() => navigate('/events')}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all"
            >
              Browse Events
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {registrations.map((registration) => (
              <div
                key={registration.id}
                className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl overflow-hidden"
              >
                {/* Ticket Preview */}
                <div
                  id={`ticket-${registration.id}`}
                  className="p-8 bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      {registration.ticket_code ? (
                        <div className="flex items-center gap-2 mb-2">
                          <TicketIcon className="w-6 h-6 text-cyan-400" />
                          <span className="text-cyan-400 font-mono text-sm">
                            {registration.ticket_code}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mb-2">
                          <TicketIcon className="w-6 h-6 text-orange-400" />
                          <span className="text-orange-400 font-mono text-sm">
                            PAYMENT PENDING
                          </span>
                        </div>
                      )}
                      <h2 className="text-3xl font-bold text-white mb-2">
                        {registration.event_name}
                      </h2>
                      <p className="text-gray-400">
                        Registered on {new Date(registration.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-cyan-400">
                        ₹{registration.amount}
                      </div>
                      <div className="text-sm text-gray-400">Total Amount</div>
                      {registration.payment_status === 'paid' ? (
                        <div className="mt-2 inline-block px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                          ✓ PAID
                        </div>
                      ) : (
                        <div className="mt-2 inline-block px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-semibold">
                          ⚠ UNPAID
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-cyan-400 mt-1" />
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Team Name</div>
                        <div className="text-white font-semibold">{registration.team_name}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-cyan-400 mt-1" />
                      <div>
                        <div className="text-sm text-gray-400 mb-1">College</div>
                        <div className="text-white font-semibold">{registration.college_name}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-cyan-400 mt-1" />
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Team Size</div>
                        <div className="text-white font-semibold">{registration.team_size} members</div>
                      </div>
                    </div>
                  </div>

                  {registration.member_names.length > 0 && (
                    <div className="border-t border-gray-700 pt-4">
                      <div className="text-sm text-gray-400 mb-3">Team Members</div>
                      <div className="grid md:grid-cols-2 gap-2">
                        {registration.member_names.map((name, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                            <span className="text-white">{name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Download Button or Payment Button */}
                <div className="px-8 py-4 bg-gray-800/50 border-t border-gray-700">
                  {registration.payment_status === 'paid' && registration.ticket_code ? (
                    <button
                      onClick={() => handleDownloadTicket(registration)}
                      disabled={downloadingId === registration.id}
                      className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {downloadingId === registration.id ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Generating PDF...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5" />
                          Download Ticket
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        // Store registration data and redirect to payment
                        sessionStorage.setItem('registrationData', JSON.stringify({
                          team_id: registration.id,
                          eventName: registration.event_name,
                          teamName: registration.team_name,
                          collegeName: registration.college_name,
                          teamSize: registration.team_size,
                          memberNames: registration.member_names,
                          amount: registration.amount,
                          paymentStatus: 'unpaid',
                        }));
                        navigate('/payment');
                      }}
                      className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all flex items-center justify-center gap-2"
                    >
                      Complete Payment →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
