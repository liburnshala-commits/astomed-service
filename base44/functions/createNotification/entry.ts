import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { user_email, title, message, type = "info", related_entity, related_entity_id } = body;

    if (!user_email || !title || !message) {
      return Response.json(
        { error: "Saknade obligatoriska fält: user_email, title, message" },
        { status: 400 }
      );
    }

    const notification = await base44.asServiceRole.entities.Notification.create({
      user_email,
      title,
      message,
      type,
      related_entity,
      related_entity_id,
      is_read: false
    });

    return Response.json({ success: true, notification });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});