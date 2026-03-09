import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const DAYS_BEFORE = 45;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow admin manual calls or scheduled (no user context)
    try {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    } catch (_) {
      // No user context = called by scheduler, allow
    }

    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + DAYS_BEFORE);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    // Fetch all non-completed service records with a next_service_date
    const allRecords = await base44.asServiceRole.entities.ServiceRecord.list('-service_date', 1000);

    const due = allRecords.filter(r =>
      r.next_service_date &&
      r.next_service_date.split('T')[0] === targetDateStr &&
      r.status !== 'completed' &&
      r.status !== 'invoiced'
    );

    let sentCount = 0;

    for (const record of due) {
      const [customer, machine] = await Promise.all([
        base44.asServiceRole.entities.Customer.get(record.customer_id),
        base44.asServiceRole.entities.Machine.get(record.machine_id)
      ]);

      if (!customer?.email) continue;

      const dateFormatted = new Date(record.next_service_date).toLocaleDateString('sv-SE');
      const machineName = machine?.model || 'din maskin';
      const serialNumber = machine?.serial_number ? ` (SN: ${machine.serial_number})` : '';

      const title = `Påminnelse: Service planerad om 45 dagar`;
      const message = `Din ${machineName}${serialNumber} är planerad för service ${dateFormatted}. Vänligen säkerställ att maskinen är tillgänglig.`;

      // In-app notification
      await base44.asServiceRole.entities.Notification.create({
        user_email: customer.email,
        title,
        message,
        type: 'info',
        related_entity: 'ServiceRecord',
        related_entity_id: record.id,
        is_read: false
      });

      // Email
      const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1b3a3a; background: #f4f6f4; margin: 0; padding: 0; }
    .container { max-width: 620px; margin: 0 auto; padding: 24px; }
    .header { background: #1b3a3a; color: white; padding: 32px 28px; border-radius: 10px 10px 0 0; text-align: center; }
    .logo-text { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
    .header-subtitle { font-size: 13px; color: #7aadad; }
    .content { background: white; padding: 32px; border-left: 1px solid #dce8e8; border-right: 1px solid #dce8e8; }
    .reminder-box { background: #e8f7ee; border-left: 4px solid #22c55e; padding: 16px 18px; border-radius: 6px; margin: 20px 0; }
    .reminder-box strong { display: block; margin-bottom: 6px; font-size: 15px; color: #166534; }
    .reminder-box p { margin: 0; font-size: 14px; color: #166534; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f5f5; font-size: 14px; }
    .info-label { color: #6b8f8f; }
    .info-value { font-weight: 600; color: #1b3a3a; }
    .footer { background: #f0f5f5; padding: 20px 28px; border-radius: 0 0 10px 10px; border: 1px solid #dce8e8; border-top: none; font-size: 12px; color: #6b8f8f; line-height: 1.8; }
    p { margin: 0 0 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-text">Astomed</div>
      <div class="header-subtitle">Servicehantering</div>
    </div>
    <div class="content">
      <p>Hej ${customer.contact_person || customer.company_name || 'kund'},</p>
      <div class="reminder-box">
        <strong>⏰ Service planerad om 45 dagar</strong>
        <p>${message}</p>
      </div>
      <div style="margin: 20px 0;">
        <div class="info-row"><span class="info-label">Maskin</span><span class="info-value">${machineName}${serialNumber}</span></div>
        <div class="info-row"><span class="info-label">Planerat datum</span><span class="info-value">${dateFormatted}</span></div>
        ${customer.company_name ? `<div class="info-row"><span class="info-label">Kund</span><span class="info-value">${customer.company_name}</span></div>` : ''}
      </div>
      <p style="margin-top: 24px;">Har du frågor? Kontakta oss på <a href="mailto:info@astomed.se" style="color: #3a9e9e; text-decoration: none;">info@astomed.se</a> eller ring 08 – 410 779 00.</p>
    </div>
    <div class="footer">
      <p style="margin: 0;"><strong>Astomed Klinikutrustning Sverige AB</strong><br>
      Jägerhorns väg 3-5, 141 75 Kungens Kurva</p>
    </div>
  </div>
</body>
</html>`;

      await base44.integrations.Core.SendEmail({
        to: customer.email,
        subject: title,
        body: emailHtml,
        from_name: 'Astomed Service'
      });

      sentCount++;
    }

    return Response.json({
      message: 'Service due reminders sent',
      sent: sentCount,
      checked: allRecords.length,
      target_date: targetDateStr,
      days_before: DAYS_BEFORE,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});