/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("CUSTOM_SERVICE_ROLE_KEY") ?? ""
    );

    const { email, name } = await req.json();

    // 1. Generate the actual Confirmation Link using Admin Privileges
    const { data, error: linkError } = await supabaseClient.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: { redirectTo: `${new URL(req.url).origin.replace('functions/admin-resend', '')}auth` }
    });

    if (linkError) throw linkError;

    const confirmationUrl = data.properties.action_link;

    // 2. Send the Branded Email via Resend
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `Campulsy <info@campulsy.in>`,
        to: [email],
        subject: "Action Required: Verify your Campulsy account 🛡️",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #4f46e5, #9333ea); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Campulsy</h1>
            </div>
            <div style="padding: 40px; color: #1e293b;">
              <h2 style="margin-top: 0;">Verify Your Email Address</h2>
              <p>Hello ${name},</p>
              <p>Your account is almost ready! To unlock all features like the marketplace and events, please verify your email address below:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${confirmationUrl}" style="background: #4f46e5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Confirm My Email</a>
              </div>
              <p style="font-size: 13px; color: #64748b;">If you didn't request this, you can safely ignore this email.</p>
            </div>
          </div>
        `,
      }),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
