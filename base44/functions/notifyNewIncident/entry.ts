import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const body = await req.json();
        
        if (body.event?.type === 'create' && body.event?.entity_name === 'IncidentReport') {
            const incident = body.data;
            
            // Hämta alla admins och tekniker
            const users = await base44.asServiceRole.entities.User.filter({});
            const staffUsers = users.filter(u => u.role === 'admin' || u.role === 'technician');
            
            const notifications = staffUsers.map(user => ({
                user_email: user.email,
                title: "Ny Incidentrapport från kund",
                message: `En ny incident "${incident.title || 'Utan titel'}" har rapporterats. Klicka för att granska.`,
                type: "warning",
                related_entity: "IncidentReport",
                related_entity_id: incident.id
            }));
            
            if (notifications.length > 0) {
                await base44.asServiceRole.entities.Notification.bulkCreate(notifications);
            }
        }
        
        return Response.json({ success: true });
    } catch (error) {
        console.error(error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});