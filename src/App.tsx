import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import Home from './pages/Home';
import Events from './pages/Events';
import Registration from './pages/Registration';
import Payment from './pages/Payment';
import Ticket from './pages/Ticket';
import MyRegistrations from './pages/MyRegistrations';
import Leaderboard from './pages/Leaderboard';
import Admin from './pages/Admin';
import Login from './pages/Login';
import RC_RacingDetails from './pages/RC_RacingDetails';
import RoboSumoDetails from './pages/RoboSumoDetails';
import ObstacleRunDetails from './pages/ObstacleRunDetails';
import RoboSoccerDetails from './pages/RoboSoccerDetails';
import GameVerseDetails from './pages/GameVerseDetails';
import LineFollowerDetails from './pages/LineFollowerDetails';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-black text-white">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route path="/details/rc-racing" element={<RC_RacingDetails />} />
            <Route path="/details/robo-sumo" element={<RoboSumoDetails />} />
            <Route path="/details/obstacle-run" element={<ObstacleRunDetails />} />
            <Route path="/details/robo-soccer" element={<RoboSoccerDetails />} />
            <Route path="/details/game-verse" element={<GameVerseDetails />} />
            <Route path="/details/line-follower" element={<LineFollowerDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Registration />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/ticket" element={<Ticket />} />
            <Route path="/my-registrations" element={<MyRegistrations />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <Admin />
                </ProtectedAdminRoute>
              }
            />
          </Routes>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
