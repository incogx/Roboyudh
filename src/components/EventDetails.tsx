import { X, Users, IndianRupee, Zap, Shield, Trophy } from 'lucide-react';
import { Event } from '../lib/db';

interface EventDetailsProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onRegister?: () => void;
}

const EventDetails = ({ event, isOpen, onClose, onRegister }: EventDetailsProps) => {
  if (!isOpen || !event) return null;

  const isTech = event.category === 'tech';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-cyan-500/30 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-gray-900 to-black border-b border-cyan-500/30 p-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className={`w-5 h-5 ${isTech ? 'text-cyan-400' : 'text-orange-400'}`} />
              <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded ${
                isTech
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              }`}>
                {event.category}
              </span>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">
              {event.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Event Image */}
          <div className="w-full h-64 bg-black rounded-lg overflow-hidden border border-gray-700">
            <img 
              src={event.image_url} 
              alt={event.name}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Overview */}
          <div>
            <h3 className="text-xl font-bold text-cyan-400 mb-2 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Overview
            </h3>
            <p className="text-gray-300 leading-relaxed">
              {event.description}
            </p>
          </div>

          {/* Key Information */}
          <div className="grid md:grid-cols-2 gap-4 bg-gray-800/30 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-gray-400 text-sm">Team Size</p>
                <p className="text-white font-semibold">Max {event.max_team_size} members</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <IndianRupee className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-gray-400 text-sm">Registration Fee</p>
                <p className="text-white font-semibold">₹{event.price_per_head} per person</p>
              </div>
            </div>
          </div>

          {/* Rules & Guidelines */}
          <div>
            <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Rules & Guidelines
            </h3>
            <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
              <ul className="space-y-3">
                {event.rules && event.rules.length > 0 ? (
                  event.rules.map((rule, idx) => (
                    <li key={idx} className="flex gap-3 text-gray-300">
                      <span className="flex-shrink-0 w-6 h-6 bg-cyan-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center text-cyan-400 text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="pt-0.5">{rule}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-gray-400 italic">Rules will be updated soon</p>
                )}
              </ul>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-400 text-sm font-semibold mb-2">⚠️ Important Notes:</p>
            <ul className="text-yellow-300/80 text-sm space-y-1">
              <li>• Read all rules carefully before registering</li>
              <li>• Each participant must purchase a ROBOYUDH 26 ticket</li>
              <li>• Event committee's decision is final</li>
              <li>• Rules may be subject to change - check back for updates</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gradient-to-r from-gray-900 to-black border-t border-cyan-500/30 p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-700 text-gray-300 font-semibold rounded-lg hover:border-gray-600 hover:bg-gray-800/30 transition-all"
          >
            Back
          </button>
          {onRegister && (
            <button
              onClick={onRegister}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
            >
              Register Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
