import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/events', label: 'Events' },
    { path: '/leaderboard', label: 'Leaderboard' },
    { path: '/register', label: 'Register' },
  ];

  const userNavLinks = [
    { path: '/', label: 'Home' },
    { path: '/events', label: 'Events' },
    { path: '/my-registrations', label: 'My Tickets' },
    { path: '/leaderboard', label: 'Leaderboard' },
    { path: '/register', label: 'Register' },
  ];

  const adminNavLinks = [
    { path: '/admin', label: 'Dashboard' },
    { path: '/leaderboard', label: 'Leaderboard' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await signOut();
    setIsOpen(false);
  };

  // Show different nav links based on user role and auth state
  const displayLinks = user && isAdmin 
    ? adminNavLinks 
    : user 
    ? userNavLinks 
    : navLinks;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-gray-800/50 shadow-lg shadow-black/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-4 group">
            {/* Sathyabama Logo */}
            <div className="flex items-center space-x-2.5">
              <div className="h-12 w-12 rounded-full bg-white/90 p-1.5 overflow-hidden shadow-md shadow-cyan-500/20 ring-1 ring-cyan-500/25 transition-transform duration-300 group-hover:scale-105">
                <img 
                  src="/images/sathyabama-logo.png" 
                  alt="Sathyabama Logo" 
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-bold text-white">Sathyabama</span>
                <span className="text-xs text-gray-400">SIST</span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-12 w-px bg-gray-700/50" />

            {/* ROBOYUDH Logo */}
            <div className="flex items-center space-x-2.5">
              <img 
                src="/images/logo.png" 
                alt="ROBOYUDH Logo" 
                className="h-12 w-auto transition-transform duration-300 group-hover:scale-105"
              />
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 text-transparent bg-clip-text">
                  ROBOYUDH
                </span>
                <span className="text-xs text-gray-400 font-medium">2026</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {displayLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative text-sm font-semibold transition-all duration-200 ${
                  isActive(link.path)
                    ? 'text-cyan-400'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {link.label}
                {isActive(link.path) && (
                  <div className="absolute -bottom-6 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500"></div>
                )}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden lg:flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-lg">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-gray-300 max-w-[150px] truncate">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-5 py-2 bg-gradient-to-r from-red-600/20 to-red-700/20 border border-red-600/30 text-red-400 rounded-lg text-sm font-semibold hover:border-red-500/50 hover:bg-red-600/30 transition-all duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 inline-block"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-gray-300 hover:text-white transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-black/98 backdrop-blur-xl border-t border-gray-800/50">
          <div className="px-4 py-6 space-y-3">
            {displayLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                  isActive(link.path)
                    ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/30'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Mobile Auth Section */}
            <div className="pt-4 border-t border-gray-800">
              {user ? (
                <>
                  <div className="px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 rounded-lg mb-3">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm text-gray-300 truncate">{user.email}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 bg-gradient-to-r from-red-600/20 to-red-700/20 border border-red-600/30 text-red-400 rounded-lg text-sm font-semibold hover:border-red-500/50 transition-all"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/25 block text-center"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
