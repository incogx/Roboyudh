/**
 * Database Helper Functions for ROBOYUDH 2026
 * Provides type-safe Supabase queries with RLS security built-in
 *
 * All functions automatically use the authenticated user's context
 * RLS policies enforce that users can only access their own data
 * 
 * PAYMENT FLOW: PENDING → WAITING → APPROVED/REJECTED
 * - PENDING: User registered, no proof uploaded
 * - WAITING: User uploaded proof, waiting admin review
 * - APPROVED: Admin approved, ticket generated
 * - REJECTED: Admin rejected (final)
 */

import { supabase } from './supabase';

// ============================================================
// TYPES - Aligned with ROBOYUDH_2026_DATABASE.sql
// ============================================================

export interface Event {
  id: string;
  name: string;
  category: 'tech' | 'non-tech';
  description: string | null;
  rules: string[];
  price_per_head: number;
  max_team_size: number;
  image_url: string | null;
  rulebook_url: string | null;
  event_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  event_id: string;
  user_id: string;  // Changed from created_by
  team_name: string;
  college_name: string;
  phone_number: string;  // Required field
  team_size: number;
  is_onspot: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  member_name: string;
  member_email: string | null;
  member_phone: string | null;
  created_at: string;
}

// Payment status flow: PENDING → WAITING → APPROVED/REJECTED
export type PaymentStatus = 'PENDING' | 'WAITING' | 'APPROVED' | 'REJECTED';

export interface Payment {
  id: string;
  team_id: string;
  event_id: string;
  user_id: string;
  amount: number;
  transaction_id: string | null;
  screenshot_url: string | null;
  status: PaymentStatus;
  admin_comment: string | null;
  admin_decision_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  team_id: string;
  event_id: string;
  user_id: string;
  payment_id: string;
  ticket_code: string;
  qr_code_data: string | null;
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

export interface Registration {
  id: string;
  event_name: string;
  event_date: string | null;
  event_image: string | null;
  team_name: string;
  college_name: string;
  phone_number: string | null;
  team_size: number;
  amount: number;
  payment_id: string | null;
  payment_status: string;
  transaction_id: string | null;
  screenshot_url: string | null;
  ticket_code: string | null;
  qr_code_data: string | null;
  created_at: string;
  member_names: string[];
}

// ============================================================
// EVENTS - Public Access (Read-only for users)
// ============================================================

/**
 * Fetch all active events
 */
export async function fetchEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_active', true)
    .order('event_date', { ascending: true });

  if (error) throw new Error(`Failed to fetch events: ${error.message}`);
  return data || [];
}

/**
 * Fetch event by ID
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
 * Users can only see their own teams (RLS enforced)
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
 * Requires: event_id, user_id, team_name, college_name, phone_number, team_size
 */
export async function createTeam(team: {
  event_id: string;
  user_id: string;
  team_name: string;
  college_name: string;
  phone_number: string;
  team_size: number;
  is_onspot?: boolean;
}): Promise<Team> {
  const { data, error } = await supabase
    .from('teams')
    .insert([{
      ...team,
      is_onspot: team.is_onspot ?? false
    }])
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
export async function addTeamMember(
  teamId: string, 
  memberName: string,
  memberEmail?: string,
  memberPhone?: string
): Promise<TeamMember> {
  const { data, error } = await supabase
    .from('team_members')
    .insert([{ 
      team_id: teamId, 
      member_name: memberName,
      member_email: memberEmail || null,
      member_phone: memberPhone || null
    }])
    .select()
    .single();

  if (error) throw new Error(`Failed to add team member: ${error.message}`);
  return data;
}

/**
 * Add multiple members to team
 */
export async function addTeamMembers(teamId: string, memberNames: string[]): Promise<TeamMember[]> {
  const members = memberNames.map(name => ({ 
    team_id: teamId, 
    member_name: name 
  }));
  
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
// REGISTRATIONS
// ============================================================

/**
 * Create registration record
 */
export async function createRegistration(
  teamId: string,
  eventId: string,
  userId: string
): Promise<Registration> {
  const { data, error } = await supabase
    .from('registrations')
    .insert([{
      team_id: teamId,
      event_id: eventId,
      user_id: userId,
      status: 'ACTIVE'
    }])
    .select()
    .single();

  if (error) throw new Error(`Failed to create registration: ${error.message}`);
  return data;
}

/**
 * Fetch user's registrations
 */
export async function fetchUserRegistrations(): Promise<Registration[]> {
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch registrations: ${error.message}`);
  return data || [];
}

// ============================================================
// REGISTRATION DETAILS - Extended Personal Info
// ============================================================

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
// PAYMENTS - Manual Verification System
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
 * Fetch payment by ID
 */
export async function fetchPaymentById(paymentId: string): Promise<Payment | null> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch payment: ${error.message}`);
  }
  return data || null;
}

/**
 * Create payment record (status: WAITING)
 * Called after team creation - user pays externally, waits for admin verification
 */
export async function createPayment(
  teamId: string,
  eventId: string,
  userId: string,
  amount: number
): Promise<Payment> {
  const { data, error } = await supabase
    .from('payments')
    .insert([{ 
      team_id: teamId,
      event_id: eventId,
      user_id: userId,
      amount, 
      status: 'WAITING'
    }])
    .select()
    .single();

  if (error) throw new Error(`Failed to create payment: ${error.message}`);
  return data;
}

/**
 * Submit payment proof (PENDING → WAITING)
 * User uploads screenshot and transaction ID
 */
export async function submitPaymentProof(
  paymentId: string,
  transactionId: string,
  screenshotUrl: string
): Promise<Payment> {
  const { data, error } = await supabase
    .from('payments')
    .update({ 
      transaction_id: transactionId,
      screenshot_url: screenshotUrl,
      status: 'WAITING'
    })
    .eq('id', paymentId)
    .eq('status', 'PENDING')  // Can only submit if currently PENDING
    .select()
    .single();

  if (error) throw new Error(`Failed to submit payment proof: ${error.message}`);
  return data;
}

/**
 * Approve payment (WAITING → APPROVED) - Admin only
 */
export async function approvePayment(paymentId: string, adminComment?: string): Promise<Payment> {
  const { data, error } = await supabase
    .from('payments')
    .update({ 
      status: 'APPROVED',
      admin_comment: adminComment || 'Payment verified and approved'
    })
    .eq('id', paymentId)
    .select()
    .single();

  if (error) throw new Error(`Failed to approve payment: ${error.message}`);
  return data;
}

/**
 * Reject payment (WAITING → REJECTED) - Admin only
 */
export async function rejectPayment(paymentId: string, adminComment: string): Promise<Payment> {
  const { data, error } = await supabase
    .from('payments')
    .update({ 
      status: 'REJECTED',
      admin_comment: adminComment
    })
    .eq('id', paymentId)
    .select()
    .single();

  if (error) throw new Error(`Failed to reject payment: ${error.message}`);
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
export async function fetchPaymentsByStatus(status: PaymentStatus): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch payments: ${error.message}`);
  return data || [];
}

/**
 * Fetch pending payments with team details (admin dashboard)
 */
export async function fetchPendingPaymentsWithDetails(): Promise<any[]> {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      teams (
        team_name,
        college_name,
        phone_number,
        team_size
      ),
      events (
        name
      )
    `)
    .eq('status', 'WAITING')
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to fetch pending payments: ${error.message}`);
  return data || [];
}

// ============================================================
// TICKETS - Generated after payment approval
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
 * Fetch ticket by ticket code
 */
export async function fetchTicketByCode(ticketCode: string): Promise<Ticket | null> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('ticket_code', ticketCode)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch ticket: ${error.message}`);
  }
  return data || null;
}

/**
 * Create ticket for team (Admin only - after payment approval)
 * Ticket code is auto-generated by database trigger
 */
export async function createTicket(
  teamId: string,
  eventId: string,
  userId: string,
  paymentId: string,
  qrCodeData?: string,
  pdfUrl?: string
): Promise<Ticket> {
  const { data, error } = await supabase
    .from('tickets')
    .insert([{ 
      team_id: teamId,
      event_id: eventId,
      user_id: userId,
      payment_id: paymentId,
      qr_code_data: qrCodeData || null,
      pdf_url: pdfUrl || null
    }])
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
      team:team_id (
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
  
  // Map teams to team field for compatibility
  return (data || []).map((entry: any) => ({
    ...entry,
    team: entry.team || null,
  }));
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
 * Creates team, members, payment (auto-approved), and ticket
 */
export async function createOnSpotRegistration(
  eventId: string,
  teamName: string,
  collegeName: string,
  phoneNumber: string,
  teamSize: number,
  memberNames: string[],
  amount: number
): Promise<{ team: Team; members: TeamMember[]; payment: Payment; ticket: Ticket }> {
  try {
    // Get the admin user's ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Failed to get current user');

    // Create team
    const team = await createTeam({
      event_id: eventId,
      team_name: teamName,
      college_name: collegeName,
      phone_number: phoneNumber,
      team_size: teamSize,
      user_id: user.id,
      is_onspot: true,
    });

    // Add members
    const members = await addTeamMembers(team.id, memberNames);

    // Create payment (directly approved for on-spot)
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([{
        team_id: team.id,
        event_id: eventId,
        user_id: user.id,
        amount,
        transaction_id: `ONSPOT-${Date.now()}`,
        status: 'APPROVED',
        admin_comment: 'On-spot registration - cash payment received'
      }])
      .select()
      .single();

    if (paymentError) throw new Error(`Failed to create payment: ${paymentError.message}`);

    // Create ticket
    const ticket = await createTicket(team.id, eventId, user.id, payment.id);

    return { team, members, payment, ticket };
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
  approvedPayments: number;
  pendingPayments: number;
  waitingPayments: number;
  rejectedPayments: number;
  totalRevenue: number;
  pendingRevenue: number;
}> {
  try {
    const [teams, payments] = await Promise.all([
      fetchAllTeams(),
      fetchAllPayments(),
    ]);

    const totalParticipants = teams.reduce((sum, team) => sum + team.team_size, 0);
    const approvedPayments = payments.filter(p => p.status === 'APPROVED');
    const pendingPayments = payments.filter(p => p.status === 'PENDING');
    const waitingPayments = payments.filter(p => p.status === 'WAITING');
    const rejectedPayments = payments.filter(p => p.status === 'REJECTED');

    return {
      totalRegistrations: teams.length,
      totalParticipants,
      approvedPayments: approvedPayments.length,
      pendingPayments: pendingPayments.length,
      waitingPayments: waitingPayments.length,
      rejectedPayments: rejectedPayments.length,
      totalRevenue: approvedPayments.reduce((sum, p) => sum + Number(p.amount), 0),
      pendingRevenue: waitingPayments.reduce((sum, p) => sum + Number(p.amount), 0),
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
  approvedTeams: number;
  revenue: number;
}> {
  try {
    const [event, teams, payments] = await Promise.all([
      fetchEventById(eventId),
      fetchAllTeamsByEvent(eventId),
      fetchAllPayments(),
    ]);

    if (!event) throw new Error('Event not found');

    const eventPayments = payments.filter(p => p.event_id === eventId);
    const approvedPayments = eventPayments.filter(p => p.status === 'APPROVED');

    return {
      eventName: event.name,
      totalTeams: teams.length,
      totalParticipants: teams.reduce((sum, team) => sum + team.team_size, 0),
      approvedTeams: approvedPayments.length,
      revenue: approvedPayments.reduce((sum, p) => sum + Number(p.amount), 0),
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
    // Fetch teams for the current user first (teams RLS should allow this)
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select(`
        id,
        team_name,
        college_name,
        phone_number,
        team_size,
        created_at,
        events ( name, event_date, image_url ),
        team_members ( member_name )
      `)
      .order('created_at', { ascending: false });

    if (teamsError) throw teamsError;
    if (!teams) return [];

    const teamIds = teams.map((t: any) => t.id).filter(Boolean);

    // Fetch payments and tickets separately to avoid multi-table join restrictions
    let payments: any[] = [];
    let tickets: any[] = [];

    if (teamIds.length > 0) {
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .in('team_id', teamIds as any[]);

      if (paymentsError) console.warn('payments fetch error', paymentsError);
      else payments = paymentsData || [];

      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .in('team_id', teamIds as any[]);

      if (ticketsError) console.warn('tickets fetch error', ticketsError);
      else tickets = ticketsData || [];
    }

    return teams.map((team: any) => {
      const event = Array.isArray(team.events) ? team.events[0] : team.events;
      const teamPayments = payments.filter((p) => p.team_id === team.id);
      const payment = teamPayments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      const ticket = tickets.find((tk) => tk.team_id === team.id);

      return {
        id: team.id,
        event_name: event?.name || 'Unknown Event',
        event_date: event?.event_date || null,
        event_image: event?.image_url || null,
        team_name: team.team_name,
        college_name: team.college_name,
        phone_number: team.phone_number,
        team_size: team.team_size,
        amount: payment?.amount || 0,
        payment_id: payment?.id || null,
        payment_status: payment?.status || 'PENDING',
        transaction_id: payment?.transaction_id || null,
        screenshot_url: payment?.screenshot_url || null,
        ticket_code: ticket?.ticket_code || null,
        qr_code_data: ticket?.qr_code_data || null,
        created_at: team.created_at,
        member_names: team.team_members?.map((m: any) => m.member_name) || [],
      };
    });
  } catch (error) {
    console.error('getUserRegistrations error', error);
    return [];
  }
}

// ============================================================
// STORAGE - Payment Screenshots
// ============================================================

/**
 * Upload payment screenshot to Supabase Storage
 */
export async function uploadPaymentScreenshot(
  userId: string,
  file: File
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('payment-screenshots')
    .upload(fileName, file);

  if (error) throw new Error(`Failed to upload screenshot: ${error.message}`);

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('payment-screenshots')
    .getPublicUrl(data.path);

  return publicUrl;
}

// ============================================================
// AUDIT LOG
// ============================================================

/**
 * Create audit log entry (system use)
 */
export async function createAuditLog(
  adminEmail: string,
  action: string,
  targetType?: string,
  targetId?: string,
  details?: Record<string, any>
): Promise<void> {
  const { error } = await supabase
    .from('audit_log')
    .insert([{
      admin_email: adminEmail,
      action,
      target_type: targetType,
      target_id: targetId,
      details
    }]);

  if (error) console.error('Failed to create audit log:', error.message);
}

/**
 * Fetch audit logs (admin only)
 */
export async function fetchAuditLogs(limit: number = 100): Promise<any[]> {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch audit logs: ${error.message}`);
  return data || [];
}
