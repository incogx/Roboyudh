import { Link } from 'react-router-dom';
import { Users, IndianRupee, Zap } from 'lucide-react';
import { Event } from '../lib/db';
import { useAuth } from '../context/AuthContext';

interface EventCardProps {
  event: Event;
}

const EventCard = ({ event }: EventCardProps) => {
  const isTech = event.category === 'tech';
  const { user } = useAuth();

  const normalizedEventName = event.name.replace(/\s+/g, '').toLowerCase();

  const getDetailsPath = () => {
    switch (normalizedEventName) {
      case 'rcracing':
        return '/details/rc-racing';
      case 'robosumo':
        return '/details/robo-sumo';
      case 'obstaclerun':
        return '/details/obstacle-run';
      case 'robosoccer':
        return '/details/robo-soccer';
      case 'gameverse':
        return '/details/game-verse';
      case 'linefollower':
        return '/details/line-follower';
      default:
        return `/events/${event.id}`;
    }
  };

  const handleRegisterClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!user) {
      e.preventDefault();
      // Preserve the event ID in the redirect URL
      window.location.href = `/login?redirect=${encodeURIComponent(`/register?event=${event.id}`)}`;
    }
  };

  return (
    <div className="group relative bg-gradient-to-br from-gray-900 to-black border border-cyan-500/20 rounded-xl overflow-hidden hover:border-cyan-400/50 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/30">
      {/* Event Image */}
      <div className="relative h-48 overflow-hidden bg-black">
        <img 
          src={event.image_url || '/images/logo.png'} 
          alt={event.name}
          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
      </div>

      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className={`w-5 h-5 ${isTech ? 'text-cyan-400' : 'text-orange-400'}`} />
              <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded ${
                isTech
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              }`}>
                {event.category}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors duration-300">
              {event.name}
            </h3>
          </div>
        </div>

        <p className="text-gray-400 mb-6 line-clamp-2 group-hover:text-gray-300 transition-colors duration-300">
          {event.description}
        </p>

        <div className="space-y-3 mb-6">
          <div className="flex items-center space-x-3 text-gray-300">
            <Users className="w-5 h-5 text-cyan-400" />
            {event.name === 'Game Verse' ? (
              <span className="text-sm">Exactly 2 members</span>
            ) : (
              <span className="text-sm">Max {event.max_team_size} members</span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <IndianRupee className="w-5 h-5 text-cyan-400" />
            {event.name === 'Game Verse' ? (
              <span className="text-lg font-semibold text-white">₹200<span className="text-sm text-gray-400 ml-1"> per team</span></span>
            ) : (
              <span className="text-lg font-semibold text-white">₹{event.price_per_head}<span className="text-sm text-gray-400 ml-1"> per person</span></span>
            )}
          </div>
        </div>

        <div className="flex space-x-3">
          <Link
            to={`/register?event=${event.id}`}
            onClick={handleRegisterClick}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105 text-center"
          >
            Register Now
          </Link>
          <Link 
            to={getDetailsPath()}
            className="px-4 py-3 border border-cyan-500/30 text-cyan-400 font-semibold rounded-lg hover:bg-cyan-500/10 hover:border-cyan-400/50 transition-all duration-300"
          >
            Details
          </Link>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </div>
  );
};

export default EventCard;
