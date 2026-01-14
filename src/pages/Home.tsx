import { Link } from 'react-router-dom';
import { Calendar, MapPin, Trophy, Users, Zap, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchEvents, Event } from '../lib/db';

const Home = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await fetchEvents();
        setEvents(data);
      } catch (error) {
        console.error('Failed to load events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <section className="relative min-h-screen flex items-center justify-center px-4 pt-24">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8 inline-block animate-fade-in-down">
            <div className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 border border-cyan-400/40 rounded-full backdrop-blur-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105">
              <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-cyan-400 text-sm md:text-base font-semibold uppercase tracking-wider">
                National Level Event
              </span>
              <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black mb-6 leading-tight animate-fade-in-up">
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-500 text-transparent bg-clip-text animate-gradient drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]">
              ROBOYUDH
            </span>
            <br />
            <span className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] animate-pulse-slow">
              2026
            </span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto animate-fade-in leading-relaxed">
            National Level Intercollege Tech Event
          </p>

          <p className="text-base sm:text-lg text-cyan-400 mb-8 animate-fade-in-delay font-medium">
            Sathyabama Institute of Science and Technology
          </p>

          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="flex items-center space-x-3 px-6 py-3 bg-gray-900/50 border border-cyan-500/20 rounded-lg backdrop-blur-sm">
              <Calendar className="w-5 h-5 text-cyan-400" />
              <div className="text-left">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Date</p>
                <p className="text-white font-semibold">March 15-17, 2026</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 px-6 py-3 bg-gray-900/50 border border-cyan-500/20 rounded-lg backdrop-blur-sm">
              <MapPin className="w-5 h-5 text-cyan-400" />
              <div className="text-left">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Venue</p>
                <p className="text-white font-semibold">SIST Campus, Chennai</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg backdrop-blur-sm">
              <Trophy className="w-5 h-5 text-orange-400" />
              <div className="text-left">
                <p className="text-xs text-orange-300 uppercase tracking-wider">Prize Pool</p>
                <p className="text-white font-bold text-lg">₹1,34,000</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              to="/register"
              className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              <span>Register Now</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>

            <Link
              to="/events"
              className="px-8 py-4 border-2 border-cyan-500/50 text-cyan-400 font-bold rounded-lg hover:bg-cyan-500/10 hover:border-cyan-400 transition-all duration-300 transform hover:scale-105"
            >
              View Events
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Users, label: '500+ Participants', value: 'Expected' },
              { icon: Trophy, label: '6 Events', value: '5 Tech + 1 Gaming' },
              { icon: Zap, label: '2 Days', value: 'Non-stop Action' },
            ].map((stat, index) => (
              <div
                key={index}
                className="p-6 bg-gradient-to-br from-gray-900/50 to-black/50 border border-cyan-500/20 rounded-xl backdrop-blur-sm hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 transform hover:-translate-y-1"
              >
                <stat.icon className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                <p className="text-2xl font-bold text-white mb-1">{stat.label}</p>
                <p className="text-sm text-gray-400">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-8 h-12 border-2 border-cyan-400/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </section>

      <section className="relative py-20 px-4 bg-gradient-to-b from-black via-gray-900/50 to-black">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">
              About ROBOYUDH
            </span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-blue-600 mx-auto mb-12"></div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 bg-gradient-to-br from-gray-900/80 to-black/80 border border-cyan-500/20 rounded-xl backdrop-blur-sm">
              <h3 className="text-2xl font-bold text-cyan-400 mb-4">The Challenge</h3>
              <p className="text-gray-400 leading-relaxed">
                ROBOYUDH is a premier national-level robotics and technology competition that brings together the brightest minds from colleges across India. Compete in cutting-edge events that test your technical prowess, creativity, and problem-solving abilities.
              </p>
            </div>

            <div className="p-8 bg-gradient-to-br from-gray-900/80 to-black/80 border border-cyan-500/20 rounded-xl backdrop-blur-sm">
              <h3 className="text-2xl font-bold text-orange-400 mb-4">The Opportunity</h3>
              <p className="text-gray-400 leading-relaxed">
                With a massive prize pool of ₹1,34,000 and recognition at the national level, ROBOYUDH 2026 offers you the platform to showcase your talent, network with industry leaders, and take your first step towards becoming the next generation of tech innovators.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-12">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">
              Event Highlights
            </span>
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-3 text-center text-gray-400 py-12">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="col-span-3 text-center text-gray-400 py-12">No events available</div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="group bg-gradient-to-br from-gray-900/80 to-black/80 border border-cyan-500/20 rounded-xl hover:border-cyan-400/50 hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
                >
                  <div className="relative w-full h-48 overflow-hidden">
                    <img 
                      src={event.image_url} 
                      alt={event.name}
                      className="w-full h-full object-contain bg-black transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-3">{event.name}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{event.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <Link
            to="/events"
            className="inline-block mt-12 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105"
          >
            Explore All Events
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
