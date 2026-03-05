import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { customerName, filterLabel, recordCount } = await req.json();

    const subject = `Servicerapport från Astomed – ${filterLabel}`;

    const body = `Hej ${customerName || ''},

Tack för att ni anlitar Astomed Klinikutrustning Sverige AB för er serviceutrustning.

Bifogat/länkat hittar ni den önskade servicerapporten avseende: ${filterLabel}.
Rapporten innehåller ${recordCount} serviceärende${recordCount !== 1 ? 'n' : ''}.

Har ni frågor om rapporten eller era serviceärenden är ni välkomna att kontakta oss.

Med vänliga hälsningar,
Astomed Klinikutrustning Sverige AB
Jägerhorns väg 3-5, 141 75 Kungens Kurva
Tel: 08 – 410 779 00
E-post: info@astomed.se
www.astomed.se`;

    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject,
      body,
      from_name: "Astomed Servicerapporter"
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});