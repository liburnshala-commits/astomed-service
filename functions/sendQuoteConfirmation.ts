import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { recordId } = await req.json();
    if (!recordId) return Response.json({ error: 'recordId saknas' }, { status: 400 });

    const record = await base44.entities.ServiceRecord.get(recordId);
    const machine = record.machine_id ? await base44.entities.Machine.get(record.machine_id) : null;
    const customer = record.customer_id ? await base44.entities.Customer.get(record.customer_id) : null;

    const formatSEK = (v) =>
      new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(v || 0);

    const partsRows = (record.parts_used || []).map(p => `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e8f2f2;">${p.part_name || ''}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e8f2f2;text-align:right;">${p.quantity || 1} st</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e8f2f2;text-align:right;">${formatSEK((p.unit_price || 0) * (p.quantity || 1))}</td>
      </tr>`).join('');

    const orderHtml = (recipientName, isCustomer) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1b3a3a; background: #f4f6f4; margin:0; padding:0; }
  .wrap { max-width:620px; margin:0 auto; padding:24px; }
  .header { background:#1b3a3a; color:#fff; padding:32px 28px; border-radius:10px 10px 0 0; text-align:center; }
  .logo-img { max-width:160px; height:auto; margin-bottom:12px; }
  .logo-text { font-size:24px; font-weight:700; letter-spacing:0.5px; margin-bottom:4px; }
  .tagline { font-size:13px; color:#7aadad; }
  .content { background:#fff; padding:32px; border-left:1px solid #dce8e8; border-right:1px solid #dce8e8; }
  .confirm-banner { background:#e8f7ee; border-left:4px solid #22c55e; padding:16px 18px; border-radius:6px; margin:20px 0; }
  .confirm-banner p { margin:0; color:#166534; font-size:14px; line-height:1.5; }
  .confirm-banner strong { font-size:16px; display:block; margin-bottom:6px; }
  .section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1.2px; color:#6b8f8f; margin:24px 0 12px; }
  .info-box { background:#f4f9f9; border-radius:8px; padding:16px; border:1px solid #e8f2f2; }
  .info-row { display:flex; justify-content:space-between; font-size:13px; padding:6px 0; line-height:1.6; }
  .info-row span:first-child { color:#6b8f8f; font-weight:500; }
  .info-row span:last-child { font-weight:600; color:#1b3a3a; }
  table { width:100%; border-collapse:collapse; font-size:13px; margin:16px 0; }
  thead tr { background:#f4f9f9; }
  th { padding:10px; text-align:left; color:#6b8f8f; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; border-bottom:2px solid #dce8e8; }
  td { padding:10px; border-bottom:1px solid #e8f2f2; }
  .total-row td { padding:12px 10px; font-weight:700; font-size:15px; color:#1b3a3a; border-top:2px solid #3a9e9e; background:#f4f9f9; }
  .note-box { background:#fffbeb; border:1px solid #fde68a; border-radius:6px; padding:14px 16px; margin-top:20px; font-size:13px; color:#92400e; line-height:1.5; }
  .cta-btn { display:inline-block; background:#3a9e9e; color:#fff; padding:13px 28px; border-radius:6px; text-decoration:none; font-weight:600; font-size:14px; margin:24px 0; }
  .cta-btn:hover { background:#2d8080; }
  .footer { background:#f0f5f5; padding:20px 28px; border-radius:0 0 10px 10px; border:1px solid #dce8e8; border-top:none; font-size:12px; color:#6b8f8f; line-height:1.8; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <img src="https://uploads.astomed.se/logo.png" alt="Astomed" class="logo-img">
    <div class="logo-text">Astomed</div>
    <div class="tagline">Klinikutrustning Sverige AB</div>
  </div>
  <div class="content">
    <p style="font-size:15px;">Hej ${recipientName || (isCustomer ? customer?.contact_person : record.technician_name) || 'där'},</p>

    <div class="confirm-banner">
      <strong>✅ Orderbekräftelse – kostnadsförslag godkänt</strong>
      <p>${isCustomer
        ? 'Du har godkänt kostnadsförslaget. Vi påbörjar arbetet inom kort.'
        : `Kunden <strong>${customer?.company_name || ''}</strong> har godkänt kostnadsförslaget. Ärendet är nu <strong>Pågående</strong>.`
      }</p>
    </div>

    <div class="section-title">Ärendeinformation</div>
    <div class="info-box">
      <div class="info-row"><span>Kund</span><span>${customer?.company_name || '–'}</span></div>
      <div class="info-row"><span>Maskin</span><span>${machine?.model || '–'}</span></div>
      <div class="info-row"><span>Serienummer</span><span>${machine?.serial_number || '–'}</span></div>
      <div class="info-row"><span>Tekniker</span><span>${record.technician_name || '–'}</span></div>
      <div class="info-row"><span>Servicedatum</span><span>${record.service_date || '–'}</span></div>
    </div>

    ${record.description ? `
    <div class="section-title">Beskrivning av arbete</div>
    <div class="info-box" style="font-size:13px;color:#254f4f;">${record.description}</div>
    ` : ''}

    ${(record.parts_used?.length > 0 || record.labor_hours) ? `
    <div class="section-title">Kostnadsspecifikation</div>
    <table>
      <thead><tr>
        <th>Post</th><th style="text-align:right;">Antal</th><th style="text-align:right;">Belopp</th>
      </tr></thead>
      <tbody>
        ${partsRows}
        ${record.labor_hours ? `
        <tr>
          <td style="padding:6px 10px;border-bottom:1px solid #e8f2f2;">Arbetstimmar (${record.labor_hours} tim)</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e8f2f2;text-align:right;">–</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e8f2f2;text-align:right;">${formatSEK(record.labor_cost)}</td>
        </tr>` : ''}
        <tr class="total-row">
          <td colspan="2">Totalt</td>
          <td style="text-align:right;">${formatSEK(record.total_cost)}</td>
        </tr>
      </tbody>
    </table>
    ` : `
    <div class="section-title">Totalt</div>
    <div class="info-box"><div class="info-row"><span>Kostnadsförslag</span><span>${formatSEK(record.total_cost)}</span></div></div>
    `}

    ${record.quote_note ? `
    <div class="note-box">💬 <strong>Kundens meddelande:</strong> "${record.quote_note}"</div>
    ` : ''}

    <div style="text-align:center;margin-top:24px;">
      <a href="https://app.base44.com" class="cta-btn">Öppna kundportalen</a>
    </div>

    <p style="font-size:13px;color:#6b8f8f;margin-top:16px;">Har du frågor? Kontakta oss på <a href="mailto:info@astomed.se" style="color:#3a9e9e;">info@astomed.se</a> eller 08 – 410 779 00.</p>
  </div>
  <div class="footer">
    <strong>Astomed Klinikutrustning Sverige AB</strong><br>
    Jägerhorns väg 3-5, 141 75 Kungens Kurva &nbsp;|&nbsp; www.astomed.se
  </div>
</div>
</body>
</html>`;

    const promises = [];

    // Email to customer
    if (customer?.email) {
      promises.push(base44.integrations.Core.SendEmail({
        to: customer.email,
        subject: `Orderbekräftelse – ${machine?.model || 'serviceärende'} (SN: ${machine?.serial_number || '–'})`,
        body: orderHtml(customer.contact_person, true),
        from_name: "Astomed Service"
      }));
    }

    // Email to technician (fetch their user email)
    if (record.technician_name) {
      // Try to find a user with matching full_name
      const users = await base44.asServiceRole.entities.User.list();
      const techUser = users.find(u => u.full_name === record.technician_name);
      if (techUser?.email) {
        promises.push(base44.integrations.Core.SendEmail({
          to: techUser.email,
          subject: `Order godkänd – ${customer?.company_name || ''} / ${machine?.model || ''} (SN: ${machine?.serial_number || '–'})`,
          body: orderHtml(record.technician_name, false),
          from_name: "Astomed Service"
        }));
      }
    }

    await Promise.all(promises);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});