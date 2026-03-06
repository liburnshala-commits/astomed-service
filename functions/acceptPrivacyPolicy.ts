import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update user via service role to set role and privacy policy acceptance
    await base44.asServiceRole.entities.User.update(user.id, {
      role: 'customer',
      privacy_policy_accepted: true
    });

    // Log the action
    await base44.asServiceRole.entities.AuditLog.create({
      action: 'create',
      entity_type: 'ConsentRecord',
      entity_id: user.id,
      entity_label: `Integritetspolicy godkänd av ${user.full_name || user.email}`,
      user_email: user.email,
      user_name: user.full_name || user.email,
      details: `Användaren godkände integritetspolicyn (version 2025-10-20) via inloggningsflödet och tilldelades rollen "customer".`
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});