import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Hämta alla öppna konversationer
        const conversations = await base44.asServiceRole.entities.ChatConversation.filter({
            status: 'open'
        });

        const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
        let processed = 0;

        for (const conv of conversations) {
            if (conv.delay_email_sent) continue;
            if (!conv.guest_email) continue;
            
            const lastMessageTime = new Date(conv.last_message_at || conv.created_date);
            if (lastMessageTime > fiveMinsAgo) continue;

            const emailBody = `Hej!

Tack för att du kontaktar oss på Astomed Support! Vi har sett ditt meddelande och vill gärna hjälpa dig.

Just nu är det lite snurrigt här på kontoret (kanske har någon råkat spilla kaffe på chattservern, igen 😉), så det kan dröja en liten stund innan vi kan svara direkt i chatten.

Men oroa dig inte! Vi har inte glömt dig. Vi återkommer så fort vi bara kan. Håll utkik i chatten! Om vi inte hinner tillbaka till chatten, hör vi av oss via e-post istället.

Med vänliga hälsningar,
Team Astomed Support`;

            // Skicka mailet
            await base44.asServiceRole.integrations.Core.SendEmail({
                to: conv.guest_email,
                subject: "Vi är på väg – din chatt med Astomed Support!",
                body: emailBody,
                from_name: "Astomed Support"
            });

            // Markera som skickat
            await base44.asServiceRole.entities.ChatConversation.update(conv.id, {
                delay_email_sent: true
            });
            
            // Logga interaktionen
            try {
                const customers = await base44.asServiceRole.entities.Customer.filter({ email: conv.guest_email });
                if (customers && customers.length > 0) {
                    await base44.asServiceRole.entities.CustomerInteraction.create({
                        customer_id: customers[0].id,
                        interaction_type: 'email',
                        interaction_date: new Date().toISOString(),
                        notes: `Skickade automatiskt förseningsemail för supportchatt till ${conv.guest_email}.`,
                        logged_by: 'System'
                    });
                }
            } catch (e) {
                console.error("Kunde inte logga e-post", e);
            }
            
            processed++;
        }

        return Response.json({ success: true, processed });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});