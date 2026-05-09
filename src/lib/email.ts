import { supabase } from "./supabase";

/**
 * Payload interface matching the structure expected by the `send-email` Supabase Edge Function.
 */
export interface WelcomePayload { name: string; email: string; }
export interface ResetPasswordPayload { token: string; email: string; }
export interface TicketPayload { eventTitle: string; date: string; venue: string; email: string; qrData?: any; }
export interface OrderAlertPayload {
    variant: 'seller' | 'buyer';
    itemTitle: string;
    sellerEmail: string;
    buyerEmail: string;
    buyerName?: string;
    amount: number;
}
export interface DisputeAlertPayload { id: string; email: string; }
export interface PasswordChangedPayload { email: string; name?: string; }

export interface VerificationNoticePayload { name: string; email: string; }

export interface SendEmailPayload {
    type: "welcome" | "reset_password" | "password_changed" | "ticket" | "order_alert" | "dispute_alert" | "verification_notice";
    payload: WelcomePayload | ResetPasswordPayload | PasswordChangedPayload | TicketPayload | OrderAlertPayload | DisputeAlertPayload | VerificationNoticePayload;
    attachments?: { ContentType: string, Filename: string, Base64Content: string }[];
}

/**
 * Sends an email using the Supabase `send-email` Edge Function powered by Mailjet.
 * @param params {SendEmailPayload} The email parameters (type and specific payload data)
 * @returns {Promise<{success: boolean, data?: any, error?: string}>} The result of the email dispatch
 */
export async function sendEmail(params: SendEmailPayload) {
    try {
        let subject = "";
        let htmlContent = "";
        let toEmail = ""; // Initialize to an empty string

        const wrapHtml = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px; color: #18181b; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #4f46e5, #9333ea); padding: 30px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
    .content { padding: 40px; font-size: 16px; line-height: 1.6; color: #3f3f46; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    .button { display: inline-block; background: linear-gradient(135deg, #4f46e5, #9333ea); color: #ffffff !important; font-weight: 600; padding: 14px 28px; border-radius: 12px; text-decoration: none; margin-top: 20px; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3); }
    .ticket-box { border: 2px dashed #cbd5e1; border-radius: 16px; padding: 30px; text-align: center; margin-top: 30px; background-color: #f8fafc; }
    .ticket-meta { font-size: 18px; font-weight: 600; margin: 10px 0; color: #0f172a; }
    .qr-container { background: white; padding: 16px; border-radius: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-top: 15px; }
    .qr-code { width: 180px; height: 180px; display: block; }
    h2 { color: #18181b; font-size: 22px; font-weight: 700; margin-top: 0; }
    p { margin-bottom: 16px; }
    .highlight { color: #4f46e5; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CredSwap</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} CredSwap Platform.<br/>Your ultimate campus superapp.
    </div>
  </div>
</body>
</html>`;

        // --- TEMPLATES ---
        if (params.type === "welcome") {
            const payload = params.payload as WelcomePayload;
            subject = "Welcome to CredSwap! 🎉";
            toEmail = payload.email;
            htmlContent = wrapHtml(`
                <h2>Welcome, ${payload.name}!</h2>
                <p>We're thrilled to have you join <strong>CredSwap</strong>, the ultimate platform for campus life.</p>
                <p>You can now explore trending events, find great deals on the marketplace, and connect with your peers instantly.</p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://credswap.in" class="button">Go to Dashboard</a>
                </div>
            `);
        } else if (params.type === "reset_password") {
            const payload = params.payload as ResetPasswordPayload;
            subject = "Password Reset Request";
            toEmail = payload.email;
            htmlContent = wrapHtml(`
                <h2>Password Reset</h2>
                <p>You requested a password reset for your account.</p>
                <p>Use the following secure token:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <h2 style="font-family: monospace; letter-spacing: 4px; background: #f4f4f5; padding: 15px 30px; display: inline-block; border-radius: 12px; border: 1px solid #e2e8f0; color: #4f46e5; font-size: 28px;">${payload.token}</h2>
                </div>
                <p>This token expires in 15 minutes.</p>
                <p style="font-size: 14px; color: #64748b;">If you did not request this, please ignore this email.</p>
            `);
        } else if (params.type === "password_changed") {
            const payload = params.payload as PasswordChangedPayload;
            subject = "Security Alert: Password Changed";
            toEmail = payload.email;
            htmlContent = wrapHtml(`
                <h2>Password successfully changed.</h2>
                <p>Hello${payload.name ? ` ${payload.name}` : ''},</p>
                <p>This is a confirmation that the password for your CredSwap account has been successfully changed.</p>
                <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #0f172a; font-weight: 500;">If you made this change, no further action is required.</p>
                </div>
                <p style="font-size: 14px; color: #64748b;">If you did not authorize this change, please contact support immediately and secure your account.</p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://campus-connect-hub.vercel.app/auth" class="button">Log In to Your Account</a>
                </div>
            `);
        } else if (params.type === "ticket") {
            const payload = params.payload as TicketPayload;
            subject = `Your Ticket: ${payload.eventTitle}`;
            toEmail = payload.email;

            // Generate the QR URL consistently. If qrData is already stringified, don't double stringify.
            const qrDataStr = typeof payload.qrData === 'string' ? payload.qrData : JSON.stringify(payload.qrData);
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrDataStr)}`;

            htmlContent = wrapHtml(`
                <div style="text-align: center; margin-bottom: 25px;">
                  <span style="background: #7c3aed; color: white; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;">Official Event Pass</span>
                </div>
                <h2 style="font-size: 26px; text-align: center; color: #111827; margin-bottom: 30px;">${payload.eventTitle}</h2>
                
                <div style="background-color: #f8fafc; border-radius: 20px; padding: 30px; margin-bottom: 30px; border: 1px solid #e2e8f0; position: relative; overflow: hidden;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td width="65%" style="vertical-align: top;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td width="50%" style="padding-bottom: 25px;">
                                            <p style="margin: 0; font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700; letter-spacing: 1.2px;">Date</p>
                                            <p style="margin: 4px 0 0 0; font-size: 17px; color: #0f172a; font-weight: 700;">${payload.date}</p>
                                        </td>
                                        <td width="50%" style="padding-bottom: 25px;">
                                            <p style="margin: 0; font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700; letter-spacing: 1.2px;">Location</p>
                                            <p style="margin: 4px 0 0 0; font-size: 17px; color: #0f172a; font-weight: 700;">${payload.venue}</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colspan="2">
                                            <p style="margin: 0; font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700; letter-spacing: 1.2px;">Attendee</p>
                                            <p style="margin: 4px 0 0 0; font-size: 17px; color: #0f172a; font-weight: 700;">${payload.email}</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                            <td width="35%" style="vertical-align: middle; text-align: center; background: #1a1b26; border-radius: 16px; padding: 20px;">
                                <table cellpadding="0" cellspacing="0" style="margin: 0 auto; background: white; border-radius: 12px;">
                                    <tr>
                                        <td style="padding: 10px; text-align: center;">
                                            <img src="${qrUrl}" alt="Scan QR" width="130" height="130" style="display: block; width: 130px; height: 130px; border: 0;" />
                                        </td>
                                    </tr>
                                </table>
                                <p style="color: white; font-size: 10px; font-weight: 700; margin: 12px 0 0 0; letter-spacing: 1px;">SCAN AT ENTRY</p>
                            </td>
                        </tr>
                    </table>
                </div>
                <p style="text-align: center; font-size: 14px; color: #64748b; line-height: 1.5;">
                    Please show this QR code at the entry gate for quick check-in. You can also save this email as your ticket.
                </p>
            `);
        } else if (params.type === "order_alert") {
            const payload = params.payload as OrderAlertPayload;
            const isSeller = payload.variant === "seller";
            subject = isSeller ? `New Order: ${payload.itemTitle} 💰` : `Order Confirmation: ${payload.itemTitle} ✅`;
            toEmail = isSeller ? payload.sellerEmail : payload.buyerEmail;

            if (isSeller) {
                htmlContent = wrapHtml(`
                    <h2>You made a sale! 💰</h2>
                    <p><span class="highlight">${payload.buyerName}</span> is interested in purchasing your item:</p>
                    
                    <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border-left: 4px solid #4f46e5; margin: 20px 0;">
                        <p style="margin: 0; font-size: 18px; font-weight: 700;">${payload.itemTitle}</p>
                        <p style="margin: 5px 0 0 0; color: #10b981; font-weight: 600; font-size: 18px;">₹${payload.amount}</p>
                    </div>

                    <p>Please contact the buyer directly to arrange the handover.</p>
                    <p><strong>Buyer Email:</strong> <a href="mailto:${payload.buyerEmail}" style="color: #4f46e5;">${payload.buyerEmail}</a></p>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="https://campus-connect-hub.vercel.app/inbox" class="button">Open Inbox</a>
                    </div>
                `);
            } else {
                htmlContent = wrapHtml(`
                    <h2>Order Request Sent ✅</h2>
                    <p>We've notified the seller that you want to purchase:</p>
                    
                    <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border-left: 4px solid #10b981; margin: 20px 0;">
                        <p style="margin: 0; font-size: 18px; font-weight: 700;">${payload.itemTitle}</p>
                        <p style="margin: 5px 0 0 0; color: #10b981; font-weight: 600; font-size: 18px;">₹${payload.amount}</p>
                    </div>

                    <p>The seller will check their inbox. You can also reach out to them directly.</p>
                    <p><strong>Seller Email:</strong> <a href="mailto:${payload.sellerEmail}" style="color: #4f46e5;">${payload.sellerEmail}</a></p>
                `);
            }
        } else if (params.type === "dispute_alert") {
            const payload = params.payload as DisputeAlertPayload;
            subject = "New Dispute Created 🚨";
            toEmail = payload.email;
            htmlContent = wrapHtml(`
                <h2>Dispute Raised 🚨</h2>
                <p>A new dispute has been registered on the platform.</p>
                <div style="background: #fef2f2; border: 1px solid #f87171; padding: 15px; border-radius: 12px; margin: 20px 0; color: #b91c1c;">
                    <strong>Dispute ID:</strong> ${payload.id}
                </div>
                <p>Please log in to the admin dashboard to review and resolve this case.</p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://campus-connect-hub.vercel.app/admin" class="button" style="background: #ef4444;">Go to Admin Panel</a>
                </div>
            `);
        } else if (params.type === "verification_notice") {
            const payload = params.payload as VerificationNoticePayload;
            subject = "Action Required: Verify your CredSwap account 🛡️";
            toEmail = payload.email;
            htmlContent = wrapHtml(`
                <h2>Verify Your Email</h2>
                <p>Hello ${payload.name},</p>
                <p>It looks like you haven't verified your email address yet. To access all the features of <strong>CredSwap</strong>, please confirm your email.</p>
                <div style="background: #fffbeb; border: 1px solid #fef3c7; padding: 20px; border-radius: 12px; margin: 25px 0;">
                    <p style="margin: 0; color: #92400e; font-weight: 500;">
                        Please check your inbox for an official confirmation link from our system. If you can't find it, check your spam folder.
                    </p>
                </div>
                <p>Verifying your email ensures your account is secure and allows you to participate in campus events and the marketplace.</p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://credswap.in/auth" class="button">Log In to CredSwap</a>
                </div>
            `);
        }

        const payloadData: any = {
            to_email: toEmail,
            subject: subject,
            html_part: htmlContent,
            from_name: "CredSwap",
            sender_name: "CredSwap"
        };

        if (params.attachments && params.attachments.length > 0) {
            payloadData.attachments = params.attachments;
        }

        // --- CHECK SYSTEM PREFERENCES ---
        const settingKey = `email_enabled_${params.type}`;
        const { data: settingData } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', settingKey)
            .single();

        if (settingData && settingData.value === 'false') {
            console.log(`Email sending for type "${params.type}" is globally disabled.`);
            return { success: true, message: "Email delivery paused by admin." };
        }

        const { data, error } = await supabase.functions.invoke('send-email', {
            body: payloadData
        });

        if (error) {
            console.error("Supabase Edge Function Error (Email):", error);
            return { success: false, error: error.message };
        }

        if (data?.error) {
            console.error("Mailjet API Error:", data.error);
            return { success: false, error: data.error };
        }

        return { success: true, data };
    } catch (err: any) {
        console.error("Failed to send email:", err);
        return { success: false, error: err.message || "Unknown error occurred while sending email" };
    }
}
