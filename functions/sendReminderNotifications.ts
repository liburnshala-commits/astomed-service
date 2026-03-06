import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can trigger reminders
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get reminder settings (use first/default settings for the app)
    const settings = await base44.entities.ReminderSettings.list();
    if (settings.length === 0 || !settings[0].enabled) {
      return Response.json({ message: 'Reminders are disabled', sent: 0 });
    }

    const config = settings[0];
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

      // Create notification in system
      await base44.asServiceRole.entities.Notification.create({
        user_email: customer.email,
        title,
        message,
        type: 'info',
        related_entity: 'ServiceRecord',
        related_entity_id: reminder.record_id,
        is_read: false
      });

      // Send email if enabled
      if (config.send_email) {
        await base44.integrations.Core.SendEmail({
          to: customer.email,
          subject: title,
          body: `${message}\n\nVänlig hälsning,\nAstomed Service`
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