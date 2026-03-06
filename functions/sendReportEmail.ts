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
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1b3a3a; line-height: 1.6; background: #f4f6f4; margin: 0; padding: 0; }
    .container { max-width: 620px; margin: 0 auto; padding: 24px; }
    .header { background: #1b3a3a; color: white; padding: 32px 28px; border-radius: 10px 10px 0 0; text-align: center; }
    .logo-img { max-width: 160px; height: auto; margin-bottom: 12px; }
    .logo-text { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
    .header-subtitle { font-size: 13px; color: #7aadad; }
    .content { background: white; padding: 32px; border-left: 1px solid #dce8e8; border-right: 1px solid #dce8e8; }
    .report-info { background: #e8f2f2; padding: 16px; border-left: 4px solid #3a9e9e; margin: 20px 0; border-radius: 6px; }
    .report-info strong { display: block; margin-bottom: 8px; font-size: 15px; }
    .report-info p { margin: 4px 0; font-size: 13px; }
    .footer { background: #f0f5f5; padding: 20px 28px; border-radius: 0 0 10px 10px; border: 1px solid #dce8e8; border-top: none; font-size: 12px; color: #6b8f8f; line-height: 1.8; }
    .contact-box { background: #f4f9f9; padding: 16px; border-radius: 6px; margin-top: 20px; font-size: 13px; border: 1px solid #e8f2f2; }
    .cta-btn { display: inline-block; background: #3a9e9e; color: white; padding: 13px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 24px 0; }
    .cta-btn:hover { background: #2d8080; }
    p { margin: 0 0 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://uploads.astomed.se/logo.png" alt="Astomed" class="logo-img">
      <div class="logo-text">Astomed</div>
      <div class="header-subtitle">Servicerapport</div>
    </div>
    <div class="content">
      <p>Hej ${customerName || 'kund'},</p>
      <p>Tack för att ni anlitar Astomed Klinikutrustning Sverige AB för er serviceutrustning. Här är er senaste servicerapport.</p>
      
      <div class="report-info">
        <strong>Rapportöversikt</strong>
        <p>Filter: ${filterLabel}</p>
        <p>Antal serviceärenden: ${recordCount}</p>
      </div>
      
      <p>Rapporten är tillgänglig i er kundportal. Logga in för att se fullständig information om serviceärendena, historik och dina maskiner.</p>
      
      <div style="text-align: center;">
        <a href="${process.env.BASE44_APP_URL || 'https://astomed-pro.base44.app'}/login" class="cta-btn">Öppna kundportalen</a>
      </div>
      
      <p>Har ni frågor om rapporten eller era serviceärenden är ni välkomna att kontakta oss – vi finns här för att hjälpa.</p>
      
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