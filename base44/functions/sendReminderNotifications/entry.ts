import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all machines and customers
    const [machines, customers] = await Promise.all([
      base44.asServiceRole.entities.Machine.list(),
      base44.asServiceRole.entities.Customer.list()
    ]);

    let sentCount = 0;
    const sentRecordIds = new Set();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysUntil = (dateStr) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      d.setHours(0, 0, 0, 0);
      return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    for (const machine of machines) {
      if (!machine.next_service_date || machine.status === 'inactive' || machine.is_deleted) continue;

      const customer = customers.find(c => c.id === machine.customer_id);
      if (!customer || customer.reminder_enabled === false) continue;

      // Ensure customer has either email or phone
      if (!customer.email && !customer.phone) continue;

      const targetDays = customer.reminder_days_before || 60;
      const daysLeft = daysUntil(machine.next_service_date);

      // We only send exactly N days before to prevent spamming everyday
      if (daysLeft === targetDays) {
        
        // Generate portal token if needed
        let token = customer.portal_token;
        if (!token) {
          token = Math.random().toString(36).substring(2, 15);
          await base44.asServiceRole.entities.Customer.update(customer.id, { portal_token: token });
        }
        
        const appUrl = Deno.env.get("APP_URL") || "https://serviceastomed.se";
        const portalUrl = `${appUrl}/PublicServiceBooking#anmalan`;
        
        const dateFormatted = new Date(machine.next_service_date).toLocaleDateString('sv-SE');
        const title = 'Påminnelse: Dags att boka service';
        
        let messageText = `Hej!\n\nDet börjar bli dags att boka service för er maskin ${machine.model} (SN: ${machine.serial_number || 'Okänd'}).\n\n`;
        messageText += `Enligt rekommenderat intervall bör nästa service utföras senast ${dateFormatted}.\n\n`;
        messageText += `Ni kan enkelt boka er service via vår kundportal: ${portalUrl}\n\n`;
        messageText += `Med vänlig hälsning,\nAstomed Service`;

        // Send Email
        if (customer.email) {
          try {
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
    .footer { background: #f0f5f5; padding: 20px 28px; border-radius: 0 0 10px 10px; border: 1px solid #dce8e8; border-top: none; font-size: 12px; color: #6b8f8f; line-height: 1.8; }
    .cta-btn { display: inline-block; background: #3a9e9e; color: white; padding: 13px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 24px 0; text-align: center; }
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
        <p>Det börjar bli dags att boka service för er maskin <b>${machine.model}</b> (SN: ${machine.serial_number || 'Okänd'}). Enligt rekommenderat intervall bör nästa service utföras senast ${dateFormatted}.</p>
      </div>
      <p>Ni kan enkelt boka er service via vår kundportal (ingen inloggning krävs):</p>
      <a href="${portalUrl}" class="cta-btn">Boka Service Nu</a>
      <p>Har ni frågor? Kontakta oss på <a href="mailto:info@astomed.se" style="color: #3a9e9e; text-decoration: none;">info@astomed.se</a> eller ring 08 – 410 779 00.</p>
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
          } catch (emailError) {
            console.log(`Email skipped/failed for ${customer.email}: ${emailError.message}`);
          }
        }

        // Send SMS via 46elks if phone is available
        if (customer.phone) {
            try {
                const elksUser = Deno.env.get("ELKS_USERNAME");
                const elksPass = Deno.env.get("ELKS_PASSWORD");
                if (elksUser && elksPass) {
                    const smsText = `Astomed: Dags att boka service för ${machine.model} (senast ${dateFormatted}). Boka smidigt här: https://serviceastomed.se/PublicServiceBooking#anmalan`;
                    
                    const params = new URLSearchParams();
                    params.append('from', '+46761616855');
                    params.append('to', customer.phone);
                    params.append('message', smsText);

                    await fetch('https://api.46elks.com/a1/sms', {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Basic ' + btoa(`${elksUser}:${elksPass}`),
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: params
                    });
                }
            } catch (smsError) {
                console.log(`SMS failed for ${customer.phone}: ${smsError.message}`);
            }
        }
        
        sentCount++;
      }
    }

    return Response.json({
      message: 'Reminders processed successfully',
      sent: sentCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});