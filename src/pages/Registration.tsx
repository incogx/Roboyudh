import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createTeam, addTeamMembers, createPayment, fetchEvents, Event, createRegistrationDetails } from '../lib/db';

const Registration = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedEventId = searchParams.get('event');

  const [formData, setFormData] = useState({
    // Team Details
    teamName: '',
    teamLeaderName: '',
    teamMembers: ['', '', ''],
    
    // Personal Details
    fullName: '',
    gender: '',
    mobileNumber: '',
    email: '',
    collegeName: '',
    city: '',
    state: '',
    
    // Academic Details
    department: '',
    yearOfStudy: '',
    
    // Declarations
    declareTrue: false,
    agreeRules: false,
  });

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId && events.length > 0) {
      const event = events.find(e => e.id === selectedEventId);
      if (event) {
        setSelectedEvent(event);
      }
    }
  }, [selectedEventId, events]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await fetchEvents();
      setEvents(data);
    } catch (err) {
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  // Validation functions
  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validatePhone = (phone: string) => {
    const regex = /^[0-9]{10}$/;
    return regex.test(phone);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Team Details
    if (!formData.teamName.trim()) newErrors.teamName = 'Team name is required';
    if (!formData.teamLeaderName.trim()) newErrors.teamLeaderName = 'Team leader name is required';
    
    // Personal Details
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.mobileNumber.trim()) newErrors.mobileNumber = 'Mobile number is required';
    else if (!validatePhone(formData.mobileNumber)) newErrors.mobileNumber = 'Mobile number must be 10 digits';
    
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!validateEmail(formData.email)) newErrors.email = 'Invalid email format';
    
    if (!formData.collegeName.trim()) newErrors.collegeName = 'College name is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    
    // Academic Details
    if (!formData.department.trim()) newErrors.department = 'Department is required';
    if (!formData.yearOfStudy) newErrors.yearOfStudy = 'Year of study is required';
    
    // Declarations
    if (!formData.declareTrue) newErrors.declareTrue = 'You must confirm the details are true';
    if (!formData.agreeRules) newErrors.agreeRules = 'You must agree to follow event rules';
    
    // Team members - at least team leader
    const validMembers = formData.teamMembers.filter(m => m.trim());
    if (validMembers.length === 0) newErrors.teamMembers = 'Add at least one team member';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleMemberChange = (index: number, value: string) => {
    const newMembers = [...formData.teamMembers];
    newMembers[index] = value;
    setFormData(prev => ({ ...prev, teamMembers: newMembers }));
  };

  const addMemberField = () => {
    if (formData.teamMembers.length < (selectedEvent?.max_team_size || 5)) {
      setFormData(prev => ({
        ...prev,
        teamMembers: [...prev.teamMembers, '']
      }));
    }
  };

  const removeMemberField = (index: number) => {
    if (formData.teamMembers.length > 1) {
      setFormData(prev => ({
        ...prev,
        teamMembers: prev.teamMembers.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !selectedEvent) {
      setError('Please fix all errors before submitting');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Team leader is always the first member
      const validMembers = formData.teamMembers.filter(m => m.trim());
      const allMembers = [formData.teamLeaderName, ...validMembers]; // Leader + additional members
      const totalTeamSize = allMembers.length; // 1 (leader) + additional members

      // Create team
      const team = await createTeam({
        event_id: selectedEvent.id,
        team_name: formData.teamName,
        college_name: formData.collegeName,
        team_size: totalTeamSize,
        created_by: user!.id,
        is_onspot: false,
      });

      // Add all team members (including leader)
      await addTeamMembers(team.id, allMembers);

      // Save registration details to database
      await createRegistrationDetails({
        team_id: team.id,
        team_leader_name: formData.teamLeaderName,
        full_name: formData.fullName,
        gender: formData.gender || null,
        mobile_number: formData.mobileNumber,
        email: formData.email,
        college_name: formData.collegeName || null,
        city: formData.city,
        state: formData.state,
        department: formData.department || null,
        year_of_study: formData.yearOfStudy || null,
      });

      // Create payment record (status: unpaid)
      const totalAmount = totalTeamSize * selectedEvent.price_per_head;
      const payment = await createPayment(team.id, totalAmount);

      // DO NOT create ticket yet - only after successful payment

      // Store in session storage with ALL form data for payment page
      sessionStorage.setItem(
        'registrationData',
        JSON.stringify({
          team_id: team.id,
          payment_id: payment.id,
          eventName: selectedEvent.name,
          teamName: formData.teamName,
          collegeName: team.college_name,
          teamSize: totalTeamSize,
          memberNames: allMembers,
          amount: totalAmount,
          paymentStatus: 'unpaid',
          createdAt: new Date().toISOString(),
          // Extended registration data
          formData: {
            teamName: formData.teamName,
            teamLeaderName: formData.teamLeaderName,
            fullName: formData.fullName,
            gender: formData.gender,
            mobileNumber: formData.mobileNumber,
            email: formData.email,
            collegeName: formData.collegeName,
            city: formData.city,
            state: formData.state,
            department: formData.department,
            yearOfStudy: formData.yearOfStudy,
          }
        })
      );

      // ✅ SECURITY: Registration data is now stored ONLY in Supabase registration_details table
      // ✅ No sensitive data stored in localStorage
      // Admin can access via fetchRegistrationDetails() which enforces RLS

      // Redirect to payment page
      navigate('/payment');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-16 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">
              Event Registration
            </span>
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-blue-600 mx-auto mb-6"></div>
          <p className="text-xl text-gray-400">Complete your team registration form</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Important Notice - Read Event Details */}
          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/50 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-yellow-400 mb-2">⚠️ Important: Read Event Details First!</h3>
                <p className="text-gray-300 mb-4">
                  Before registering, you <span className="font-bold text-yellow-300">must read the complete event details, rules, and regulations</span>. 
                  Each event has specific requirements and guidelines that you need to follow.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/events')}
                  className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-all inline-flex items-center gap-2"
                >
                  📋 View All Event Details & Rules
                </button>
              </div>
            </div>
          </div>

          {/* Event Selection */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Select Event</h2>
            <select
              value={selectedEvent?.id || ''}
              onChange={(e) => {
                const event = events.find(ev => ev.id === e.target.value);
                setSelectedEvent(event || null);
              }}
              className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            >
              <option value="">Choose an event...</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.name} - ₹{event.price_per_head} per head
                </option>
              ))}
            </select>
          </div>

          {selectedEvent && (
            <>
              {/* Team Details Section */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Team Details</h2>
                
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Team Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.teamName}
                    onChange={(e) => handleInputChange('teamName', e.target.value)}
                    placeholder="Enter your team name (e.g., Tech Warriors, Code Ninjas)"
                    className={`w-full px-4 py-3 bg-black/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                      errors.teamName ? 'border-red-500 focus:ring-red-400/20' : 'border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-400/20'
                    }`}
                  />
                  {errors.teamName && <p className="text-red-400 text-sm mt-1">{errors.teamName}</p>}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Team Leader Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.teamLeaderName}
                    onChange={(e) => handleInputChange('teamLeaderName', e.target.value)}
                    placeholder="Enter team leader name"
                    className={`w-full px-4 py-3 bg-black/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                      errors.teamLeaderName ? 'border-red-500 focus:ring-red-400/20' : 'border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-400/20'
                    }`}
                  />
                  {errors.teamLeaderName && <p className="text-red-400 text-sm mt-1">{errors.teamLeaderName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    Team Members (Max {selectedEvent.max_team_size}) <span className="text-red-400">*</span>
                  </label>
                  <div className="space-y-2">
                    {formData.teamMembers.map((member, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={member}
                          onChange={(e) => handleMemberChange(index, e.target.value)}
                          placeholder={`Member ${index + 1} name`}
                          className="flex-1 px-4 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                        />
                        {formData.teamMembers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMemberField(index)}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {errors.teamMembers && <p className="text-red-400 text-sm mt-2">{errors.teamMembers}</p>}
                  
                  {formData.teamMembers.length < selectedEvent.max_team_size && (
                    <button
                      type="button"
                      onClick={addMemberField}
                      className="mt-3 flex items-center gap-2 px-4 py-2 text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add Member
                    </button>
                  )}
                </div>
              </div>

              {/* Personal Details Section */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Personal Details</h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="As per college ID"
                      className={`w-full px-4 py-3 bg-black/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                        errors.fullName ? 'border-red-500 focus:ring-red-400/20' : 'border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-400/20'
                      }`}
                    />
                    {errors.fullName && <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-4 py-3 bg-black/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                    >
                      <option value="">Select...</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Mobile Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.mobileNumber}
                      onChange={(e) => handleInputChange('mobileNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      className={`w-full px-4 py-3 bg-black/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                        errors.mobileNumber ? 'border-red-500 focus:ring-red-400/20' : 'border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-400/20'
                      }`}
                    />
                    {errors.mobileNumber && <p className="text-red-400 text-sm mt-1">{errors.mobileNumber}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Email ID <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="your.email@example.com"
                      className={`w-full px-4 py-3 bg-black/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                        errors.email ? 'border-red-500 focus:ring-red-400/20' : 'border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-400/20'
                      }`}
                    />
                    {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      College Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.collegeName}
                      onChange={(e) => handleInputChange('collegeName', e.target.value)}
                      placeholder="Your college/institution name"
                      className={`w-full px-4 py-3 bg-black/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                        errors.collegeName ? 'border-red-500 focus:ring-red-400/20' : 'border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-400/20'
                      }`}
                    />
                    {errors.collegeName && <p className="text-red-400 text-sm mt-1">{errors.collegeName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      City <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="City"
                      className={`w-full px-4 py-3 bg-black/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                        errors.city ? 'border-red-500 focus:ring-red-400/20' : 'border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-400/20'
                      }`}
                    />
                    {errors.city && <p className="text-red-400 text-sm mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      State <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="State"
                      className={`w-full px-4 py-3 bg-black/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                        errors.state ? 'border-red-500 focus:ring-red-400/20' : 'border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-400/20'
                      }`}
                    />
                    {errors.state && <p className="text-red-400 text-sm mt-1">{errors.state}</p>}
                  </div>
                </div>
              </div>

              {/* Academic Details Section */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Academic Details</h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Department / Branch <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      placeholder="e.g., Computer Science"
                      className={`w-full px-4 py-3 bg-black/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                        errors.department ? 'border-red-500 focus:ring-red-400/20' : 'border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-400/20'
                      }`}
                    />
                    {errors.department && <p className="text-red-400 text-sm mt-1">{errors.department}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Year of Study <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.yearOfStudy}
                      onChange={(e) => handleInputChange('yearOfStudy', e.target.value)}
                      className={`w-full px-4 py-3 bg-black/50 border rounded-lg text-white focus:outline-none focus:ring-2 transition-all ${
                        errors.yearOfStudy ? 'border-red-500 focus:ring-red-400/20' : 'border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-400/20'
                      }`}
                    >
                      <option value="">Select year...</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                    {errors.yearOfStudy && <p className="text-red-400 text-sm mt-1">{errors.yearOfStudy}</p>}
                  </div>
                </div>
              </div>

              {/* Declaration & Consent Section */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Declaration & Consent</h2>
                
                <div className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer p-3 hover:bg-gray-800/50 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.declareTrue}
                      onChange={(e) => handleInputChange('declareTrue', e.target.checked)}
                      className="w-5 h-5 mt-0.5 accent-cyan-400 cursor-pointer"
                    />
                    <span className="text-gray-300">
                      I confirm that the details provided are <span className="font-semibold">true and valid</span>. <span className="text-red-400">*</span>
                    </span>
                  </label>
                  {errors.declareTrue && <p className="text-red-400 text-sm">{errors.declareTrue}</p>}

                  <label className="flex items-start gap-3 cursor-pointer p-3 hover:bg-gray-800/50 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.agreeRules}
                      onChange={(e) => handleInputChange('agreeRules', e.target.checked)}
                      className="w-5 h-5 mt-0.5 accent-cyan-400 cursor-pointer"
                    />
                    <span className="text-gray-300">
                      I have <span className="font-bold text-cyan-400">read and understood the complete event details, rules, and regulations</span> and agree to follow them along with college discipline. <span className="text-red-400">*</span>
                    </span>
                  </label>
                  {errors.agreeRules && <p className="text-red-400 text-sm">{errors.agreeRules}</p>}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Register Now
                  </>
                )}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

export default Registration;

