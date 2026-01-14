import { useState, useEffect } from 'react';
import EventCard from '../components/EventCard';
import { fetchEvents, Event } from '../lib/db';
import { Zap, Gamepad2 } from 'lucide-react';

const Events = () => {
  const [filter, setFilter] = useState<'all' | 'tech' | 'non-tech'>('all');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        console.log('🔄 Loading events...');
        const data = await fetchEvents();
        console.log('✅ Events loaded:', data);
        console.log('📊 Number of events:', data?.length || 0);
        setEvents(data);
      } catch (error) {
        console.error('❌ Failed to load events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const filteredEvents = events.filter((event) => {
    if (filter === 'all') return true;
    return event.category === filter;
  });

  return (
    <div className="min-h-screen bg-black pt-24 pb-16 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">
              Our Events
            </span>
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-blue-600 mx-auto mb-6"></div>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Choose your battleground and showcase your skills
          </p>
        </div>

        <div className="flex justify-center space-x-4 mb-12">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
              filter === 'all'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/50'
                : 'bg-gray-900 text-gray-400 border border-cyan-500/20 hover:border-cyan-400/50'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilter('tech')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2 ${
              filter === 'tech'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/50'
                : 'bg-gray-900 text-gray-400 border border-cyan-500/20 hover:border-cyan-400/50'
            }`}
          >
            <Zap className="w-5 h-5" />
            <span>Tech Events</span>
          </button>
          <button
            onClick={() => setFilter('non-tech')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2 ${
              filter === 'non-tech'
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/50'
                : 'bg-gray-900 text-gray-400 border border-cyan-500/20 hover:border-cyan-400/50'
            }`}
          >
            <Gamepad2 className="w-5 h-5" />
            <span>Gaming</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <div className="col-span-3 text-center text-gray-400 py-12">Loading events...</div>
          ) : filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          ) : null}
        </div>

        {!loading && filteredEvents.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-xl">No events found in this category.</p>
          </div>
        )}

        <div className="mt-16 p-8 bg-gradient-to-br from-gray-900/50 to-black/50 border border-cyan-500/20 rounded-xl backdrop-blur-sm">
          <h2 className="text-3xl font-bold text-cyan-400 mb-4 text-center">
            Registration Information
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-300">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Tech Events</h3>
              <ul className="space-y-2 text-sm">
                <li>• Registration Fee: ₹200 per person</li>
                <li>• Team Size: 1-5 members</li>
                <li>• Total Cost: Team Size × ₹200</li>
                <li>• All team members must register together</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Gaming Event (Game Verse)</h3>
              <ul className="space-y-2 text-sm">
                <li>• Registration Fee: ₹100 per person</li>
                <li>• Individual participation</li>
                <li>• Multiple game categories available</li>
                <li>• Tournament bracket format</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events;
