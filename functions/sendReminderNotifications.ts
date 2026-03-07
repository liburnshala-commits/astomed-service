import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const settings = await base44.entities.ReminderSettings.list();
    if (settings.length === 0 || !settings[0].enabled) {
      return Response.json({ message: 'Reminders are disabled', sent: 0 });
    }

    const config = settings[0];
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + parseInt(config.days_before || 3));

    const allRecords = await base44.asServiceRole.entities.ServiceRecord.list('-service_date', 1000);

    // Load all notification preferences once
    const allPrefs = await base44.asServiceRole.entities.NotificationPreferences.list();
    const prefsMap = {};
    for (const p of allPrefs) {
      prefsMap[p.user_email] = p;
    }

    // Load all customers once
    const allCustomers = await base44.asServiceRole.entities.Customer.list();
    const customerMap = {};
    for (const c of allCustomers) {
      customerMap[c.id] = c;
    }

    // Load all machines once
    const allMachines = await base44.asServiceRole.entities.Machine.list();
    const machineMap = {};
    for (const m of allMachines) {
      machineMap[m.id] = m;
    }

    let sentCount = 0;
    const sentRecordIds = new Set();

    for (const record of allRecords) {
      if (sentRecordIds.has(record.id)) continue;

      let reminderType = null;

      // Check upcoming service
      if (config.reminder_type === 'upcoming_service' || config.reminder_type === 'both') {
        if (record.service_date) {
          const serviceDate = new Date(record.service_date);
          if (
            serviceDate.toDateString() === targetDate.toDateString() &&
            ['pending', 'in_progress'].includes(record.status)
          ) {
            reminderType = 'upcoming_service';
          }
        }
      }

      // Check pending quotes
      if (!reminderType && (config.reminder_type === 'pending_quotes' || config.reminder_type === 'both') && config.include_pending_quotes) {
        if (record.quote_sent && record.quote_approved === 'pending') {
          reminderType = 'pending_quote';
        }
      }

      if (!reminderType) continue;

      const customer = customerMap[record.customer_id];
      const machine = machineMap[record.machine_id];

      if (!customer || !customer.email) continue;

      // Get user preferences for this customer's email (default: all enabled)
      const userPrefs = prefsMap[customer.email] || { in_app_enabled: true, email_enabled: true, notify_upcoming_service: true, notify_quote_pending: true };

      // Check event-type preference
      if (reminderType === 'upcoming_service' && !userPrefs.notify_upcoming_service) continue;
      if (reminderType === 'pending_quote' && !userPrefs.notify_quote_pending) continue;

      const machineLabel = machine?.model || 'din maskin';

      let title, message;
      if (reminderType === 'upcoming_service') {
        title = 'Påminnelse: Kommande serviceärende';
        message = `Serviceärende för ${machineLabel} är planerat till ${record.service_date}. Var beredd för servicen.`;
      } else {
        title = 'Påminnelse: Offert väntar på godkännande';
        message = `Din offert för ${machineLabel} väntar på ditt godkännande. Vänligen granska och svara på offerten.`;
      }

      // Send in-app notification if enabled
      if (userPrefs.in_app_enabled !== false) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: customer.email,
          title,
          message,
          type: 'info',
          related_entity: 'ServiceRecord',
          related_entity_id: record.id,
          is_read: false
        });
      }

      // Send email if enabled globally (settings) AND user preference
      if (config.send_email && userPrefs.email_enabled !== false) {
        const isUpcoming = reminderType === 'upcoming_service';
        const accentColor = isUpcoming ? '#22c55e' : '#f59e0b';
        const bgColor = isUpcoming ? '#e8f7ee' : '#fffbeb';
        const textColor = isUpcoming ? '#166534' : '#92400e';

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
    .reminder-box { background: ${bgColor}; border-left: 4px solid ${accentColor}; padding: 16px 18px; border-radius: 6px; margin: 20px 0; }
    .reminder-box strong { display: block; margin-bottom: 6px; font-size: 15px; color: ${textColor}; }
    .reminder-box p { margin: 0; font-size: 14px; color: ${textColor}; }
    .footer { background: #f0f5f5; padding: 20px 28px; border-radius: 0 0 10px 10px; border: 1px solid #dce8e8; border-top: none; font-size: 12px; color: #6b8f8f; }
    .cta-btn { display: inline-block; background: #3a9e9e; color: white; padding: 13px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 24px 0; }
    p { margin: 0 0 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
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
        <a href="https://astomed-pro.base44.app/login" class="cta-btn">Logga in på kundportalen</a>
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

      sentRecordIds.add(record.id);
      sentCount++;
    }

    // Update last run time
    await base44.asServiceRole.entities.ReminderSettings.update(settings[0].id, {
      last_reminder_run: new Date().toISOString()
    });

    return Response.json({
      message: 'Reminders sent successfully',
      sent: sentCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});