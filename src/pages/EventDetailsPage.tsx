import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { fetchEvents, Event } from '../lib/db';
import { Users, IndianRupee, Zap, Shield, Trophy, ArrowLeft } from 'lucide-react';

const EventDetailsPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const events = await fetchEvents();
        const foundEvent = events.find(e => e.id === eventId);
        setEvent(foundEvent || null);
      } catch (error) {
        console.error('Failed to load event:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-24 flex items-center justify-center">
        <p className="text-gray-400">Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-black pt-24 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="text-center">
            <p className="text-gray-400 text-lg">Event not found</p>
          </div>
        </div>
      </div>
    );
  }

  const isTech = event.category === 'tech';

  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/events')}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Events
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Zap className={`w-6 h-6 ${isTech ? 'text-cyan-400' : 'text-orange-400'}`} />
            <span className={`text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded ${
              isTech
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
            }`}>
              {event.category}
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text mb-4">
            {event.name}
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
        </div>

        {/* Event Image */}
        <div className="w-full h-96 bg-black rounded-xl overflow-hidden border border-cyan-500/20 mb-8 shadow-2xl shadow-cyan-500/10">
          <img 
            src={event.image_url} 
            alt={event.name}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Overview Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            About This Event
          </h2>
          <p className="text-lg text-gray-300 leading-relaxed">
            {event.description}
          </p>
        </div>

        {/* Key Information Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-400/50 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-gray-400 text-sm font-semibold">Team Size</h3>
            </div>
            <p className="text-3xl font-bold text-white">1 to {event.max_team_size}</p>
            <p className="text-gray-400 text-sm mt-2">members per team</p>
          </div>

          <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-400/50 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-gray-400 text-sm font-semibold">Registration Fee</h3>
            </div>
            <p className="text-3xl font-bold text-white">₹{event.price_per_head}</p>
            <p className="text-gray-400 text-sm mt-2">per person</p>
          </div>
        </div>

        {/* Rules & Guidelines Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-cyan-400 mb-6 flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Rules & Guidelines
          </h2>
          
          {event.rules && event.rules.length > 0 ? (
            <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-cyan-500/20 rounded-xl p-8">
              <div className="space-y-4">
                {event.rules.map((rule, idx) => {
                  // Check if it's a separator line
                  if (rule.startsWith('━━━') || rule.trim() === '') {
                    return <div key={idx} className="border-t border-cyan-500/30 my-6"></div>;
                  }
                  
                  // Check if it's a section header (starts with emoji)
                  const isHeader = /^[🤖🏟️⏱️📋🎮🏆⚠️🚫🛡️⚖️🎯🎟️]/u.test(rule);
                  
                  if (isHeader) {
                    return (
                      <h3 key={idx} className="text-xl font-bold text-cyan-400 mt-8 mb-4 first:mt-0">
                        {rule}
                      </h3>
                    );
                  }
                  
                  // Regular rule item
                  return (
                    <div key={idx} className="flex gap-4 ml-4">
                      <div className="flex-shrink-0 w-2 h-2 bg-cyan-500 rounded-full mt-2"></div>
                      <span className="text-gray-300 leading-relaxed flex-1">{rule}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-yellow-500/20 rounded-xl p-8">
              <p className="text-yellow-400 italic">Rules will be updated soon</p>
            </div>
          )}
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-12">
          <p className="text-yellow-400 text-lg font-bold mb-4">⚠️ Important Information</p>
          <ul className="text-yellow-300 space-y-2">
            <li className="flex gap-2">
              <span>•</span>
              <span>Please read all rules carefully before registering for the event</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Each participant must purchase a ROBOYUDH 2026 ticket to compete</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>The event committee's decision is final in all matters</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Rules are subject to change - please check back for updates</span>
            </li>
          </ul>
        </div>

        {/* Download Rulebook */}
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6 mb-12">
          <p className="text-purple-300 text-lg font-bold mb-4">📋 Event Rulebook</p>
          <p className="text-gray-300 mb-6">Download the complete rulebook and specifications for this event</p>
          <a
            href={`/rulebooks/${event.name.replace(/\s+/g, '_')}_Rulebook.pdf`}
            download
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all"
          >
            <span>⬇️</span>
            <span>Download Rulebook PDF</span>
          </a>
        </div>

        {/* Register Button */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/events')}
            className="flex-1 px-6 py-4 border border-gray-700 text-gray-300 font-bold rounded-lg hover:border-gray-600 hover:bg-gray-800/30 transition-all text-lg"
          >
            Back
          </button>
          <button
            onClick={() => navigate(`/register?event=${event.id}`)}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all text-lg"
          >
            Register Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPage;
