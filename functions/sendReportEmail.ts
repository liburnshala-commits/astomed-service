import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { customerEmail, customerName, filterLabel, recordCount } = await req.json();

    if (!customerEmail) {
      return Response.json({ error: 'Ingen e-postadress angiven' }, { status: 400 });
    }

    const subject = `Servicerapport från Astomed – ${filterLabel}`;

    const body = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #1b3a3a; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f6f4; }
    .header { background: #1b3a3a; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 20px; }
    .report-info { background: #e8f2f2; padding: 15px; border-left: 4px solid #3a9e9e; margin: 15px 0; }
    .footer { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; font-size: 12px; color: #6b8f8f; }
    .contact-box { background: #f0f7f0; padding: 15px; border-radius: 6px; margin-top: 15px; }
    .logo { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Astomed</div>
      <p style="margin: 0; font-size: 14px;">Servicerapport</p>
    </div>
    <div class="content">
      <p>Hej ${customerName || 'kund'},</p>
      <p>Tack för att ni anlitar Astomed Klinikutrustning Sverige AB för er serviceutrustning.</p>
      
      <div class="report-info">
        <strong>Rapportöversikt</strong><br>
        Filter: ${filterLabel}<br>
        Antal serviceärenden: ${recordCount}
      </div>
      
      <p>Rapporten är tillgänglig i er kundportal. Logga in för att se fullständig information om serviceärendena.</p>
      
      <p>Har ni frågor om rapporten eller era serviceärenden är ni välkomna att kontakta oss.</p>
      
      <div class="contact-box">
        <strong>Kontakt</strong><br>
        Tel: 08 – 410 779 00<br>
        E-post: info@astomed.se<br>
        www.astomed.se
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0;"><strong>Astomed Klinikutrustning Sverige AB</strong><br>
      Jägerhorns väg 3-5, 141 75 Kungens Kurva</p>
    </div>
  </div>
</body>
</html>
    `;

    await base44.integrations.Core.SendEmail({
      to: customerEmail,
      subject,
      body,
      from_name: "Astomed Servicerapporter"
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});