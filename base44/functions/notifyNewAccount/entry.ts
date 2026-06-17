import { createClientFromRequest } from 'npm:@base44/sdk@0.8.30';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const payload = await req.json();
        const { email, full_name, company_name } = payload;
        
        // Hämta alla administratörer
        const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
        
        // Skicka ett e-postmeddelande till varje administratör
        for (const admin of admins) {
            if (admin.email) {
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: admin.email,
                    subject: "Väntande kund - portalaktivering i Astomed Pro",
                    body: `En ny kund har ansökt och väntar på att få sin portal aktiverad.\n\nNamn: ${full_name || 'Okänt'}\nE-post: ${email || 'Okänt'}\nFöretag: ${company_name || 'Okänt'}\nAnsökan gjordes: ${new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Stockholm' })}\n\nGå in i Astomed Pro under Nya Kunder / Användare och ändra deras roll till "Kund (Godkänd)" för att aktivera portalen.`
                });
            }
        }
        
        return Response.json({ success: true });
    } catch (error) {
        console.error(error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});