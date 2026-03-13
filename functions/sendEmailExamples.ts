import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const emailTemplate = (title, content, contactInfo = true) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f6f4;">
    <div style="background: linear-gradient(135deg, #1b3a3a 0%, #254f4f 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
      <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69a9446fcb1cd4ab529479ba/bc8394ee5_channels4_profile-2.jpg" alt="Astomed" style="width: 80px; height: 80px; margin-bottom: 15px;" />
      <h1 style="color: white; margin: 0; font-size: 24px;">${title}</h1>
    </div>
    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
      ${content}
      ${contactInfo ? `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #6b8f8f; font-size: 14px;">
            <strong>Behöver du hjälp?</strong><br/>
            Tel: (+46) 08-410 77 900 (9.30-16, lunchstängt 12-13)<br/>
            E-post: kontakt@astomed.se
          </p>
        </div>
        <p style="color: #1b3a3a; margin-top: 20px;">
          Med vänliga hälsningar,<br/>
          <strong>Astomed Service Team</strong>
        </p>
      ` : ''}
    </div>
    <div style="text-align: center; padding: 20px; color: #8aabab; font-size: 12px;">
      <p>Astomed AB | Jägerhorns väg 5 | 141 75 Kungens kurva</p>
      <p>Tel: (+46) 08-410 77 900 | kontakt@astomed.se</p>
    </div>
  </div>
`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const payload = await req.json();
    const emailTo = payload.email_to;

    if (!emailTo) {
      return Response.json({ error: 'email_to is required' }, { status: 400 });
    }

    // Example 1: Service Request Confirmation
    await base44.integrations.Core.SendEmail({
      to: emailTo,
      from_name: "Astomed Service",
      subject: 'Bekräftelse - Din serviceförfrågan har mottagits',
      body: emailTemplate('Tack för din förfrågan!', `
        <p style="color: #1b3a3a; font-size: 16px; line-height: 1.6;">
          Hej,
        </p>
        <p style="color: #1b3a3a; font-size: 16px; line-height: 1.6;">
          Vi har mottagit din serviceförfrågan och en av våra specialister kommer att kontakta dig inom 1-2 arbetsdagar.
        </p>
        <div style="background: #e8f2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3a9e9e;">
          <h3 style="color: #1b3a3a; margin-top: 0;">Förfrågans detaljer:</h3>
          <p style="margin: 5px 0; color: #254f4f;"><strong>Maskin:</strong> Soprano ICE Platinum</p>
          <p style="margin: 5px 0; color: #254f4f;"><strong>Serienummer:</strong> ABC123456</p>
          <p style="margin: 5px 0; color: #254f4f;"><strong>Prioritet:</strong> Medel</p>
        </div>
        <h3 style="color: #1b3a3a;">Vad händer nu?</h3>
        <ul style="color: #254f4f; line-height: 1.8;">
          <li>En servicespecialist kontaktar dig inom 1-2 arbetsdagar</li>
          <li>Vi bokar in ett möte som passar dig</li>
          <li>Vi löser ditt ärende på ett professionellt sätt</li>
        </ul>
      `)
    });

    // Example 2: Service Reminder
    await base44.integrations.Core.SendEmail({
      to: emailTo,
      from_name: "Astomed Service",
      subject: 'Påminnelse: Din maskin behöver service snart',
      body: emailTemplate('Serviceunderhål på väg!', `
        <p style="color: #1b3a3a; font-size: 16px; line-height: 1.6;">
          Hej,
        </p>
        <p style="color: #1b3a3a; font-size: 16px; line-height: 1.6;">
          Vi vill påminna dig om att din maskin är förfallen för regelbundet underhål.
        </p>
        <div style="background: #e8f2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3a9e9e;">
          <h3 style="color: #1b3a3a; margin-top: 0;">Maskinuppgifter:</h3>
          <p style="margin: 5px 0; color: #254f4f;"><strong>Maskin:</strong> Soprano ICE Platinum</p>
          <p style="margin: 5px 0; color: #254f4f;"><strong>Serienummer:</strong> ABC123456</p>
          <p style="margin: 5px 0; color: #254f4f;"><strong>Nästa servicedatum:</strong> 2026-03-20</p>
        </div>
        <p style="color: #1b3a3a; font-size: 16px; line-height: 1.6;">
          Regelbundna servicebesök säkerställer optimal prestanda och säkerhet. Boka ditt möte idag för att undvika stillestånd.
        </p>
      `)
    });

    // Example 3: Quote/Kostnadsförslag
    await base44.integrations.Core.SendEmail({
      to: emailTo,
      from_name: "Astomed Service",
      subject: 'Kostnadsförslag för servicearbete',
      body: emailTemplate('Din offert är klar!', `
        <p style="color: #1b3a3a; font-size: 16px; line-height: 1.6;">
          Hej,
        </p>
        <p style="color: #1b3a3a; font-size: 16px; line-height: 1.6;">
          Vi har uppskattat kostnaden för det servicearbete som diskuterades. Se detaljer nedan:
        </p>
        <div style="background: #e8f2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3a9e9e;">
          <h3 style="color: #1b3a3a; margin-top: 0;">Kostnadsförslag:</h3>
          <p style="margin: 8px 0; color: #254f4f;">Arbetstyp: Regelbundet underhål</p>
          <p style="margin: 8px 0; color: #254f4f;">Arbetstimmar: 3 timmar @ 1 500 kr/tim = 4 500 kr</p>
          <p style="margin: 8px 0; color: #254f4f;">Reservdelar: 2 000 kr</p>
          <p style="margin: 8px 0; color: #254f4f;">Resor: 1 000 kr</p>
          <hr style="border: none; border-top: 1px solid #254f4f; margin: 12px 0;">
          <p style="margin: 8px 0; color: #1b3a3a;"><strong>TOTALT: 7 500 kr (exkl. moms)</strong></p>
          <p style="margin: 12px 0 0 0; color: #6b8f8f; font-size: 12px;">Denna offert är giltig i 30 dagar.</p>
        </div>
        <p style="color: #1b3a3a; font-size: 16px; line-height: 1.6;">
          Godkänner du detta kostnadsförslag? Svara gärna på detta mejl eller ring oss direkt.
        </p>
      `)
    });

    // Example 4: Service Contract Offer
    await base44.integrations.Core.SendEmail({
      to: emailTo,
      from_name: "Astomed Service",
      subject: 'Serviceavtal - Kostnadsfri konsultation',
      body: emailTemplate('Skydda din investering!', `
        <p style="color: #1b3a3a; font-size: 16px; line-height: 1.6;">
          Hej,
        </p>
        <p style="color: #1b3a3a; font-size: 16px; line-height: 1.6;">
          Tack för intresset för serviceavtal från Astomed. Vi erbjuder två nivåer anpassade efter dina behov:
        </p>
        <div style="background: #e8f2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3a9e9e;">
          <h3 style="color: #1b3a3a; margin-top: 0;">BASIC SERVICEAVTAL - 600 kr/månad</h3>
          <ul style="color: #254f4f; line-height: 1.6; padding-left: 20px; margin: 10px 0;">
            <li>✓ Två schemalagda servicebesök per år</li>
            <li>✓ Obegränsade telefonkonsultationer</li>
            <li>✓ 15% rabatt på reservdelar</li>
            <li>✓ Prioriterad support</li>
          </ul>
          
          <h3 style="color: #1b3a3a; margin-top: 20px;">PREMIUM SERVICEAVTAL - 999 kr/månad</h3>
          <ul style="color: #254f4f; line-height: 1.6; padding-left: 20px; margin: 10px 0;">
            <li>✓ Fyra schemalagda servicebesök per år</li>
            <li>✓ Obegränsade telefonkonsultationer</li>
            <li>✓ 25% rabatt på reservdelar</li>
            <li>✓ Prioriterad support</li>
            <li>✓ Kostnadsfri resurs för mindre reparationer</li>
          </ul>
        </div>
        <p style="color: #1b3a3a; font-size: 16px; line-height: 1.6;">
          Alla avtal är bindande för 12 månader. Diskutera gärna vilken plan som passar dig bäst!
        </p>
      `)
    });

    // Example 5: Service Report/Rapport
    await base44.integrations.Core.SendEmail({
      to: emailTo,
      from_name: "Astomed Service",
      subject: 'Servicerapport - Servicebesök avslutad',
      body: emailTemplate('Ditt servicebesök är klart!', `
        <p style="color: #1b3a3a; font-size: 16px; line-height: 1.6;">
          Hej,
        </p>
        <p style="color: #1b3a3a; font-size: 16px; line-height: 1.6;">
          Här är rapporten från ditt servicebesök. Din maskin är nu optimerad och redo för fortsatt drift.
        </p>
        <div style="background: #e8f2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3a9e9e;">
          <h3 style="color: #1b3a3a; margin-top: 0;">Servicerapport:</h3>
          <p style="margin: 8px 0; color: #254f4f;"><strong>Datum:</strong> 2026-03-10</p>
          <p style="margin: 8px 0; color: #254f4f;"><strong>Tekniker:</strong> Anders Svensson</p>
          <p style="margin: 8px 0; color: #254f4f;"><strong>Maskin:</strong> Soprano ICE Platinum</p>
          
          <h4 style="color: #1b3a3a; margin-top: 15px; margin-bottom: 8px;">Utförda arbeten:</h4>
          <ul style="color: #254f4f; line-height: 1.6; padding-left: 20px; margin: 0;">
            <li>Rensat och inspekterat optik-system</li>
            <li>Bytt vätskefilter</li>
            <li>Uppdaterat firmware till senaste version</li>
            <li>Genomfört säkerhetskontroll</li>
          </ul>
          
          <h4 style="color: #1b3a3a; margin-top: 15px; margin-bottom: 8px;">Reservdelar:</h4>
          <p style="margin: 4px 0; color: #254f4f;">Vätskefilter (2 st) - 800 kr</p>
          <p style="margin: 4px 0; color: #254f4f;">Optik-kit - 1 200 kr</p>
          
          <hr style="border: none; border-top: 1px solid #254f4f; margin: 12px 0;">
          <p style="margin: 8px 0; color: #1b3a3a;"><strong>Totalkostnad: 5 750 kr (exkl. moms)</strong></p>
          <p style="margin: 8px 0; color: #254f4f;">Nästa rekommenderad service: 2026-09-10</p>
        </div>
      `)
    });

    // Example 6: Contract Renewal Reminder
    await base44.integrations.Core.SendEmail({
      to: emailTo,
      from_name: "Astomed Service",
      subject: 'Bekräftelse: Ditt serviceavtal förnyades',
      body: emailTemplate('Avtalet är förnyat!', `
        <p style="color: #1b3a3a; font-size: 16px; line-height: 1.6;">
          Hej,
        </p>
        <p style="color: #1b3a3a; font-size: 16px; line-height: 1.6;">
          Vi bekräftar att ditt serviceavtal just förnyades. Du är nu skyddad med full support och underhål!
        </p>
        <div style="background: #e8f2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3a9e9e;">
          <h3 style="color: #1b3a3a; margin-top: 0;">Avtalsdetaljer:</h3>
          <p style="margin: 8px 0; color: #254f4f;"><strong>Maskin:</strong> Soprano ICE Platinum (SN: ABC123456)</p>
          <p style="margin: 8px 0; color: #254f4f;"><strong>Avtalsnivå:</strong> BASIC - 600 kr/månad</p>
          <p style="margin: 8px 0; color: #254f4f;"><strong>Startdatum:</strong> 2026-03-13</p>
          <p style="margin: 8px 0; color: #254f4f;"><strong>Slutdatum:</strong> 2027-03-13</p>
          
          <h4 style="color: #1b3a3a; margin-top: 15px; margin-bottom: 8px;">Inkluderat i ditt avtal:</h4>
          <ul style="color: #254f4f; line-height: 1.6; padding-left: 20px; margin: 0;">
            <li>✓ Två schemalagda servicebesök per år</li>
            <li>✓ Obegränsade telefonkonsultationer</li>
            <li>✓ 15% rabatt på reservdelar</li>
            <li>✓ Prioriterad support</li>
          </ul>
          <p style="margin: 12px 0 0 0; color: #254f4f;"><strong>Nästa service:</strong> 2026-04-15</p>
        </div>
        <p style="color: #1b3a3a; font-size: 16px; line-height: 1.6;">
          Tack för att du väljer Astomed som din servicepart!
        </p>
      `)
    });

    // Example 7: Payment Confirmation
    await base44.integrations.Core.SendEmail({
      to: emailTo,
      from_name: "Astomed Ekonomi",
      subject: 'Betalningsbekräftelse - Astomed',
      body: emailTemplate('Din betalning är genomförd!', `
        <p style="color: #1b3a3a; font-size: 16px; line-height: 1.6;">
          Hej,
        </p>
        <p style="color: #1b3a3a; font-size: 16px; line-height: 1.6;">
          Vi bekräftar att din betalning har mottagits och behandlats.
        </p>
        <div style="background: #e8f2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3a9e9e;">
          <h3 style="color: #1b3a3a; margin-top: 0;">Betalningsdetaljer:</h3>
          <p style="margin: 8px 0; color: #254f4f;"><strong>Betalningsdatum:</strong> 2026-03-13</p>
          <p style="margin: 8px 0; color: #254f4f;"><strong>Referens:</strong> FAC-2026-0015</p>
          <p style="margin: 8px 0; color: #254f4f;"><strong>Belopp:</strong> 7 500 kr (exkl. moms)</p>
          <p style="margin: 8px 0; color: #254f4f;"><strong>Status:</strong> Genomförd ✓</p>
        </div>
        <p style="color: #1b3a3a; font-size: 16px; line-height: 1.6;">
          Din faktura är bifogad detta mejl. Tack för din betalning!
        </p>
      `)
    });

    return Response.json({
      success: true,
      message: `7 exempel på systemmail skickade till ${emailTo}`,
      examples: [
        'Service Request Confirmation',
        'Service Reminder',
        'Quote/Kostnadsförslag',
        'Service Contract Offer',
        'Service Report',
        'Contract Renewal Reminder',
        'Payment Confirmation'
      ]
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});