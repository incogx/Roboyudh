import { useState, useEffect } from 'react';
import { fetchEvents, fetchLeaderboardWithTeams, Event, LeaderboardEntry, subscribeToLeaderboard } from '../lib/db';
import { Trophy, Medal, Award } from 'lucide-react';

const Leaderboard = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Load events
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await fetchEvents();
        setEvents(data);
        if (data.length > 0) {
          setSelectedEventId(data[0].id);
        }
      } catch (error) {
        console.error('Failed to load events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Load and subscribe to leaderboard
  useEffect(() => {
    if (!selectedEventId) return;

    const loadLeaderboard = async () => {
      try {
        const data = await fetchLeaderboardWithTeams(selectedEventId);
        setLeaderboard(data);
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
      }
    };

    loadLeaderboard();

    // Subscribe to real-time updates
    const subscription = subscribeToLeaderboard(selectedEventId, (newEntry) => {
      setLeaderboard((prev) => {
        const updated = prev.filter((e) => e.team_id !== newEntry.team_id);
        return [newEntry, ...updated].sort((a, b) => (b.score || 0) - (a.score || 0));
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedEventId]);

  const getRankIcon = (rank: number | null) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-400" />;
      default:
        return null;
    }
  };

  const getRankBadge = (rank: number | null) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white';
      default:
        return 'bg-gray-900 text-gray-400 border border-cyan-500/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-16 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-transparent bg-clip-text">
              Leaderboard
            </span>
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-yellow-500 to-orange-600 mx-auto mb-6"></div>
          <p className="text-xl text-gray-400">
            See who's leading the competition
          </p>
        </div>

        <div className="mb-8 overflow-x-auto">
          <div className="flex space-x-2 min-w-max pb-4">
            {events.map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedEventId(event.id)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 whitespace-nowrap ${
                  selectedEventId === event.id
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/50 transform scale-105'
                    : 'bg-gray-900 text-gray-400 border border-cyan-500/20 hover:border-cyan-400/50 hover:text-cyan-400'
                }`}
              >
                {event.name}
              </button>
            ))}
          </div>
        </div>

        {leaderboard.length > 0 ? (
          <div className="space-y-4">
            {leaderboard.map((entry) => (
              <div
                key={entry.id}
                className={`group bg-gradient-to-br from-gray-900 to-black border rounded-xl p-6 transition-all duration-300 transform hover:-translate-y-1 ${
                  entry.rank && entry.rank <= 3
                    ? 'border-cyan-400/50 hover:shadow-xl hover:shadow-cyan-500/30'
                    : 'border-cyan-500/20 hover:border-cyan-400/50'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center space-x-6 flex-1">
                    <div
                      className={`flex items-center justify-center w-16 h-16 rounded-lg font-bold text-xl ${getRankBadge(
                        entry.rank
                      )}`}
                    >
                      {entry.rank && entry.rank <= 3
                        ? getRankIcon(entry.rank)
                        : `#${entry.rank || '—'}`}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors duration-300">
                        {(entry.team as any)?.team_name || 'Unknown Team'}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {(entry.team as any)?.college_name || 'Unknown College'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Score</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">
                      {entry.score || 0}
                    </p>
                  </div>
                </div>

                {entry.rank && entry.rank <= 3 && (
                  <div className="mt-4 pt-4 border-t border-cyan-500/20">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Prize Winner</span>
                      <Trophy className="w-5 h-5 text-yellow-400 animate-pulse" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gradient-to-br from-gray-900/50 to-black/50 border border-cyan-500/20 rounded-xl">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-xl">No leaderboard data available for this event yet.</p>
            <p className="text-gray-500 mt-2">Check back after the competition begins!</p>
          </div>
        )}

        <div className="mt-12 p-8 bg-gradient-to-br from-gray-900/50 to-black/50 border border-cyan-500/20 rounded-xl">
          <h3 className="text-2xl font-bold text-cyan-400 mb-4 text-center">How Scoring Works</h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-400">
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-6 h-6 text-yellow-400" />
              </div>
              <p className="font-semibold text-white mb-2">Racing Events</p>
              <p>Points based on completion time. Faster times earn higher scores.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Medal className="w-6 h-6 text-cyan-400" />
              </div>
              <p className="font-semibold text-white mb-2">Battle Events</p>
              <p>Win-based scoring. Each victory adds points to your total score.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-orange-400" />
              </div>
              <p className="font-semibold text-white mb-2">Gaming Events</p>
              <p>Match performance and tournament progression determine scores.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
