/**
 * Database Helper Functions for ROBOYUDH 2026
 * Provides type-safe Supabase queries with RLS security built-in
 *
 * All functions automatically use the authenticated user's context
 * RLS policies enforce that users can only access their own data
 */

import { supabase } from './supabase';

// ============================================================
// TYPES
// ============================================================

export interface Event {
  id: string;
  name: string;
  category: 'tech' | 'non-tech';
  description: string;
  rules: string[];
  price_per_head: number;
  max_team_size: number;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  event_id: string;
  team_name: string;
  college_name: string;
  team_size: number;
  created_by: string;
  is_onspot: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  member_name: string;
  created_at: string;
}

export interface Payment {
  id: string;
  team_id: string;
  amount: number;
  status: 'paid' | 'unpaid';
  payment_ref: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  team_id: string;
  ticket_code: string;
  pdf_url: string | null;
  created_at: string;
}

export interface LeaderboardEntry {
  id: string;
  event_id: string;
  team_id: string;
  score: number;
  rank: number | null;
  updated_at: string;
  // Joined data
  event?: Event;
  team?: Team;
}

export interface RegistrationDetails {
  id: string;
  team_id: string;
  team_leader_name: string;
  full_name: string;
  gender: string | null;
  mobile_number: string;
  email: string;
  college_name: string | null;
  city: string;
  state: string;
  department: string | null;
  year_of_study: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// EVENTS - Public Read
// ============================================================

/**
 * Fetch all events (public)
 * Everyone can read events
 */
export async function fetchEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch events: ${error.message}`);
  return data || [];
}

/**
 * Fetch single event by ID (public)
 */
export async function fetchEventById(eventId: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch event: ${error.message}`);
  }
  return data || null;
}

/**
 * Create event (admin only)
 */
export async function createEvent(event: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .insert([event])
    .select()
    .single();

  if (error) throw new Error(`Failed to create event: ${error.message}`);
  return data;
}

/**
 * Update event (admin only)
 */
export async function updateEvent(eventId: string, updates: Partial<Event>): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update event: ${error.message}`);
  return data;
}

/**
 * Delete event (admin only)
 */
export async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId);

  if (error) throw new Error(`Failed to delete event: ${error.message}`);
}

// ============================================================
// TEAMS - User's Own Teams
// ============================================================

/**
 * Fetch all teams for current user
 * Users can only see their own teams
 */
export async function fetchUserTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch teams: ${error.message}`);
  return data || [];
}

/**
 * Fetch team by ID (user must be creator)
 */
export async function fetchTeamById(teamId: string): Promise<Team | null> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch team: ${error.message}`);
  }
  return data || null;
}

/**
 * Fetch teams for a specific event (current user's teams only)
 */
export async function fetchTeamsByEvent(eventId: string): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch teams: ${error.message}`);
  return data || [];
}

/**
 * Create a new team for current user
 */
export async function createTeam(team: Omit<Team, 'id' | 'created_at' | 'updated_at'>): Promise<Team> {
  const { data, error } = await supabase
    .from('teams')
    .insert([team])
    .select()
    .single();

  if (error) throw new Error(`Failed to create team: ${error.message}`);
  return data;
}

/**
 * Update team (user must be creator or admin)
 */
export async function updateTeam(teamId: string, updates: Partial<Team>): Promise<Team> {
  const { data, error } = await supabase
    .from('teams')
    .update(updates)
    .eq('id', teamId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update team: ${error.message}`);
  return data;
}

// ============================================================
// TEAM MEMBERS
// ============================================================

/**
 * Fetch members for a team (user must own the team)
 */
export async function fetchTeamMembers(teamId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to fetch team members: ${error.message}`);
  return data || [];
}

/**
 * Add member to team (user must own the team)
 */
export async function addTeamMember(teamId: string, memberName: string): Promise<TeamMember> {
  const { data, error } = await supabase
    .from('team_members')
    .insert([{ team_id: teamId, member_name: memberName }])
    .select()
    .single();

  if (error) throw new Error(`Failed to add team member: ${error.message}`);
  return data;
}

/**
 * Add multiple members to team
 */
export async function addTeamMembers(teamId: string, memberNames: string[]): Promise<TeamMember[]> {
  const members = memberNames.map(name => ({ team_id: teamId, member_name: name }));
  
  const { data, error } = await supabase
    .from('team_members')
    .insert(members)
    .select();

  if (error) throw new Error(`Failed to add team members: ${error.message}`);
  return data || [];
}

/**
 * Delete team member (user must own the team or be admin)
 */
export async function deleteTeamMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', memberId);

  if (error) throw new Error(`Failed to delete team member: ${error.message}`);
}

// ============================================================
// REGISTRATION DETAILS
// ============================================================

/**
 * Create registration details for a team
 */
export async function createRegistrationDetails(
  details: Omit<RegistrationDetails, 'id' | 'created_at' | 'updated_at'>
): Promise<RegistrationDetails> {
  const { data, error } = await supabase
    .from('registration_details')
    .insert([details])
    .select()
    .single();

  if (error) throw new Error(`Failed to create registration details: ${error.message}`);
  return data;
}

/**
 * Fetch registration details by team ID
 */
export async function fetchRegistrationDetails(teamId: string): Promise<RegistrationDetails | null> {
  const { data, error } = await supabase
    .from('registration_details')
    .select('*')
    .eq('team_id', teamId)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch registration details: ${error.message}`);
  return data;
}

/**
 * Fetch all registration details (admin only)
 */
export async function fetchAllRegistrationDetails(): Promise<RegistrationDetails[]> {
  const { data, error } = await supabase
    .from('registration_details')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch all registration details: ${error.message}`);
  return data || [];
}

// ============================================================
// PAYMENTS
// ============================================================

/**
 * Fetch payment for user's team
 */
export async function fetchPayment(teamId: string): Promise<Payment | null> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('team_id', teamId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch payment: ${error.message}`);
  }
  return data || null;
}

/**
 * Create payment record
 */
export async function createPayment(teamId: string, amount: number): Promise<Payment> {
  const { data, error } = await supabase
    .from('payments')
    .insert([{ team_id: teamId, amount, status: 'unpaid' }])
    .select()
    .single();

  if (error) throw new Error(`Failed to create payment: ${error.message}`);
  return data;
}

/**
 * Update payment status (admin only - will be enforced by RLS)
 */
export async function updatePaymentStatus(teamId: string, status: 'paid' | 'unpaid', paymentRef?: string): Promise<Payment> {
  const { data, error } = await supabase
    .from('payments')
    .update({ status, payment_ref: paymentRef })
    .eq('team_id', teamId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update payment: ${error.message}`);
  return data;
}

/**
 * Fetch all payments (admin only)
 */
export async function fetchAllPayments(): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch payments: ${error.message}`);
  return data || [];
}

/**
 * Fetch payments by status (admin only)
 */
export async function fetchPaymentsByStatus(status: 'paid' | 'unpaid'): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch payments: ${error.message}`);
  return data || [];
}

// ============================================================
// TICKETS
// ============================================================

/**
 * Fetch ticket for user's team
 */
export async function fetchTicket(teamId: string): Promise<Ticket | null> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('team_id', teamId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch ticket: ${error.message}`);
  }
  return data || null;
}

/**
 * Create ticket for team (called after successful payment)
 * Ticket code is auto-generated by trigger
 */
export async function createTicket(teamId: string, pdfUrl?: string): Promise<Ticket> {
  const { data, error } = await supabase
    .from('tickets')
    .insert([{ team_id: teamId, pdf_url: pdfUrl }])
    .select()
    .single();

  if (error) throw new Error(`Failed to create ticket: ${error.message}`);
  return data;
}

/**
 * Update ticket PDF URL
 */
export async function updateTicketPdf(ticketId: string, pdfUrl: string): Promise<Ticket> {
  const { data, error } = await supabase
    .from('tickets')
    .update({ pdf_url: pdfUrl })
    .eq('id', ticketId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update ticket: ${error.message}`);
  return data;
}

// ============================================================
// LEADERBOARD
// ============================================================

/**
 * Fetch leaderboard for specific event (public read)
 */
export async function fetchLeaderboardByEvent(eventId: string): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('event_id', eventId)
    .order('score', { ascending: false })
    .order('rank', { ascending: true });

  if (error) throw new Error(`Failed to fetch leaderboard: ${error.message}`);
  return data || [];
}

/**
 * Fetch leaderboard with team details (public read)
 */
export async function fetchLeaderboardWithTeams(eventId: string): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select(`
      id,
      event_id,
      team_id,
      score,
      rank,
      updated_at,
      teams:team_id (
        id,
        team_name,
        college_name,
        team_size
      )
    `)
    .eq('event_id', eventId)
    .order('score', { ascending: false })
    .order('rank', { ascending: true });

  if (error) throw new Error(`Failed to fetch leaderboard: ${error.message}`);
  return data || [];
}

/**
 * Create leaderboard entry (admin only)
 */
export async function createLeaderboardEntry(eventId: string, teamId: string, score: number): Promise<LeaderboardEntry> {
  const { data, error } = await supabase
    .from('leaderboard')
    .insert([{ event_id: eventId, team_id: teamId, score }])
    .select()
    .single();

  if (error) throw new Error(`Failed to create leaderboard entry: ${error.message}`);
  return data;
}

/**
 * Update score in leaderboard (admin only)
 */
export async function updateLeaderboardScore(eventId: string, teamId: string, score: number): Promise<LeaderboardEntry> {
  const { data, error } = await supabase
    .from('leaderboard')
    .update({ score })
    .eq('event_id', eventId)
    .eq('team_id', teamId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update leaderboard score: ${error.message}`);
  return data;
}

/**
 * Subscribe to leaderboard changes (real-time)
 */
export function subscribeToLeaderboard(eventId: string, callback: (entry: LeaderboardEntry) => void) {
  const subscription = supabase
    .channel(`leaderboard:${eventId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'leaderboard',
        filter: `event_id=eq.${eventId}`,
      },
      (payload) => {
        callback(payload.new as LeaderboardEntry);
      }
    )
    .subscribe();

  return subscription;
}

// ============================================================
// ADMIN - BATCH OPERATIONS
// ============================================================

/**
 * Fetch all teams (admin only)
 */
export async function fetchAllTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch teams: ${error.message}`);
  return data || [];
}

/**
 * Fetch all teams for event (admin only)
 */
export async function fetchAllTeamsByEvent(eventId: string): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch teams: ${error.message}`);
  return data || [];
}

/**
 * Fetch team with all details (admin only)
 */
export async function fetchTeamDetails(teamId: string): Promise<any> {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      team_members:team_members(*),
      payment:payments(*),
      ticket:tickets(*)
    `)
    .eq('id', teamId)
    .single();

  if (error) throw new Error(`Failed to fetch team details: ${error.message}`);
  return data || null;
}

/**
 * Create on-spot registration (admin only)
 */
export async function createOnSpotRegistration(
  eventId: string,
  teamName: string,
  collegeName: string,
  teamSize: number,
  memberNames: string[],
  amount: number
): Promise<{ team: Team; members: TeamMember[]; payment: Payment }> {
  try {
    // Get the admin user's ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Failed to get current user');

    // Create team
    const team = await createTeam({
      event_id: eventId,
      team_name: teamName,
      college_name: collegeName,
      team_size: teamSize,
      created_by: user.id,
      is_onspot: true,
    });

    // Add members
    const members = await addTeamMembers(team.id, memberNames);

    // Create payment (auto-paid for on-spot)
    const payment = await createPayment(team.id, amount);
    await updatePaymentStatus(team.id, 'paid', `ONSPOT-${Date.now()}`);

    // Create ticket
    await createTicket(team.id);

    return { team, members, payment };
  } catch (error) {
    throw new Error(`Failed to create on-spot registration: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================================
// STATS - ADMIN DASHBOARD
// ============================================================

/**
 * Get registration statistics (admin only)
 */
export async function getRegistrationStats(): Promise<{
  totalRegistrations: number;
  totalParticipants: number;
  paidRegistrations: number;
  unpaidRegistrations: number;
  totalRevenue: number;
  pendingRevenue: number;
}> {
  try {
    const [teams, payments] = await Promise.all([
      fetchAllTeams(),
      fetchAllPayments(),
    ]);

    const totalParticipants = teams.reduce((sum, team) => sum + team.team_size, 0);
    const paidPayments = payments.filter(p => p.status === 'paid');
    const unpaidPayments = payments.filter(p => p.status === 'unpaid');

    return {
      totalRegistrations: teams.length,
      totalParticipants,
      paidRegistrations: paidPayments.length,
      unpaidRegistrations: unpaidPayments.length,
      totalRevenue: paidPayments.reduce((sum, p) => sum + p.amount, 0),
      pendingRevenue: unpaidPayments.reduce((sum, p) => sum + p.amount, 0),
    };
  } catch (error) {
    throw new Error(`Failed to fetch stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get event statistics (admin only)
 */
export async function getEventStats(eventId: string): Promise<{
  eventName: string;
  totalTeams: number;
  totalParticipants: number;
  paidTeams: number;
  revenue: number;
}> {
  try {
    const [event, teams, payments] = await Promise.all([
      fetchEventById(eventId),
      fetchAllTeamsByEvent(eventId),
      fetchAllPayments(),
    ]);

    if (!event) throw new Error('Event not found');

    const eventPayments = payments.filter(p => 
      teams.some(t => t.id === p.team_id)
    );
    const paidPayments = eventPayments.filter(p => p.status === 'paid');

    return {
      eventName: event.name,
      totalTeams: teams.length,
      totalParticipants: teams.reduce((sum, team) => sum + team.team_size, 0),
      paidTeams: paidPayments.length,
      revenue: paidPayments.reduce((sum, p) => sum + p.amount, 0),
    };
  } catch (error) {
    throw new Error(`Failed to fetch event stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get all registrations for the current authenticated user
 * Returns teams with event details, payment info, ticket codes, and member names
 */
export async function getUserRegistrations() {
  try {
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select(`
        id,
        team_name,
        college_name,
        team_size,
        created_at,
        events (
          name
        ),
        payments (
          amount
        ),
        tickets (
          ticket_code
        ),
        team_members (
          member_name
        )
      `)
      .order('created_at', { ascending: false });

    if (teamsError) throw teamsError;
    if (!teams) return [];

    return teams.map((team: any) => {
      const payment = team.payments?.[0];
      const ticket = team.tickets?.[0];
      
      return {
        id: team.id,
        event_name: team.events instanceof Array ? team.events[0]?.name || 'Unknown Event' : team.events?.name || 'Unknown Event',
        team_name: team.team_name,
        college_name: team.college_name,
        team_size: team.team_size,
        amount: payment?.amount || 0,
        payment_status: payment?.status || 'unpaid',
        ticket_code: ticket?.ticket_code || null,
        created_at: team.created_at,
        member_names: team.team_members?.map((m: any) => m.member_name) || [],
      };
    });
  } catch (error) {
    throw new Error(`Failed to fetch user registrations: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
