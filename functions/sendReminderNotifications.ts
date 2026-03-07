import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can trigger reminders
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get reminder settings
    const settings = await base44.entities.ReminderSettings.list();
    if (settings.length === 0 || !settings[0].enabled) {
      return Response.json({ message: 'Reminders are disabled', sent: 0 });
    }

    const config = settings[0];
    const sendEmail = config.send_email !== false;
    const sendInapp = config.send_inapp !== false; // default true if not set
    const daysBeforeString = config.days_before || 3;
    const reminderTime = config.reminder_time || '09:00';

    // Calculate date range
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + parseInt(daysBeforeString));

    // Get service records that match criteria
    const allRecords = await base44.asServiceRole.entities.ServiceRecord.list('-service_date', 1000);
    
    let remindersToSend = [];

    for (const record of allRecords) {
      // Check for upcoming service
      if (config.reminder_type === 'upcoming_service' || config.reminder_type === 'both') {
        if (record.service_date) {
          const serviceDate = new Date(record.service_date);
          if (
            serviceDate.toDateString() === targetDate.toDateString() &&
            ['pending', 'in_progress'].includes(record.status)
          ) {
            remindersToSend.push({
              record_id: record.id,
              customer_id: record.customer_id,
              type: 'upcoming_service',
              service_date: record.service_date
            });
          }
        }
      }

      // Check for pending quotes
      if ((config.reminder_type === 'pending_quotes' || config.reminder_type === 'both') && config.include_pending_quotes) {
        if (record.quote_sent && record.quote_approved === 'pending') {
          remindersToSend.push({
            record_id: record.id,
            customer_id: record.customer_id,
            type: 'pending_quote'
          });
        }
      }
    }

    // Send notifications
    let sentCount = 0;
    const sentRecordIds = new Set();

    for (const reminder of remindersToSend) {
      // Avoid duplicate notifications for same record
      if (sentRecordIds.has(reminder.record_id)) continue;

      const customer = await base44.asServiceRole.entities.Customer.get(reminder.customer_id);
      const record = await base44.asServiceRole.entities.ServiceRecord.get(reminder.record_id);
      const machine = await base44.asServiceRole.entities.Machine.get(record.machine_id);

      if (!customer || !customer.email) continue;

      let title, message;
      if (reminder.type === 'upcoming_service') {
        title = 'Påminnelse: Kommande serviceärende';
        message = `Serviceärende för ${machine.model} är planerat till ${reminder.service_date}. Var beredd för servicen.`;
      } else {
        title = 'Påminnelse: Offert väntar på godkännande';
        message = `Din offert för ${machine.model} väntar på ditt godkännande. Vänligen granska och svara på offerten.`;
      }

      // Create in-app notification if enabled
      if (sendInapp) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: customer.email,
          title,
          message,
          type: 'info',
          related_entity: 'ServiceRecord',
          related_entity_id: reminder.record_id,
          is_read: false
        });
      }

      // Send email if enabled
      if (sendEmail) {
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1b3a3a; background: #f4f6f4; margin: 0; padding: 0; }
    .container { max-width: 620px; margin: 0 auto; padding: 24px; }
    .header { background: #1b3a3a; color: white; padding: 32px 28px; border-radius: 10px 10px 0 0; text-align: center; }
    .logo-img { max-width: 160px; height: auto; margin-bottom: 12px; }
    .logo-text { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
    .header-subtitle { font-size: 13px; color: #7aadad; }
    .content { background: white; padding: 32px; border-left: 1px solid #dce8e8; border-right: 1px solid #dce8e8; }
    .reminder-box { background: ${reminder.type === 'upcoming_service' ? '#e8f7ee' : '#fffbeb'}; border-left: 4px solid ${reminder.type === 'upcoming_service' ? '#22c55e' : '#f59e0b'}; padding: 16px 18px; border-radius: 6px; margin: 20px 0; }
    .reminder-box strong { display: block; margin-bottom: 6px; font-size: 15px; color: ${reminder.type === 'upcoming_service' ? '#166534' : '#92400e'}; }
    .reminder-box p { margin: 0; font-size: 14px; color: ${reminder.type === 'upcoming_service' ? '#166534' : '#92400e'}; }
    .footer { background: #f0f5f5; padding: 20px 28px; border-radius: 0 0 10px 10px; border: 1px solid #dce8e8; border-top: none; font-size: 12px; color: #6b8f8f; line-height: 1.8; }
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
      <div class="header-subtitle">Påminnelse från Astomed</div>
    </div>
    <div class="content">
      <p>Hej ${customer.contact_person || customer.company_name || 'kund'},</p>
      
      <div class="reminder-box">
        <strong>${title}</strong>
        <p>${message}</p>
      </div>
      
      <p>Vi rekommenderar dig att se över detta snarast för att undvika förseningar.</p>
      
      <div style="text-align: center;">
        <a href="${process.env.BASE44_APP_URL || 'https://astomed-pro.base44.app'}/login" class="cta-btn">Logga in på kundportalen</a>
      </div>
      
      <p>Har du frågor? Kontakta oss på <a href="mailto:info@astomed.se" style="color: #3a9e9e; text-decoration: none;">info@astomed.se</a> eller ring 08 – 410 779 00.</p>
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
          from_name: "Astomed Service"
        });
      }

      sentRecordIds.add(reminder.record_id);
      sentCount++;
    }

    // Update last run time
    if (settings[0]) {
      await base44.asServiceRole.entities.ReminderSettings.update(settings[0].id, {
        last_reminder_run: new Date().toISOString()
      });
    }

    return Response.json({
      message: 'Reminders sent successfully',
      sent: sentCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});