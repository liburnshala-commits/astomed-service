import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import nodemailer from 'npm:nodemailer';

Deno.serve(async (req) => {
    try {
        const payload = await req.json();
        const { to, subject, body, from_name } = payload;
        
        if (!to || !subject || !body) {
            return Response.json({ error: "Missing required fields" }, { status: 400 });
        }
        
        const host = Deno.env.get("SMTP_HOST");
        const port = parseInt(Deno.env.get("SMTP_PORT") || "587", 10);
        const user = Deno.env.get("SMTP_USER");
        const pass = Deno.env.get("SMTP_PASSWORD");
        
        if (!host || !user || !pass) {
            return Response.json({ error: "SMTP credentials not configured" }, { status: 500 });
        }
        
        const transporter = nodemailer.createTransport({
            host: host,
            port: port,
            secure: port === 465,
            auth: {
                user: user,
                pass: pass,
            },
        });
        
        // Detect if body is HTML (simple check)
        const isHtml = body.trim().startsWith('<') || body.includes('<html') || body.includes('<div') || body.includes('<p>') || body.includes('<br>');
        
        const mailOptions = {
            from: from_name ? `"${from_name}" <${user}>` : user,
            to: to,
            subject: subject,
            text: isHtml ? undefined : body,
            html: isHtml ? body : undefined,
        };
        
        const info = await transporter.sendMail(mailOptions);
        
        return Response.json({ success: true, messageId: info.messageId });
    } catch (error) {
        console.error("SMTP Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});