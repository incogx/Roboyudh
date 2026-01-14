/**
 * DEPRECATED: Mock Data File
 * 
 * This file is deprecated and kept only for backward compatibility.
 * All components have been migrated to use real Supabase data from src/lib/db.ts
 * 
 * Do NOT add new mock data. Use the database functions instead:
 * - fetchEvents() - Get real events from database
 * - fetchUserTeams() - Get user's teams
 * - fetchLeaderboardByEvent() - Get real leaderboard data
 */

// Re-export types from database for backward compatibility if needed
export type { Event, Team, Payment, Ticket, LeaderboardEntry } from '../lib/db';

// Empty exports for removed mock data
export const events: any[] = [];
export const mockRegistrations: any[] = [];
export const mockLeaderboard: any[] = [];
export const eventStats = {
  totalRegistrations: 0,
  eventWiseCount: [],
};

console.warn(
  'Mock data is deprecated. Please use database functions from src/lib/db.ts instead.'
);

