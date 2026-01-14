import { useState, useEffect } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  fetchAllTeams,
  fetchAllPayments,
  getRegistrationStats,
  fetchEvents,
  createLeaderboardEntry,
  createOnSpotRegistration,
  fetchTeamMembers,
  fetchRegistrationDetails,
  Event,
  Team,
  Payment,
  TeamMember,
  RegistrationDetails,
} from '../lib/db';
import {
  LayoutDashboard,
  Users,
  Trophy,
  IndianRupee,
  CheckCircle,
  Clock,
  MapPin,
  AlertCircle,
  Download,
  Search,
  ChevronDown,
} from 'lucide-react';

interface DashboardStats {
  totalRegistrations: number;
  totalParticipants: number;
  paidRegistrations: number;
  unpaidRegistrations: number;
  totalRevenue: number;
  pendingRevenue: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'registrations' | 'leaderboard' | 'onspot'>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Registration Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEvent, setFilterEvent] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCollege, setFilterCollege] = useState<string>('');
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember[]>>({});
  const [teamDetails, setTeamDetails] = useState<Record<string, RegistrationDetails | null>>({});
  const [loadingMembers, setLoadingMembers] = useState<string | null>(null);

  // On-Spot Registration Form State
  const [onSpotForm, setOnSpotForm] = useState({
    eventId: '',
    teamName: '',
    collegeName: '',
    teamSize: '1',
    memberNames: [''],
  });
  const [onSpotSubmitting, setOnSpotSubmitting] = useState(false);

  // Leaderboard State
  const [leaderboardForm, setLeaderboardForm] = useState({
    eventId: '',
    teamId: '',
    score: '',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdmin) {
      navigate('/');
      return;
    }

    loadDashboard();
  }, [user, isAdmin, authLoading, navigate]);

  // Filter and search teams
  const getFilteredTeams = () => {
    return teams.filter(team => {
      const matchesSearch = team.team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            team.college_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesEvent = !filterEvent || team.event_id === filterEvent;
      const matchesCollege = !filterCollege || team.college_name === filterCollege;
      
      let matchesStatus = true;
      if (filterStatus) {
        const payment = payments.find(p => p.team_id === team.id);
        matchesStatus = filterStatus === 'paid' ? payment?.status === 'paid' : payment?.status !== 'paid';
      }

      return matchesSearch && matchesEvent && matchesCollege && matchesStatus;
    });
  };

  // Get unique colleges for filter
  const uniqueColleges = [...new Set(teams.map(t => t.college_name))];

  // Load team members when expanding
  const handleExpandTeam = async (teamId: string) => {
    if (expandedTeam === teamId) {
      setExpandedTeam(null);
      return;
    }

    setExpandedTeam(teamId);
    
    // Load members and details if not already loaded
    if (!teamMembers[teamId] || !teamDetails[teamId]) {
      setLoadingMembers(teamId);
      try {
        const [members, details] = await Promise.all([
          fetchTeamMembers(teamId),
          fetchRegistrationDetails(teamId)
        ]);
        setTeamMembers(prev => ({ ...prev, [teamId]: members }));
        setTeamDetails(prev => ({ ...prev, [teamId]: details }));
      } catch (error) {
        console.error('Failed to load team data:', error);
      } finally {
        setLoadingMembers(null);
      }
    }
  };

  // Export CSV Function
  const handleExportCSV = async () => {
    try {
      const filteredTeams = getFilteredTeams();
      
      // Load all team members for filtered teams
      const teamsWithMembers = await Promise.all(
        filteredTeams.map(async (team) => {
          const members = teamMembers[team.id] || await fetchTeamMembers(team.id);
          const payment = payments.find(p => p.team_id === team.id);
          const event = events.find(e => e.id === team.event_id);
          // ✅ SECURITY: Always fetch registration details from Supabase (RLS enforced)
          // ✅ No reliance on insecure localStorage
          const extendedData = teamDetails[team.id] || null;
          
          return {
            team,
            members,
            payment,
            event,
            extendedData
          };
        })
      );

      // CSV Headers
      const headers = [
        'Team Name',
        'College Name',
        'Event',
        'Category',
        'Team Size',
        'Team Leader',
        'Member Names',
        'Full Name',
        'Gender',
        'Mobile Number',
        'Email',
        'City',
        'State',
        'Department',
        'Year of Study',
        'Registration Date',
        'Amount',
        'Payment Status'
      ];

      // CSV Rows
      const rows = teamsWithMembers.map(({ team, members, payment, event, extendedData }) => {
        const memberNames = members.map(m => m.member_name).join('; ');
        
        return [
          team.team_name,
          team.college_name,
          event?.name || 'N/A',
          event?.category || 'N/A',
          team.team_size,
          extendedData?.team_leader_name || 'N/A',
          memberNames || 'N/A',
          extendedData?.full_name || 'N/A',
          extendedData?.gender || 'N/A',
          extendedData?.mobile_number || 'N/A',
          extendedData?.email || 'N/A',
          extendedData?.city || 'N/A',
          extendedData?.state || 'N/A',
          extendedData?.department || 'N/A',
          extendedData?.year_of_study ? `${extendedData.year_of_study}${extendedData.year_of_study === '1' ? 'st' : extendedData.year_of_study === '2' ? 'nd' : extendedData.year_of_study === '3' ? 'rd' : 'th'} Year` : 'N/A',
          new Date(team.created_at).toLocaleDateString('en-IN'),
          `₹${payment?.amount || 0}`,
          payment?.status === 'paid' ? 'Paid' : 'Pending'
        ];
      });

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `ROBOYUDH_2026_Registrations_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, eventsData, teamsData, paymentsData] = await Promise.all([
        getRegistrationStats(),
        fetchEvents(),
        fetchAllTeams(),
        fetchAllPayments(),
      ]);

      setStats(statsData);
      setEvents(eventsData);
      setTeams(teamsData);
      setPayments(paymentsData);

      if (eventsData.length > 0 && !selectedEventId) {
        setSelectedEventId(eventsData[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOnSpotMemberChange = (index: number, value: string) => {
    const updated = [...onSpotForm.memberNames];
    updated[index] = value;
    setOnSpotForm({ ...onSpotForm, memberNames: updated });
  };

  const handleOnSpotTeamSizeChange = (size: number) => {
    const updated = Array(size).fill('').map((_, i) => onSpotForm.memberNames[i] || '');
    setOnSpotForm({ ...onSpotForm, teamSize: size.toString(), memberNames: updated });
  };

  const handleOnSpotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSpotForm.eventId || !onSpotForm.collegeName || onSpotForm.memberNames.some(n => !n.trim())) {
      setError('Please fill all required fields');
      return;
    }

    setOnSpotSubmitting(true);
    try {
      await createOnSpotRegistration(
        onSpotForm.eventId,
        onSpotForm.teamName || onSpotForm.memberNames[0],
        onSpotForm.collegeName,
        parseInt(onSpotForm.teamSize),
        onSpotForm.memberNames,
        parseInt(onSpotForm.teamSize) * 200
      );

      setOnSpotForm({
        eventId: '',
        teamName: '',
        collegeName: '',
        teamSize: '1',
        memberNames: [''],
      });

      loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create on-spot registration');
    } finally {
      setOnSpotSubmitting(false);
    }
  };

  const handleAddLeaderboardEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaderboardForm.eventId || !leaderboardForm.teamId || !leaderboardForm.score) {
      setError('Please fill all fields');
      return;
    }

    try {
      await createLeaderboardEntry(
        leaderboardForm.eventId,
        leaderboardForm.teamId,
        parseInt(leaderboardForm.score)
      );
      setLeaderboardForm({ eventId: '', teamId: '', score: '' });
      loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add leaderboard entry');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative flex pt-16">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 min-h-screen bg-gradient-to-b from-gray-900 to-black border-r border-cyan-500/20 p-6 pt-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">
              Admin Panel
            </h2>
            <p className="text-xs text-gray-500 mt-1">roboyudh.admin@gmail.com</p>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-400'
                  : 'text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('registrations')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'registrations'
                  ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-400'
                  : 'text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Registrations</span>
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'leaderboard'
                  ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-400'
                  : 'text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400'
              }`}
            >
              <Trophy className="w-5 h-5" />
              <span>Leaderboard</span>
            </button>
            <button
              onClick={() => setActiveTab('onspot')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'onspot'
                  ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-400'
                  : 'text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400'
              }`}
            >
              <MapPin className="w-5 h-5" />
              <span>On-Spot Reg</span>
            </button>
          </nav>
        </aside>

        <main className="flex-1 p-6 lg:p-12 pt-24">
          <div className="max-w-7xl mx-auto">
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300">{error}</p>
              </div>
            )}

            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && stats && (
              <div>
                <h1 className="text-4xl font-bold text-white mb-8">Dashboard Overview</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="p-6 bg-gradient-to-br from-gray-900 to-black border border-cyan-500/20 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <Users className="w-8 h-8 text-cyan-400" />
                    </div>
                    <p className="text-gray-400 text-sm mb-1">Total Registrations</p>
                    <p className="text-3xl font-bold text-white">{stats.totalRegistrations}</p>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-gray-900 to-black border border-green-500/20 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <IndianRupee className="w-8 h-8 text-green-400" />
                    </div>
                    <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-white">₹{stats.totalRevenue.toLocaleString()}</p>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-gray-900 to-black border border-orange-500/20 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <Clock className="w-8 h-8 text-orange-400" />
                    </div>
                    <p className="text-gray-400 text-sm mb-1">Pending Revenue</p>
                    <p className="text-3xl font-bold text-white">₹{stats.pendingRevenue.toLocaleString()}</p>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-gray-900 to-black border border-purple-500/20 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <Users className="w-8 h-8 text-purple-400" />
                    </div>
                    <p className="text-gray-400 text-sm mb-1">Total Participants</p>
                    <p className="text-3xl font-bold text-white">{stats.totalParticipants}</p>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-gray-900 to-black border border-cyan-500/20 rounded-xl">
                  <h3 className="text-xl font-bold text-cyan-400 mb-4">Payment Status</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-black/50 rounded-lg">
                      <p className="text-gray-400 text-sm mb-2">Paid</p>
                      <p className="text-2xl font-bold text-green-400">{stats.paidRegistrations}</p>
                    </div>
                    <div className="p-4 bg-black/50 rounded-lg">
                      <p className="text-gray-400 text-sm mb-2">Unpaid</p>
                      <p className="text-2xl font-bold text-orange-400">{stats.unpaidRegistrations}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Registrations Tab */}
            {activeTab === 'registrations' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-4xl font-bold text-white">All Registrations</h1>
                  <button 
                    onClick={handleExportCSV}
                    className="flex items-center space-x-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-cyan-500/20 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export CSV</span>
                  </button>
                </div>

                {/* Filters Section */}
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search team or college..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  {/* Event Filter */}
                  <select
                    value={filterEvent}
                    onChange={(e) => setFilterEvent(e.target.value)}
                    className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="">All Events</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>{event.name}</option>
                    ))}
                  </select>

                  {/* College Filter */}
                  <select
                    value={filterCollege}
                    onChange={(e) => setFilterCollege(e.target.value)}
                    className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="">All Colleges</option>
                    {uniqueColleges.map(college => (
                      <option key={college} value={college}>{college}</option>
                    ))}
                  </select>

                  {/* Status Filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="">All Status</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                {/* Results Count */}
                <div className="mb-4 text-sm text-gray-400">
                  Showing {getFilteredTeams().length} of {teams.length} registrations
                </div>

                {/* Enhanced Table */}
                <div className="overflow-x-auto bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-xl">
                  <table className="w-full table-fixed">
                    <thead>
                      <tr className="border-b border-gray-700 bg-gray-800/50">
                        <th className="text-left py-4 px-6 text-cyan-400 font-semibold w-[25%]">Team Details</th>
                        <th className="text-left py-4 px-6 text-cyan-400 font-semibold w-[20%]">Event</th>
                        <th className="text-left py-4 px-6 text-cyan-400 font-semibold w-[10%]">Size</th>
                        <th className="text-left py-4 px-6 text-cyan-400 font-semibold w-[15%]">Amount</th>
                        <th className="text-left py-4 px-6 text-cyan-400 font-semibold w-[15%]">Status</th>
                        <th className="text-left py-4 px-6 text-cyan-400 font-semibold w-[15%]">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredTeams().map((team) => {
                        const payment = payments.find(p => p.team_id === team.id);
                        const event = events.find(e => e.id === team.event_id);
                        const isExpanded = expandedTeam === team.id;

                        return (
                          <React.Fragment key={team.id}>
                            <tr className="border-b border-gray-700 hover:bg-gray-800/30 transition-colors">
                              <td className="py-4 px-6">
                                <div className="space-y-1">
                                  <p className="text-white font-semibold text-base">{team.team_name}</p>
                                  <p className="text-sm text-gray-400">{team.college_name}</p>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <span className="text-gray-300">{event?.name || 'N/A'}</span>
                              </td>
                              <td className="py-4 px-6">
                                <span className="text-white font-medium">{team.team_size}</span>
                              </td>
                              <td className="py-4 px-6">
                                <span className="text-cyan-400 font-semibold text-base">₹{payment?.amount || 0}</span>
                              </td>
                              <td className="py-4 px-6">
                                {payment?.status === 'paid' ? (
                                  <span className="flex items-center gap-2 text-green-400">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="font-medium">Paid</span>
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-2 text-orange-400">
                                    <Clock className="w-4 h-4" />
                                    <span className="font-medium">Pending</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-6">
                                <button
                                  onClick={() => handleExpandTeam(team.id)}
                                  className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-all font-medium"
                                >
                                  <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                  {loadingMembers === team.id ? 'Loading...' : 'Details'}
                                </button>
                              </td>
                            </tr>

                            {/* Expanded Details Row */}
                            {isExpanded && (
                              <tr className="border-b border-gray-700 bg-gray-800/20">
                                <td colSpan={6} className="py-6 px-6">
                                  {(() => {
                                    const members = teamMembers[team.id] || [];
                                    const extendedData = teamDetails[team.id];
                                    
                                    return (
                                      <div className="grid md:grid-cols-3 gap-6">
                                        {/* Team Members Section */}
                                        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                                          <h4 className="text-cyan-400 font-semibold mb-4 text-sm uppercase flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            Team Members
                                          </h4>
                                          <div className="space-y-2">
                                            {members.length > 0 ? (
                                              members.map((member, idx) => (
                                                <div key={member.id} className="flex items-center gap-2 text-sm">
                                                  <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 text-xs font-bold">
                                                    {idx + 1}
                                                  </div>
                                                  <span className="text-gray-300">{member.member_name}</span>
                                                </div>
                                              ))
                                            ) : (
                                              <p className="text-gray-400 text-sm">Loading members...</p>
                                            )}
                                          </div>
                                        </div>

                                        {/* Team & Personal Details */}
                                        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                                          <h4 className="text-cyan-400 font-semibold mb-4 text-sm uppercase">Team & Contact Info</h4>
                                          <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                              <span className="text-gray-400">Team Name:</span>
                                              <span className="text-white font-medium">{team.team_name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-400">College:</span>
                                              <span className="text-white text-xs break-all">{team.college_name}</span>
                                            </div>
                                            {extendedData ? (
                                              <>
                                                <div className="flex justify-between">
                                                  <span className="text-gray-400">Team Leader:</span>
                                                  <span className="text-white font-medium">{extendedData.team_leader_name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-gray-400">Full Name:</span>
                                                  <span className="text-white font-medium">{extendedData.full_name}</span>
                                                </div>
                                                {extendedData.gender && (
                                                  <div className="flex justify-between">
                                                    <span className="text-gray-400">Gender:</span>
                                                    <span className="text-white capitalize">{extendedData.gender}</span>
                                                  </div>
                                                )}
                                                <div className="flex justify-between">
                                                  <span className="text-gray-400">Mobile:</span>
                                                  <span className="text-white">{extendedData.mobile_number}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-gray-400">Email:</span>
                                                  <span className="text-white text-xs break-all">{extendedData.email}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-gray-400">Location:</span>
                                                  <span className="text-white">{extendedData.city}, {extendedData.state}</span>
                                                </div>
                                              </>
                                            ) : (
                                              <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-400 text-xs">
                                                ⓘ Extended details not available for this registration
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {/* Academic & Payment Info */}
                                        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                                          <h4 className="text-cyan-400 font-semibold mb-4 text-sm uppercase">Academic & Payment Info</h4>
                                          <div className="space-y-2 text-sm">
                                            {extendedData && (
                                              <>
                                                {extendedData.department && (
                                                  <div className="flex justify-between">
                                                    <span className="text-gray-400">Department:</span>
                                                    <span className="text-white">{extendedData.department}</span>
                                                  </div>
                                                )}
                                                {extendedData.year_of_study && (
                                                  <div className="flex justify-between">
                                                    <span className="text-gray-400">Year of Study:</span>
                                                    <span className="text-white">{extendedData.year_of_study}{extendedData.year_of_study === '1' ? 'st' : extendedData.year_of_study === '2' ? 'nd' : extendedData.year_of_study === '3' ? 'rd' : 'th'} Year</span>
                                                  </div>
                                                )}
                                                <div className="h-px bg-gray-700 my-3"></div>
                                              </>
                                            )}
                                            <div className="flex justify-between">
                                              <span className="text-gray-400">Registered On:</span>
                                              <span className="text-white">{new Date(team.created_at).toLocaleDateString('en-IN')}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-400">Event:</span>
                                              <span className="text-white">{event?.name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-400">Category:</span>
                                              <span className="text-white capitalize">{event?.category}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-400">Payment Amount:</span>
                                              <span className="text-cyan-400 font-bold">₹{payment?.amount || 0}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-400">Payment Status:</span>
                                              <span className={payment?.status === 'paid' ? 'text-green-400 font-semibold' : 'text-orange-400 font-semibold'}>
                                                {payment?.status === 'paid' ? 'Paid' : 'Pending'}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>

                  {getFilteredTeams().length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No registrations found matching your filters</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Leaderboard Tab */}
            {activeTab === 'leaderboard' && (
              <div>
                <h1 className="text-4xl font-bold text-white mb-8">Manage Leaderboard</h1>

                <div className="bg-gradient-to-br from-gray-900 to-black border border-cyan-500/20 rounded-xl p-6 mb-8">
                  <h3 className="text-xl font-bold text-cyan-400 mb-4">Add Score</h3>
                  <form onSubmit={handleAddLeaderboardEntry} className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-cyan-400 font-semibold mb-2">Event</label>
                        <select
                          value={leaderboardForm.eventId}
                          onChange={(e) => setLeaderboardForm({ ...leaderboardForm, eventId: e.target.value })}
                          className="w-full px-4 py-2 bg-black border border-cyan-500/30 rounded-lg text-white focus:border-cyan-400"
                        >
                          <option value="">Select Event</option>
                          {events.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-cyan-400 font-semibold mb-2">Team</label>
                        <select
                          value={leaderboardForm.teamId}
                          onChange={(e) => setLeaderboardForm({ ...leaderboardForm, teamId: e.target.value })}
                          className="w-full px-4 py-2 bg-black border border-cyan-500/30 rounded-lg text-white focus:border-cyan-400"
                        >
                          <option value="">Select Team</option>
                          {teams.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.team_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-cyan-400 font-semibold mb-2">Score</label>
                        <input
                          type="number"
                          value={leaderboardForm.score}
                          onChange={(e) => setLeaderboardForm({ ...leaderboardForm, score: e.target.value })}
                          className="w-full px-4 py-2 bg-black border border-cyan-500/30 rounded-lg text-white focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
                    >
                      Add to Leaderboard
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* On-Spot Registration Tab */}
            {activeTab === 'onspot' && (
              <div>
                <h1 className="text-4xl font-bold text-white mb-8">On-Spot Registration</h1>

                <div className="bg-gradient-to-br from-gray-900 to-black border border-cyan-500/20 rounded-xl p-8 max-w-2xl">
                  <form onSubmit={handleOnSpotSubmit} className="space-y-4">
                    <div>
                      <label className="block text-cyan-400 font-semibold mb-2">Event *</label>
                      <select
                        value={onSpotForm.eventId}
                        onChange={(e) => setOnSpotForm({ ...onSpotForm, eventId: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-black border border-cyan-500/30 rounded-lg text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                      >
                        <option value="">Choose an event</option>
                        {events.map((event) => (
                          <option key={event.id} value={event.id}>
                            {event.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-cyan-400 font-semibold mb-2">Team/Participant Name *</label>
                      <input
                        type="text"
                        value={onSpotForm.teamName}
                        onChange={(e) => setOnSpotForm({ ...onSpotForm, teamName: e.target.value })}
                        required
                        placeholder="Enter name"
                        className="w-full px-4 py-3 bg-black border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                      />
                    </div>

                    <div>
                      <label className="block text-cyan-400 font-semibold mb-2">College Name *</label>
                      <input
                        type="text"
                        value={onSpotForm.collegeName}
                        onChange={(e) => setOnSpotForm({ ...onSpotForm, collegeName: e.target.value })}
                        required
                        placeholder="Enter college"
                        className="w-full px-4 py-3 bg-black border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                      />
                    </div>

                    <div>
                      <label className="block text-cyan-400 font-semibold mb-2">Team Size</label>
                      <select
                        value={onSpotForm.teamSize}
                        onChange={(e) => handleOnSpotTeamSizeChange(parseInt(e.target.value))}
                        className="w-full px-4 py-3 bg-black border border-cyan-500/30 rounded-lg text-white focus:border-cyan-400"
                      >
                        {[1, 2, 3, 4, 5].map((size) => (
                          <option key={size} value={size}>
                            {size} Member{size > 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-cyan-400 font-semibold mb-2">Member Names</label>
                      <div className="space-y-2">
                        {onSpotForm.memberNames.map((name, idx) => (
                          <input
                            key={idx}
                            type="text"
                            value={name}
                            onChange={(e) => handleOnSpotMemberChange(idx, e.target.value)}
                            required
                            placeholder={`Member ${idx + 1}`}
                            className="w-full px-4 py-3 bg-black border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={onSpotSubmitting}
                      className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50"
                    >
                      {onSpotSubmitting ? 'Processing...' : 'Register On-Spot'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Admin;
