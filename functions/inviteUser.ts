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

    await base44.users.inviteUser(email, role);

    return Response.json({ success: true, message: `User ${email} invited as ${role}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});