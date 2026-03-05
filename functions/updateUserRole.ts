import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { email, role } = await req.json();

        if (!email || !role) {
            return Response.json({ error: 'Email and role are required' }, { status: 400 });
        }

        const validRoles = ['admin', 'technician', 'user'];
        if (!validRoles.includes(role)) {
            return Response.json({ error: 'Invalid role' }, { status: 400 });
        }

        await base44.asServiceRole.entities.User.update(email, { role });

        return Response.json({ success: true, message: `User ${email} updated to role ${role}` });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});