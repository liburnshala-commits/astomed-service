import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        // Endast admin och tekniker får skicka SMS
        if (!user || user.role === 'customer') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await req.json();
        const { to, message, from = "Astomed" } = payload;

        if (!to || !message) {
            return Response.json({ error: 'Missing required fields: to, message' }, { status: 400 });
        }

        const username = Deno.env.get("ELKS_USERNAME");
        const password = Deno.env.get("ELKS_PASSWORD");

        if (!username || !password) {
             return Response.json({ error: 'SMS configuration missing' }, { status: 500 });
        }

        const auth = btoa(`${username}:${password}`);

        const formData = new URLSearchParams();
        formData.append("from", from);
        formData.append("to", to);
        formData.append("message", message);

        const response = await fetch("https://api.46elks.com/a1/SMS", {
            method: "POST",
            headers: {
                "Authorization": `Basic ${auth}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: formData.toString()
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`46elks API error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        return Response.json({ success: true, data });

    } catch (error) {
        console.error("SMS Error:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});