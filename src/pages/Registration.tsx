import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  createTeam, 
  addTeamMembers, 
  createPayment, 
  createRegistration,
  createRegistrationDetails,
  fetchEvents, 
  fetchUserRegistrations,
  Event 
} from '../lib/db';

interface TeamMemberDetails {
  full_name: string;
  email: string;
  phone: string;
  gender: string;
  department: string;
  year_of_study: string;
  college: string;
  city: string;
  state: string;
}

interface FormData {
  teamName: string;
  collegeName: string;
  teamMembers: TeamMemberDetails[];
  declareTrue: boolean;
  agreeRules: boolean;
}

const Registration = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedEventId = searchParams.get('event');

  const [formData, setFormData] = useState<FormData>({
    teamName: '',
    collegeName: '',
    teamMembers: [],
    declareTrue: false,
    agreeRules: false,
  });

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedMember, setExpandedMember] = useState<number | null>(0);

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
        // Initialize team members based on event type
        const maxMembers = event.name === 'GameVerse' ? 2 : event.max_team_size;
        const initialMembers = Array(maxMembers).fill(null).map(() => ({
          full_name: '',
          email: '',
          phone: '',
          gender: '',
          department: '',
          year_of_study: '',
          college: '',
          city: '',
          state: '',
        }));
        setFormData(prev => ({ ...prev, teamMembers: initialMembers }));
        setExpandedMember(0);
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleMemberChange = (index: number, field: keyof TeamMemberDetails, value: string) => {
    setFormData(prev => {
      const newMembers = [...prev.teamMembers];
      newMembers[index] = {
        ...newMembers[index],
        [field]: value
      };
      return { ...prev, teamMembers: newMembers };
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.teamName.trim()) {
      newErrors.teamName = 'Team name is required';
    }

    if (!formData.collegeName.trim()) {
      newErrors.collegeName = 'College name is required';
    }

    // Get actual team members (filter empty ones)
    const actualMembers = formData.teamMembers.filter(m => m.full_name.trim());
    
    if (actualMembers.length === 0) {
      newErrors.teamMembers = 'At least one team member is required';
    } else if (selectedEvent?.name === 'GameVerse' && actualMembers.length !== 2) {
      newErrors.teamMembers = 'GameVerse requires exactly 2 members';
    } else if (selectedEvent && actualMembers.length > selectedEvent.max_team_size) {
      newErrors.teamMembers = `Maximum ${selectedEvent.max_team_size} members allowed`;
    } else if (actualMembers.length < 2) {
      newErrors.teamMembers = 'Minimum 2 members required for technical events';
    }

    // Validate each member's details
    actualMembers.forEach((member, idx) => {
      if (!member.full_name.trim()) {
        newErrors[`member_${idx}_name`] = 'Name is required';
      }
      if (!member.email.trim()) {
        newErrors[`member_${idx}_email`] = 'Email is required';
      } else if (!validateEmail(member.email)) {
        newErrors[`member_${idx}_email`] = 'Invalid email format';
      }
      if (!member.phone.trim()) {
        newErrors[`member_${idx}_phone`] = 'Phone is required';
      } else if (!validatePhone(member.phone)) {
        newErrors[`member_${idx}_phone`] = 'Phone must be 10 digits';
      }
      if (!member.gender) {
        newErrors[`member_${idx}_gender`] = 'Gender is required';
      }
      if (!member.department.trim()) {
        newErrors[`member_${idx}_department`] = 'Department is required';
      }
      if (!member.year_of_study) {
        newErrors[`member_${idx}_year`] = 'Year of study is required';
      }
      if (!member.college.trim()) {
        newErrors[`member_${idx}_college`] = 'College is required';
      }
      if (!member.city.trim()) {
        newErrors[`member_${idx}_city`] = 'City is required';
      }
      if (!member.state.trim()) {
        newErrors[`member_${idx}_state`] = 'State is required';
      }
    });

    if (!formData.declareTrue) {
      newErrors.declareTrue = 'You must confirm the information is true';
    }
    if (!formData.agreeRules) {
      newErrors.agreeRules = 'You must agree to the event rules';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEvent || !user) {
      setError('Event or user not selected');
      return;
    }

    if (!validateForm()) {
      setError('Please fill in all required fields correctly');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get actual team members (filter empty ones)
      const actualMembers = formData.teamMembers.filter(m => m.full_name.trim());

      // Pre-check: ensure user hasn't already registered for this event
      try {
        const existing = await fetchUserRegistrations();
        const already = existing.some((r: any) => r.event_id === selectedEvent.id);
        if (already) {
          setError('You have already registered for this event');
          setIsSubmitting(false);
          return;
        }
      } catch (e) {
        console.warn('Could not verify existing registrations before submit', e);
      }

      // Step 1: Create team
      const team = await createTeam({
        event_id: selectedEvent.id,
        user_id: user.id,
        team_name: formData.teamName,
        college_name: formData.collegeName,
        phone_number: actualMembers[0].phone, // Use first member's phone
        team_size: actualMembers.length,
        is_onspot: false,
      });

      // Step 2: Add all team members with their personal details
      const memberNames = actualMembers.map(m => m.full_name);
      await addTeamMembers(team.id, memberNames);

      // Step 3: Create registration record
      await createRegistration(team.id, selectedEvent.id, user.id);

      // Step 4: Save registration details (using first member's details for compatibility)
      await createRegistrationDetails({
        team_id: team.id,
        team_leader_name: actualMembers[0].full_name,
        full_name: actualMembers[0].full_name,
        gender: actualMembers[0].gender || null,
        mobile_number: actualMembers[0].phone,
        email: actualMembers[0].email,
        college_name: formData.collegeName || null,
        city: actualMembers[0].city,
        state: actualMembers[0].state,
        department: actualMembers[0].department || null,
        year_of_study: actualMembers[0].year_of_study || null,
      });

      // Step 5: Create payment record (status: PENDING)
      const totalAmount = actualMembers.length * selectedEvent.price_per_head;
      await createPayment(team.id, selectedEvent.id, user.id, totalAmount);

      // Show success message
      setError('');
      setIsSubmitting(false);
      alert('Registration successful! Please pay the registration fee at the event desk on the event day. Your ticket will be generated after admin approval.');
      navigate('/my-registrations');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      if (message.includes('23505') || message.includes('unique')) {
        setError('You have already registered for this event');
      } else {
        setError(message);
      }
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

  if (!selectedEvent) {
    return (
      <div className="min-h-screen bg-black pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No event selected</p>
            <button
              onClick={() => navigate('/events')}
              className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg"
            >
              Browse Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  const actualMemberCount = formData.teamMembers.filter(m => m.full_name.trim()).length;

  return (
    <div className="min-h-screen bg-black pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Register for {selectedEvent.name}</h1>
          <p className="text-gray-400">Max {selectedEvent.max_team_size} members | ₹{selectedEvent.price_per_head} per head</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Team Details */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Team Details</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Team Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.teamName}
                  onChange={(e) => handleInputChange('teamName', e.target.value)}
                  placeholder="Enter team name"
                  className={`w-full px-4 py-3 bg-black/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                    errors.teamName ? 'border-red-500 focus:ring-red-400/20' : 'border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-400/20'
                  }`}
                />
                {errors.teamName && <p className="text-red-400 text-sm mt-1">{errors.teamName}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  College Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.collegeName}
                  onChange={(e) => handleInputChange('collegeName', e.target.value)}
                  placeholder="Enter college name"
                  className={`w-full px-4 py-3 bg-black/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                    errors.collegeName ? 'border-red-500 focus:ring-red-400/20' : 'border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-400/20'
                  }`}
                />
                {errors.collegeName && <p className="text-red-400 text-sm mt-1">{errors.collegeName}</p>}
              </div>
            </div>
          </div>

          {/* Team Members Details */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                Team Members ({actualMemberCount}/{selectedEvent.max_team_size})
              </h2>
              {errors.teamMembers && <p className="text-red-400 text-sm">{errors.teamMembers}</p>}
            </div>

            <div className="space-y-3">
              {formData.teamMembers.map((member, index) => (
                <div key={index} className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                  {/* Member Header */}
                  <button
                    type="button"
                    onClick={() => setExpandedMember(expandedMember === index ? null : index)}
                    className="w-full px-6 py-4 hover:bg-gray-800/50 transition-colors flex justify-between items-center"
                  >
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-400">
                        {index === 0 ? '👤 Member 1 (Team Leader)' : `👤 Member ${index + 1}`}
                      </p>
                      <p className="text-white font-semibold">
                        {member.full_name || '(Enter details)'}
                      </p>
                    </div>
                    <div className={`transform transition-transform ${expandedMember === index ? 'rotate-180' : ''}`}>
                      ▼
                    </div>
                  </button>

                  {/* Member Details Form */}
                  {expandedMember === index && (
                    <div className="border-t border-gray-700 px-6 py-4 bg-black/30 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Full Name <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={member.full_name}
                            onChange={(e) => handleMemberChange(index, 'full_name', e.target.value)}
                            placeholder="As per college ID"
                            className={`w-full px-4 py-2 bg-black/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                              errors[`member_${index}_name`] ? 'border-red-500 focus:ring-red-400/20' : 'border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-400/20'
                            }`}
                          />
                          {errors[`member_${index}_name`] && <p className="text-red-400 text-xs mt-1">{errors[`member_${index}_name`]}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Email <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="email"
                            value={member.email}
                            onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                            placeholder="email@example.com"
                            className={`w-full px-4 py-2 bg-black/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                              errors[`member_${index}_email`] ? 'border-red-500 focus:ring-red-400/20' : 'border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-400/20'
                            }`}
                          />
                          {errors[`member_${index}_email`] && <p className="text-red-400 text-xs mt-1">{errors[`member_${index}_email`]}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Phone <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="tel"
                            value={member.phone}
                            onChange={(e) => handleMemberChange(index, 'phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="10-digit mobile"
                            maxLength={10}
                            className={`w-full px-4 py-2 bg-black/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                              errors[`member_${index}_phone`] ? 'border-red-500 focus:ring-red-400/20' : 'border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-400/20'
                            }`}
                          />
                          {errors[`member_${index}_phone`] && <p className="text-red-400 text-xs mt-1">{errors[`member_${index}_phone`]}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Gender <span className="text-red-400">*</span>
                          </label>
                          <select
                            value={member.gender}
                            onChange={(e) => handleMemberChange(index, 'gender', e.target.value)}
                            className={`w-full px-4 py-2 bg-black/50 border rounded-lg text-white focus:outline-none focus:ring-2 transition-all ${
                              errors[`member_${index}_gender`] ? 'border-red-500 focus:ring-red-400/20' : 'border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-400/20'
                            }`}
                          >
                            <option value="">Select...</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                          {errors[`member_${index}_gender`] && <p className="text-red-400 text-xs mt-1">{errors[`member_${index}_gender`]}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Department <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={member.department}
                            onChange={(e) => handleMemberChange(index, 'department', e.target.value)}
                            placeholder="e.g., CSE, ECE, Mech"
                            className={`w-full px-4 py-2 bg-black/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                              errors[`member_${index}_department`] ? 'border-red-500 focus:ring-red-400/20' : 'border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-400/20'
                            }`}
                          />
                          {errors[`member_${index}_department`] && <p className="text-red-400 text-xs mt-1">{errors[`member_${index}_department`]}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Year of Study <span className="text-red-400">*</span>
                          </label>
                          <select
                            value={member.year_of_study}
                            onChange={(e) => handleMemberChange(index, 'year_of_study', e.target.value)}
                            className={`w-full px-4 py-2 bg-black/50 border rounded-lg text-white focus:outline-none focus:ring-2 transition-all ${
                              errors[`member_${index}_year`] ? 'border-red-500 focus:ring-red-400/20' : 'border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-400/20'
                            }`}
                          >
                            <option value="">Select year...</option>
                            <option value="1st Year">1st Year</option>
                            <option value="2nd Year">2nd Year</option>
                            <option value="3rd Year">3rd Year</option>
                            <option value="4th Year">4th Year</option>
                          </select>
                          {errors[`member_${index}_year`] && <p className="text-red-400 text-xs mt-1">{errors[`member_${index}_year`]}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            College <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={member.college}
                            onChange={(e) => handleMemberChange(index, 'college', e.target.value)}
                            placeholder="College name"
                            className={`w-full px-4 py-2 bg-black/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                              errors[`member_${index}_college`] ? 'border-red-500 focus:ring-red-400/20' : 'border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-400/20'
                            }`}
                          />
                          {errors[`member_${index}_college`] && <p className="text-red-400 text-xs mt-1">{errors[`member_${index}_college`]}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            City <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={member.city}
                            onChange={(e) => handleMemberChange(index, 'city', e.target.value)}
                            placeholder="City"
                            className={`w-full px-4 py-2 bg-black/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                              errors[`member_${index}_city`] ? 'border-red-500 focus:ring-red-400/20' : 'border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-400/20'
                            }`}
                          />
                          {errors[`member_${index}_city`] && <p className="text-red-400 text-xs mt-1">{errors[`member_${index}_city`]}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            State <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={member.state}
                            onChange={(e) => handleMemberChange(index, 'state', e.target.value)}
                            placeholder="State"
                            className={`w-full px-4 py-2 bg-black/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                              errors[`member_${index}_state`] ? 'border-red-500 focus:ring-red-400/20' : 'border-cyan-500/30 focus:border-cyan-400 focus:ring-cyan-400/20'
                            }`}
                          />
                          {errors[`member_${index}_state`] && <p className="text-red-400 text-xs mt-1">{errors[`member_${index}_state`]}</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-300 text-sm">
              <p>💡 Each team member must fill in their personal details. Member 1 is the team leader.</p>
            </div>
          </div>

          {/* Declaration & Consent */}
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

          {/* Payment Info */}
          <div className="bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border border-yellow-700/30 rounded-xl p-6">
            <h3 className="text-lg font-bold text-yellow-300 mb-2">Payment Information</h3>
            <p className="text-gray-300 mb-2">
              Total Amount: <span className="text-2xl font-bold text-yellow-400">₹{actualMemberCount * selectedEvent.price_per_head}</span>
            </p>
            <p className="text-gray-400 text-sm">Payment will be collected at the event desk on the event day. No online payment required.</p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-5 h-5 inline-block animate-spin rounded-full border-2 border-cyan-400 border-t-transparent"></span>
                Processing...
              </>
            ) : (
              <>
                <span className="w-5 h-5 inline-block bg-green-400 rounded-full"></span>
                Register Now
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Registration;
