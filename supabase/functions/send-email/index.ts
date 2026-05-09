/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";


const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SENDER_EMAIL = Deno.env.get("RESEND_SENDER_EMAIL") || "info@campulsy.in";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
    to_email: string;
    subject: string;
    html_part: string;
    from_name?: string;
    sender_name?: string;
    attachments?: {
        ContentType: string;
        Filename: string;
        Base64Content: string;
    }[];
}

serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const payload: EmailRequest = await req.json();

        if (!RESEND_API_KEY) {
            console.error("Resend API Key is missing");
            return new Response(JSON.stringify({ error: "Server configuration error (Missing API Keys)" }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const toEmail = payload.to_email;
        const subject = payload.subject;
        const htmlContent = payload.html_part;
        const senderName = payload.from_name || payload.sender_name || "Campulsy";

        if (!toEmail || !subject || !htmlContent) {
            return new Response(JSON.stringify({ error: "Missing required fields: to_email, subject, html_part" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // --- MAP ATTACHMENTS TO RESEND FORMAT ---
        const resendAttachments = payload.attachments?.map((att) => ({
            filename: att.Filename,
            content: att.Base64Content,
        }));

        // --- SENDING VIA RESEND ---
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: `${senderName} <${SENDER_EMAIL}>`,
                to: [toEmail],
                subject: subject,
                html: htmlContent,
                ...(resendAttachments && resendAttachments.length > 0 ? { attachments: resendAttachments } : {})
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("Resend API Error:", data);
            return new Response(JSON.stringify({ error: data }), {
                status: res.status,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        return new Response(JSON.stringify({ success: true, data }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
