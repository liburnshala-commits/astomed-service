import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Endast admins kan generera portal-tokens' }, { status: 403 });
    }

    const { customer_id } = await req.json();

    if (!customer_id) {
      return Response.json({ error: 'customer_id är obligatorisk' }, { status: 400 });
    }

    // Hämta kund
    const customer = await base44.asServiceRole.entities.Customer.get(customer_id);
    if (!customer) {
      return Response.json({ error: 'Kund hittades inte' }, { status: 404 });
    }

    // Generera token (32 slumpmässiga tecken)
    const token = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Uppdatera kund med ny token
    await base44.asServiceRole.entities.Customer.update(customer_id, { portal_token: token });

    return Response.json({ 
      success: true, 
      token,
      portal_url: `${Deno.env.get('APP_URL') || 'https://your-app.com'}/customer-portal?token=${token}`
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});