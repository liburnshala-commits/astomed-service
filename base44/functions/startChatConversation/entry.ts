import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        const email = body.email;
        const guestId = body.guestId;

        if (!email || !guestId) {
            return Response.json({ error: 'Missing email or guestId' }, { status: 400 });
        }

        // Use service role to search for customer
        const customers = await base44.asServiceRole.entities.Customer.filter({ email: email.trim() });
        const matchedCustomer = customers.length > 0 ? customers[0] : null;

        const currentConv = await base44.asServiceRole.entities.ChatConversation.create({
            guest_id: guestId,
            guest_email: email.trim(),
            customer_id: matchedCustomer ? matchedCustomer.id : null,
            customer_name: matchedCustomer ? matchedCustomer.company_name : null,
            status: 'open',
            last_message_at: new Date().toISOString()
        });

        await base44.asServiceRole.entities.ChatMessage.create({
            conversation_id: currentConv.id,
            sender_type: 'system',
            sender_name: 'Astomed',
            content: 'Välkommen till Astomed Support! En tekniker kommer att besvara dina frågor så snart som möjligt. Du kan börja skriva ditt ärende här nedan.'
        });

        return Response.json({ conversation: currentConv });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});