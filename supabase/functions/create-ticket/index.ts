import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  console.log('📦 Create-Ticket Request received:', req.method, req.url);
  
  // Handle CORS preflight AND OPTIONS
  if (req.method === "OPTIONS" || req.method === "HEAD") {
    console.log('✅ CORS preflight/HEAD');
    return new Response("ok", { 
      status: 200,
      headers: corsHeaders 
    });
  }

  // Only allow POST
  if (req.method !== "POST") {
    console.log('❌ Method not allowed:', req.method);
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { 
        status: 405, 
        headers: corsHeaders 
      }
    );
  }

  try {
    console.log('🔄 Parsing request body...');
    const {
      teamId,
      eventId,
      userId,
      paymentId,
      ticketCode,
    } = await req.json();

    console.log('✅ Request parsed:', {
      teamId,
      eventId,
      userId,
      paymentId,
      ticketCode,
    });

    // Validate inputs
    if (!teamId || !eventId || !userId || !paymentId || !ticketCode) {
      console.error('❌ Missing required fields');
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          received: { teamId, eventId, userId, paymentId, ticketCode },
        }),
        { 
          status: 400, 
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          }
        }
      );
    }

    // Create Supabase client with service role (has full permissions)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('❌ Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: "Missing Supabase configuration" }),
        { 
          status: 500, 
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          }
        }
      );
    }

    console.log('✅ Supabase configured');
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Insert ticket using service role (bypasses RLS)
    console.log("📦 Inserting ticket...");

    const { data, error } = await supabase
      .from("tickets")
      .insert([
        {
          team_id: teamId,
          event_id: eventId,
          user_id: userId,
          payment_id: paymentId,
          ticket_code: ticketCode,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Ticket creation error:', error);
      return new Response(
        JSON.stringify({
          error: "Failed to create ticket",
          details: error.message,
          code: error.code,
        }),
        { 
          status: 400, 
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          }
        }
      );
    }

    console.log('✅ Ticket created successfully!', data);

    return new Response(JSON.stringify({ success: true, ticket: data }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error('❌ Function error:', error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      }),
      { 
        status: 500, 
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        }
      }
    );
  }
}, {
  http: 'cors',
});
