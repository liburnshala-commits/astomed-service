import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow both: manual admin calls AND scheduled automation (no user context)
    let isScheduled = false;
    try {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    } catch (_) {
      // No user context = called by scheduler, allow it
      isScheduled = true;
    }

    // Get reminder settings (use service role for scheduled calls)
    const settings = await base44.asServiceRole.entities.ReminderSettings.list();
    if (settings.length === 0 || !settings[0].enabled) {
      return Response.json({ message: 'Reminders are disabled', sent: 0 });
    }

    const config = settings[0];
    const sendEmail = config.send_email !== false;
    const sendInapp = config.send_inapp !== false;
    const daysBefore = parseInt(config.days_before) || 3;

    // Calculate target date (today + daysBefore)
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + daysBefore);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    // Get all service records
    const allRecords = await base44.asServiceRole.entities.ServiceRecord.list('-service_date', 1000);

    let remindersToSend = [];

    for (const record of allRecords) {
      // --- Check next_service_date for upcoming scheduled service ---
      if (config.reminder_type === 'upcoming_service' || config.reminder_type === 'both') {
        if (record.next_service_date) {
          const nextServiceStr = record.next_service_date.split('T')[0];
          if (nextServiceStr === targetDateStr) {
            remindersToSend.push({
              record_id: record.id,
              customer_id: record.customer_id,
              machine_id: record.machine_id,
              type: 'upcoming_service',
              next_service_date: record.next_service_date
            });
          }
        }
      }

      // --- Check for pending quotes ---
      if ((config.reminder_type === 'pending_quotes' || config.reminder_type === 'both') && config.include_pending_quotes) {
        if (record.quote_sent && record.quote_approved === 'pending') {
          remindersToSend.push({
            record_id: record.id,
            customer_id: record.customer_id,
            machine_id: record.machine_id,
            type: 'pending_quote'
          });
        }
      }
    }

    // Send notifications, dedup by record_id
    let sentCount = 0;
    const sentRecordIds = new Set();

    for (const reminder of remindersToSend) {
      if (sentRecordIds.has(reminder.record_id + '_' + reminder.type)) continue;

      const customer = await base44.asServiceRole.entities.Customer.get(reminder.customer_id);
      const machine = await base44.asServiceRole.entities.Machine.get(reminder.machine_id);

      if (!customer || !customer.email) continue;

      let title, message;
      if (reminder.type === 'upcoming_service') {
        const dateFormatted = new Date(reminder.next_service_date).toLocaleDateString('sv-SE');
        title = 'Påminnelse: Planerad service närmar sig';
        message = `Planerad service för ${machine?.model || 'din maskin'} är schemalagd till ${dateFormatted}. Vänligen se till att maskinen är tillgänglig för service.`;
      } else {
        title = 'Påminnelse: Offert väntar på godkännande';
        message = `Din offert för ${machine?.model || 'din maskin'} väntar på ditt godkännande. Vänligen granska och svara på offerten.`;
      }

      // In-app notification
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

      // Email - only send to registered users
      if (sendEmail) {
        try {
          // Check if customer email is a registered user
          const users = await base44.asServiceRole.entities.User.filter({ email: customer.email });
          
          if (users.length > 0) {
            const accentColor = reminder.type === 'upcoming_service' ? '#22c55e' : '#f59e0b';
            const bgColor = reminder.type === 'upcoming_service' ? '#e8f7ee' : '#fffbeb';
            const textColor = reminder.type === 'upcoming_service' ? '#166534' : '#92400e';

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
    .footer { background: #f0f5f5; padding: 20px 28px; border-radius: 0 0 10px 10px; border: 1px solid #dce8e8; border-top: none; font-size: 12px; color: #6b8f8f; line-height: 1.8; }
    .cta-btn { display: inline-block; background: #3a9e9e; color: white; padding: 13px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 24px 0; }
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
        <strong>${title}</strong>
        <p>${message}</p>
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

            await base44.functions.invoke('sendSmtpEmail', {
              to: customer.email,
              subject: title,
              body: emailHtml,
              from_name: "Astomed Service"
            });
          }
        } catch (emailError) {
          // Ignore email errors for non-registered users, in-app notification was already sent
          console.log(`Email skipped for ${customer.email}: ${emailError.message}`);
        }
      }

      sentRecordIds.add(reminder.record_id + '_' + reminder.type);
      sentCount++;
    }

    // Update last run timestamp
    if (settings[0]) {
      await base44.asServiceRole.entities.ReminderSettings.update(settings[0].id, {
        last_reminder_run: new Date().toISOString()
      });
    }

    return Response.json({
      message: 'Reminders sent successfully',
      sent: sentCount,
      checked: allRecords.length,
      target_date: targetDateStr,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});