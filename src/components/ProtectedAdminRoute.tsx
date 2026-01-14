import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedAdminRouteProps {
  children: ReactNode;
}

const ProtectedAdminRoute = ({ children }: ProtectedAdminRouteProps) => {
  const { user, isAdmin, loading } = useAuth();
  const [showUnauthorized, setShowUnauthorized] = useState(false);

  useEffect(() => {
    // Show unauthorized message if user is logged in but not admin
    if (!loading && user && !isAdmin) {
      setShowUnauthorized(true);
      const timer = setTimeout(() => {
        setShowUnauthorized(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [loading, user, isAdmin]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Redirect to home if not logged in
  if (!user) {
    return (
      <>
        {showUnauthorized && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-lg shadow-lg shadow-red-500/50 animate-pulse">
            Please login to access admin dashboard
          </div>
        )}
        <Navigate to="/" replace />
      </>
    );
  }

  // Redirect to home if logged in but not admin
  if (!isAdmin) {
    return (
      <>
        {showUnauthorized && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-lg shadow-lg shadow-red-500/50 animate-pulse">
            ⚠️ Unauthorized Access - Admin privileges required
          </div>
        )}
        <Navigate to="/" replace />
      </>
    );
  }

  // User is authenticated and is admin - allow access
  return <>{children}</>;
};

export default ProtectedAdminRoute;
