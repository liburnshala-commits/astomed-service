import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();
        
        // Only process newly created messages from guests
        const { event, data } = payload;
        if (event.type !== 'create' || data.sender_type !== 'guest') {
            return Response.json({ status: 'ignored' });
        }

        // Check time in Sweden (Europe/Stockholm)
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('sv-SE', {
            timeZone: 'Europe/Stockholm',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false
        });
        
        const timeString = formatter.format(now);
        const [hours, minutes] = timeString.split(':').map(Number);
        const currentTime = hours * 60 + minutes;
        
        const startTime = 8 * 60 + 30; // 08:30
        const endTime = 16 * 60 + 30;  // 16:30
        
        // Business hours: 08:30 - 16:30
        const isBusinessHours = currentTime >= startTime && currentTime < endTime;
        
        // If it is business hours, do nothing (wait for human agent)
        if (isBusinessHours) {
             return Response.json({ status: 'business_hours', time: timeString });
        }

        // Outside business hours: AI responds
        // Fetch conversation history for context (optional, keeping it simple for now)
        // We'll just respond to the latest message
        
        const aiResponse = await base44.integrations.Core.InvokeLLM({
            prompt: `
                Du är en hjälpsam AI-assistent för Astomed Service.
                Användaren har skrivit: "${data.content}".
                
                Klockan är nu ${timeString} och vår mänskliga support är stängd (öppen 08:30-16:30).
                Svara vänligt på svenska. Bekräfta att vi mottagit meddelandet.
                Om det är en enkel fråga, försök svara.
                Informera om att en tekniker kommer att titta på detta så snart de är tillbaka.
                Håll svaret kort och koncist.
            `
        });

        // Save AI response
        // Using service role to ensure we can write whatever we need
        await base44.asServiceRole.entities.ChatMessage.create({
            conversation_id: data.conversation_id,
            sender_type: 'ai',
            sender_name: 'Astomed AI',
            content: aiResponse
        });

        return Response.json({ status: 'ai_replied' });

    } catch (error) {
        console.error("Error processing chat message:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});