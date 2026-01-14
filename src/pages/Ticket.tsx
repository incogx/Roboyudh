import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchTicket, fetchPayment, fetchUserTeams, Ticket as TicketType } from '../lib/db';
import { CheckCircle, Download, Calendar, Users, IndianRupee, QrCode } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface TicketData {
  team_id: string;
  ticket_id: string;
  eventName: string;
  teamName: string;
  collegeName: string;
  teamSize: number;
  memberNames: string[];
  amount: number;
  ticketCode: string;
  paymentId: string;
  createdAt: string;
}

const Ticket = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const ticketRef = useRef<HTMLDivElement>(null);
  
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [showSuccess, setShowSuccess] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    const loadTicketData = async () => {
      try {
        // Try to get registration data from sessionStorage first
        const stored = sessionStorage.getItem('registrationData');
        if (stored) {
          const data = JSON.parse(stored);
          setTicketData(data);
        } else {
          // Fallback: Get latest team and ticket from database
          const teams = await fetchUserTeams();
          if (teams.length === 0) {
            navigate('/register');
            return;
          }

          const latestTeam = teams[0];
          const ticket = await fetchTicket(latestTeam.id);
          const payment = await fetchPayment(latestTeam.id);

          if (!ticket) {
            navigate('/register');
            return;
          }

          setTicketData({
            team_id: latestTeam.id,
            ticket_id: ticket.id,
            eventName: '', // Would need to fetch event
            teamName: latestTeam.team_name,
            collegeName: latestTeam.college_name,
            teamSize: latestTeam.team_size,
            memberNames: [],
            amount: payment?.amount || 0,
            ticketCode: ticket.ticket_code,
            paymentId: payment?.id || '',
            createdAt: new Date().toISOString(),
          });
        }

        setTimeout(() => setShowSuccess(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load ticket');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTicketData();
  }, [user, authLoading, navigate]);

  const handleDownload = async () => {
    if (!ticketData || !ticketRef.current) return;
    
    try {
      setDownloading(true);
      
      // Capture the ticket element as canvas
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: '#000000',
        logging: false,
      });
      
      // Convert canvas to image
      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      // Calculate dimensions to fit the ticket on A4
      const imgWidth = 190; // A4 width minus margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      
      // Save PDF
      pdf.save(`ROBOYUDH-2026-Ticket-${ticketData.ticketCode}.pdf`);
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your ticket...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/register')}
            className="px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600"
          >
            Back to Registration
          </button>
        </div>
      </div>
    );
  }

  if (!ticketData) return null;

  const formattedDate = new Date(ticketData.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-black pt-24 pb-16 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-green-500/50 rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl shadow-green-500/30 animate-scale-in">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-green-400 mb-2">Success!</h2>
            <p className="text-gray-300 text-lg">Your registration is confirmed</p>
          </div>
        </div>
      )}

      <div className="relative max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-green-400 to-cyan-500 text-transparent bg-clip-text">
              Registration Complete
            </span>
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-cyan-600 mx-auto mb-6"></div>
          <p className="text-xl text-gray-400">
            Your ticket has been generated successfully
          </p>
        </div>

        <div ref={ticketRef} className="relative bg-gradient-to-br from-gray-900 to-black border-2 border-cyan-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/20">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600"></div>

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8 pb-8 border-b border-cyan-500/20">
              <h2 className="text-3xl font-bold text-white mb-2">ROBOYUDH 2026</h2>
              <p className="text-cyan-400 font-semibold">Registration Confirmation</p>
            </div>

            {/* Ticket Details */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-gray-400 text-sm mb-1">TICKET CODE</p>
                <p className="text-2xl font-mono font-bold text-cyan-400">{ticketData.ticketCode}</p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">EVENT</p>
                <p className="text-xl font-bold text-white">{ticketData.eventName || 'Event Details'}</p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">TEAM NAME</p>
                <p className="text-xl font-bold text-white">{ticketData.teamName}</p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">COLLEGE</p>
                <p className="text-lg font-semibold text-gray-300">{ticketData.collegeName}</p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-black/50 rounded-lg border border-cyan-500/10">
              <div className="text-center">
                <Users className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
                <p className="text-gray-400 text-xs mb-1">TEAM SIZE</p>
                <p className="text-xl font-bold text-white">{ticketData.teamSize}</p>
              </div>

              <div className="text-center">
                <IndianRupee className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
                <p className="text-gray-400 text-xs mb-1">AMOUNT</p>
                <p className="text-xl font-bold text-white">₹{ticketData.amount}</p>
              </div>

              <div className="text-center">
                <Calendar className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
                <p className="text-gray-400 text-xs mb-1">DATE</p>
                <p className="text-sm font-bold text-white">{new Date(ticketData.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="mb-8 p-6 bg-white rounded-lg text-center">
              <QrCode className="w-40 h-40 text-black mx-auto" />
              <p className="text-gray-600 text-sm mt-2">Scan this code for verification</p>
            </div>

            {/* Member Names */}
            {ticketData.memberNames.length > 0 && (
              <div className="mb-8">
                <p className="text-cyan-400 font-semibold mb-3">TEAM MEMBERS</p>
                <div className="space-y-2">
                  {ticketData.memberNames.map((name, index) => (
                    <div key={index} className="flex items-center space-x-3 p-2 bg-black/50 rounded">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400">
                        {index + 1}
                      </div>
                      <p className="text-gray-300">{name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-8 border-t border-cyan-500/20">
              <p className="text-xs text-gray-500 text-center mb-4">
                Registration Date: {formattedDate}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Generating PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="mt-8 p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl">
          <h3 className="text-orange-400 font-semibold mb-3">Important Notes</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• Keep this ticket code safe for check-in during the event</li>
            <li>• Ensure all team members are registered before the event</li>
            <li>• Contact organizers if payment status is not updated within 24 hours</li>
            <li>• Event starts on March 15, 2026 at SIST Campus, Chennai</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Ticket;
