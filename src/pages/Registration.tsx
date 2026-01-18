import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface Event {
  id: string;
  name: string;
  registration_fee: number;
}

interface TeamMember {
  name: string;
  email?: string;
  phone?: string;
}

interface TeamFormData {
  team_name: string;
  phone_number: string;
  team_members: TeamMember[];
}

const Registration: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();

  const [event, setEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<TeamFormData>({
    team_name: '',
    phone_number: '',
    team_members: [{ name: '', email: '', phone: '' }],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Check auth on mount
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Fetch event details
  useEffect(() => {
    if (!eventId) {
      setError('Event ID not found');
      setLoading(false);
      return;
    }

    const fetchEvent = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('events')
          .select('id, name, registration_fee')
          .eq('id', eventId)
          .single();

        if (fetchError || !data) {
          setError('Event not found');
          return;
        }

        setEvent(data);
      } catch (err) {
        setError('Failed to load event');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  // Handle team name change
  const handleTeamNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, team_name: value }));
  };

  // Handle phone number change (10 digits only)
  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, phone_number: cleaned }));
  };

  // Handle team member field change
  const handleMemberChange = (index: number, field: keyof TeamMember, value: string) => {
    const newMembers = [...formData.team_members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setFormData(prev => ({ ...prev, team_members: newMembers }));
  };

  // Add another member field
  const addMemberField = () => {
    setFormData(prev => ({
      ...prev,
      team_members: [...prev.team_members, { name: '', email: '', phone: '' }],
    }));
  };

  // Remove member field
  const removeMemberField = (index: number) => {
    if (formData.team_members.length > 1) {
      setFormData(prev => ({
        ...prev,
        team_members: prev.team_members.filter((_, i) => i !== index),
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('User not authenticated');
      return;
    }

    if (!event) {
      setError('Event not found');
      return;
    }

    // Validate inputs
    if (!formData.team_name.trim()) {
      setError('Team name is required');
      return;
    }

    if (!/^\d{10}$/.test(formData.phone_number)) {
      setError('Phone number must be exactly 10 digits');
      return;
    }

    const validMembers = formData.team_members.filter(m => m.name.trim());
    if (validMembers.length === 0) {
      setError('At least one team member name is required');
      return;
    }

    setSubmitting(true);

    try {
      // Step 1: Create team record
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({
          event_id: event.id,
          user_id: user.id,
          team_name: formData.team_name,
          phone_number: formData.phone_number,
        })
        .select()
        .single();

      if (teamError || !teamData) {
        setError('Failed to create team');
        setSubmitting(false);
        return;
      }

      // Step 2: Create team members records
      const membersData = validMembers.map(m => ({
        team_id: teamData.id,
        name: m.name,
        email: m.email || null,
        phone: m.phone || null,
      }));

      const { error: membersError } = await supabase
        .from('team_members')
        .insert(membersData);

      if (membersError) {
        setError('Failed to add team members');
        setSubmitting(false);
        return;
      }

      // Step 3: Create registration record
      const { data: registrationData, error: registrationError } = await supabase
        .from('registrations')
        .insert({
          team_id: teamData.id,
          event_id: event.id,
          user_id: user.id,
          status: 'ACTIVE',
        })
        .select()
        .single();

      if (registrationError || !registrationData) {
        setError('Failed to create registration');
        setSubmitting(false);
        return;
      }

      // Step 4: Create payment record
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert({
          team_id: teamData.id,
          event_id: event.id,
          user_id: user.id,
          amount: event.registration_fee,
          status: 'PENDING',
        })
        .select()
        .single();

      if (paymentError || !paymentData) {
        setError('Failed to create payment record');
        setSubmitting(false);
        return;
      }

      // Success: Redirect to payment page
      setSubmitting(false);
      navigate(`/payment/${paymentData.id}`);
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !submitting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Event information not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Registration</h1>
        <p className="text-gray-600 mb-8">{event.name}</p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <p className="text-gray-700 mb-2">
            <span className="font-semibold">Registration Fee:</span> ₹{event.registration_fee}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Team Name */}
          <div>
            <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-2">
              Team Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="teamName"
              value={formData.team_name}
              onChange={(e) => handleTeamNameChange(e.target.value)}
              placeholder="Enter your team name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number <span className="text-red-600">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone_number}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="10-digit phone number"
              maxLength={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Team Members */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Members</h2>
            <div className="space-y-4">
              {formData.team_members.map((member, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-gray-700">Member {index + 1}</h3>
                    {formData.team_members.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMemberField(index)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                      placeholder="Full name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="email"
                      value={member.email || ''}
                      onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                      placeholder="Email (optional)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="tel"
                      value={member.phone || ''}
                      onChange={(e) => handleMemberChange(index, 'phone', e.target.value)}
                      placeholder="Phone (optional)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addMemberField}
              className="mt-4 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              + Add Another Member
            </button>
            <p className="text-xs text-gray-500 mt-4">At least one team member name is required</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              disabled={submitting}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {submitting ? 'Submitting...' : 'Continue to Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Registration;

