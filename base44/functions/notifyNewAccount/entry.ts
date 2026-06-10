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
                await base44.asServiceRole.functions.invoke('sendSmtpEmail', {
                    to: admin.email,
                    subject: "Nytt konto skapat i Astomed Pro",
                    body: `Ett nytt kundkonto har registrerats via den publika sidan.\n\nNamn: ${full_name || 'Okänt'}\nE-post: ${email || 'Okänt'}\nFöretag: ${company_name || 'Okänt'}\nDatum: ${new Date().toLocaleString('sv-SE')}`
                });
            }
        }
        
        return Response.json({ success: true });
    } catch (error) {
        console.error(error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});