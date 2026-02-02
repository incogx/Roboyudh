import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = 'Roboyudh <no-reply@roboyudh.com>'

console.log('🔍 Send-Email Function Started')
console.log('📧 RESEND_API_KEY configured:', RESEND_API_KEY ? '✅ Yes' : '❌ No')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  type: 'approval' | 'rejection'
  teamName: string
  eventName: string
  eventDate: string
  ticketCode?: string
  rejectionReason?: string
  venue?: string
  reportingTime?: string
}

const generateApprovalEmailHTML = (data: EmailRequest): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">ROBOYUDH 2026</h1>
      <p style="color: #e0f2fe; margin: 10px 0 0 0; font-size: 16px;">Registration Confirmed! 🎉</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 18px; color: #1f2937; margin: 0 0 20px 0;">Hello Team <strong>${data.teamName}</strong>,</p>
      
      <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
        Congratulations! 🎉 Your team has been <strong>selected</strong> for <strong>${data.eventName}</strong>.
      </p>
      
      <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">
        Attached are your <strong>event tickets</strong>. Please make sure all members carry the ticket (digital or printed) on the event day.
      </p>
      
      <!-- Ticket Code Box -->
      <div style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 0 0 30px 0;">
        <p style="color: #e0f2fe; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Ticket Code</p>
        <p style="color: #ffffff; margin: 0; font-size: 36px; font-weight: bold; font-family: 'Courier New', monospace; letter-spacing: 3px;">${data.ticketCode || 'N/A'}</p>
      </div>
      
      <!-- Event Details -->
      <div style="background-color: #f9fafb; border-left: 4px solid #06b6d4; padding: 20px; margin: 0 0 30px 0; border-radius: 4px;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">📅 Event Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">📍 Venue:</td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${data.venue || 'Sathyabama Institute of Science and Technology, Chennai'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">📅 Date:</td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${data.eventDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">⏰ Reporting Time:</td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${data.reportingTime || '08:40 AM'}</td>
          </tr>
        </table>
      </div>
      
      <!-- Important Notes -->
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 0 0 30px 0; border-radius: 4px;">
        <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">⚠️ Important</h3>
        <ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 14px; line-height: 1.6;">
          <li>Carry a printed or digital copy of this ticket</li>
          <li>Arrive at the venue by the reporting time</li>
          <li>Ensure all team members are present</li>
          <li>Bring valid ID proof for verification</li>
        </ul>
      </div>
      
      <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin: 0 0 10px 0;">
        For any queries, feel free to reach out to us at <a href="mailto:organizers.roboyudh@gmail.com" style="color: #06b6d4; text-decoration: none;">organizers.roboyudh@gmail.com</a>
      </p>
      
      <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">
        See you at the event! 🚀
      </p>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
        <p style="color: #6b7280; margin: 0; font-size: 14px; line-height: 1.6;">
          Regards,<br/>
          <strong>ROBOYUDH Team</strong><br/>
          Sathyabama Institute of Science and Technology
        </p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; margin: 0; font-size: 12px;">
        © 2026 ROBOYUDH - Sathyabama Institute of Science and Technology
      </p>
    </div>
  </div>
</body>
</html>
  `
}

const generateRejectionEmailHTML = (data: EmailRequest): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">ROBOYUDH 2026</h1>
      <p style="color: #fee2e2; margin: 10px 0 0 0; font-size: 16px;">Registration Update</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 18px; color: #1f2937; margin: 0 0 20px 0;">Hello,</p>
      
      <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">
        Unfortunately, your registration for <strong>${data.eventName}</strong> was not approved.
      </p>
      
      <!-- Rejection Reason Box -->
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 0 0 30px 0; border-radius: 4px;">
        <h3 style="color: #991b1b; margin: 0 0 10px 0; font-size: 16px;">Reason for Rejection</h3>
        <p style="color: #7f1d1d; margin: 0; font-size: 15px; line-height: 1.6;">${data.rejectionReason || 'No reason provided'}</p>
      </div>
      
      <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin: 0 0 10px 0;">
        If you have any questions or believe this is an error, please contact us at:
      </p>
      
      <p style="font-size: 16px; margin: 0 0 30px 0;">
        <a href="mailto:organizers.roboyudh@gmail.com" style="color: #06b6d4; text-decoration: none; font-weight: 500;">organizers.roboyudh@gmail.com</a>
      </p>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
        <p style="color: #6b7280; margin: 0; font-size: 14px; line-height: 1.6;">
          Regards,<br/>
          <strong>ROBOYUDH Team</strong><br/>
          Sathyabama Institute of Science and Technology
        </p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; margin: 0; font-size: 12px;">
        © 2026 ROBOYUDH - Sathyabama Institute of Science and Technology
      </p>
    </div>
  </div>
</body>
</html>
  `
}

serve(async (req) => {
  console.log('📨 Request received:', req.method, req.url)
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    console.log('🔄 Parsing request body...')
    let emailData: EmailRequest
    try {
      emailData = await req.json()
      console.log('✅ Request parsed. Data:', {
        to: emailData.to,
        type: emailData.type,
        teamName: emailData.teamName,
        eventName: emailData.eventName,
        eventDate: emailData.eventDate,
        hasTicketCode: !!emailData.ticketCode
      })
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body', details: parseError.message }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📧 Received email request for:', emailData.to, 'Type:', emailData.type)

    // Validate required fields
    if (!emailData.to || !emailData.type || !emailData.teamName || !emailData.eventName) {
      console.error('❌ Missing required fields: to, type, teamName, eventName')
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, type, teamName, eventName' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For approval emails, eventDate is required
    if (emailData.type === 'approval' && !emailData.eventDate) {
      console.error('❌ eventDate missing for approval email')
      return new Response(
        JSON.stringify({ error: 'eventDate is required for approval emails' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate email HTML based on type
    let html: string
    let subject: string

    if (emailData.type === 'approval') {
      if (!emailData.ticketCode) {
        console.error('❌ Ticket code missing for approval email')
        return new Response(
          JSON.stringify({ error: 'Ticket code is required for approval emails' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      subject = `🎉 ROBOYUDH 2026 - Registration Confirmed for ${emailData.eventName}`
      html = generateApprovalEmailHTML(emailData)
      console.log('✅ Generated approval email')
    } else if (emailData.type === 'rejection') {
      subject = `ROBOYUDH 2026 - Registration Update for ${emailData.eventName}`
      html = generateRejectionEmailHTML(emailData)
      console.log('✅ Generated rejection email')
    } else {
      console.error('❌ Invalid email type:', emailData.type)
      return new Response(
        JSON.stringify({ error: 'Invalid email type. Must be "approval" or "rejection"' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if RESEND_API_KEY is configured
    if (!RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not configured in Edge Function secrets')
      return new Response(
        JSON.stringify({ error: 'Email service not configured - RESEND_API_KEY missing' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send email using Resend API
    console.log('📧 Calling Resend API...')
    console.log('📧 Resend Details:', {
      from: FROM_EMAIL,
      to: emailData.to,
      subject: subject.substring(0, 50) + '...'
    })
    
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [emailData.to],
        subject: subject,
        html: html
      })
    })

    console.log('📧 Resend API Response Status:', resendResponse.status)
    
    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('❌ Resend API error:', resendResponse.status, resendData)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send email', 
          details: resendData,
          status: resendResponse.status 
        }), 
        { status: resendResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Email sent successfully! ID:', resendData.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        emailId: resendData.id 
      }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
