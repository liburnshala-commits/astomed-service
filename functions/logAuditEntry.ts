import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { action, entity_type, entity_id, entity_label, user_email, user_name, details } = await req.json();

        if (!action || !entity_type || !entity_id || !user_email) {
            return Response.json({ error: 'Saknar nödvändiga logg-parametrar.' }, { status: 400 });
        }

        await base44.asServiceRole.entities.AuditLog.create({
            action,
            entity_type,
            entity_id,
            entity_label: entity_label || `${entity_type} ${entity_id}`,
            user_email,
            user_name: user_name || user_email,
            details: details || null
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error('Fel vid loggning av audit-post:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});