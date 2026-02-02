/**
 * Email service for sending approval/rejection notifications
 * Uses Supabase Edge Function to send emails via Resend
 */

import { supabase } from './supabase';

interface SendEmailParams {
  to: string;
  type: 'approval' | 'rejection';
  teamName: string;
  eventName: string;
  eventDate: string;
  ticketCode?: string;
  rejectionReason?: string;
  venue?: string;
  reportingTime?: string;
}

/**
 * Send email notification via Supabase Edge Function
 */
export async function sendEmailNotification(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📧 sendEmailNotification called with:', { to: params.to, type: params.type });
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('❌ No active session found');
      throw new Error('No active session');
    }

    console.log('✅ Session found, calling Edge Function...');

    // Call the Edge Function - Supabase handles auth automatically
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: params
    });

    console.log('📧 Edge Function response:', { dataSuccess: data?.success, error: error?.message });

    if (error) {
      console.error('❌ Edge function error:', error);
      return { success: false, error: error.message };
    }

    if (!data || !data.success) {
      console.error('❌ Email sending failed:', data?.error);
      return { success: false, error: data?.error || 'Unknown error' };
    }

    console.log('✅ Email sent successfully!');
    return { success: true };
  } catch (err) {
    console.error('❌ Email service error:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Failed to send email' 
    };
  }
}

/**
 * Send approval email with ticket
 */
export async function sendApprovalEmail(
  userEmail: string,
  teamName: string,
  eventName: string,
  eventDate: string,
  ticketCode: string
): Promise<{ success: boolean; error?: string }> {
  return sendEmailNotification({
    to: userEmail,
    type: 'approval',
    teamName,
    eventName,
    eventDate,
    ticketCode,
    venue: 'Sathyabama Institute of Science and Technology, Chennai',
    reportingTime: '08:40 AM'
  });
}

/**
 * Send rejection email with reason
 */
export async function sendRejectionEmail(
  userEmail: string,
  teamName: string,
  eventName: string,
  rejectionReason: string
): Promise<{ success: boolean; error?: string }> {
  return sendEmailNotification({
    to: userEmail,
    type: 'rejection',
    teamName,
    eventName,
    eventDate: 'N/A',
    rejectionReason
  });
}
