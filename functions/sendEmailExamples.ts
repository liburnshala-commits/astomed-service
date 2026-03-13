import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

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
      subject: 'Bekräftelse: Din serviceförfrågan har mottagits - Astomed',
      body: `Hej!

Tack för din serviceförfrågan!

Vi har mottagit din förfrågan om service för din maskin och vår team kommer att kontakta dig inom 24 timmar för att boka ett möte.

Förfrågans detaljer:
- Maskin: Soprano ICE Platinum
- Serienummer: ABC123456
- Prioritet: Medel

Vi ser fram emot att samarbeta med dig!

Med vänlig hälsning,
Astomed Service Team
Tel: +46 8 XXX XXXX
Email: service@astomed.se`
    });

    // Example 2: Service Reminder
    await base44.integrations.Core.SendEmail({
      to: emailTo,
      subject: 'Påminnelse: Din maskin är snart förfallen för service',
      body: `Hej!

Vi vill påminna dig om att din Soprano ICE Platinum (SN: ABC123456) är förfallen för underhålls-service.

Nästa servicedatum: 2026-03-20

Det är viktigt att hålla dina maskiner väl underhållna för att säkerställa optimal prestanda och säkerhet. Vi erbjuder flexibla tider för service.

Boka ditt servicebesök här eller kontakta oss direkt:
Tel: +46 8 XXX XXXX
Email: service@astomed.se

Vänlig hälsning,
Astomed Service Team`
    });

    // Example 3: Quote/Kostnadsförslag
    await base44.integrations.Core.SendEmail({
      to: emailTo,
      subject: 'Kostnadsförslag för servicearbete - Astomed',
      body: `Hej!

Vi har uppskattat kostnaden för det servicearbete som diskuterades för din maskin.

KOSTNADSFÖRSLAG:
- Maskin: Soprano ICE Platinum
- Arbetstyp: Regelbundet underhål
- Arbetstimmar: 3 timmar @ 1 500 kr/timme = 4 500 kr
- Reservdelar: 2 000 kr
- Resor: 1 000 kr
---
TOTALT: 7 500 kr (exkl. moms)

Denna offert är giltig i 30 dagar.

För att godkänna denna offert, vänligen svara på detta mejl med "Godkänd" eller kontakta oss:
Tel: +46 8 XXX XXXX
Email: service@astomed.se

Med vänlig hälsning,
Astomed Service Team`
    });

    // Example 4: Service Contract Offer
    await base44.integrations.Core.SendEmail({
      to: emailTo,
      subject: 'Serviceavtal - Kostnadsfri konsultation från Astomed',
      body: `Hej!

Tack för intresset för serviceavtal från Astomed!

Vi erbjuder två serviceavtal för din maskin:

BASIC SERVICEAVTAL - 600 kr/månad
✓ Två schemalagda servicebesök per år
✓ Obegränsade telefonkonsultationer
✓ 15% rabatt på reservdelar
✓ Prioriterad support

PREMIUM SERVICEAVTAL - 999 kr/månad
✓ Fyra schemalagda servicebesök per år
✓ Obegränsade telefonkonsultationer
✓ 25% rabatt på reservdelar
✓ Prioriterad support
✓ Kostnadsfri resurs för mindre reparationer

Alla avtal är bindande för 12 månader.

För att diskutera vilken plan som passar dig bäst, kontakta oss:
Tel: +46 8 XXX XXXX
Email: service@astomed.se

Med vänlig hälsning,
Astomed Service Team`
    });

    // Example 5: Service Report/Rapport
    await base44.integrations.Core.SendEmail({
      to: emailTo,
      subject: 'Servicerapport - Ditt servicebesök den 10 mars 2026',
      body: `Hej!

Här är rapporten från ditt servicebesök av Soprano ICE Platinum.

SERVICERAPPORT
Datum: 2026-03-10
Tekniker: Anders Svensson
Maskin: Soprano ICE Platinum
Serienummer: ABC123456

UTFÖRDA ARBETEN:
- Rensat och inspekterat optik-system
- Bytt vätskefilter
- Uppdaterat firmware till senaste version
- Genomfört säkerhetskontroll

RESERVDELAR ANVÄNDA:
- Vätskefilter (2 st) - 800 kr
- Optik-kit - 1 200 kr

ARBETSTIMMAR: 2,5 timmar @ 1 500 kr = 3 750 kr

TOTALKOSTNAD: 5 750 kr (exkl. moms)

Nästa rekommenderade servicedate: 2026-09-10

Har du några frågor angående servicen, kontakta oss gärna!

Med vänlig hälsning,
Astomed Service Team
Tel: +46 8 XXX XXXX`
    });

    // Example 6: Contract Reminder
    await base44.integrations.Core.SendEmail({
      to: emailTo,
      subject: 'Påminnelse: Ditt serviceavtal förnyades idag',
      body: `Hej!

Vi vill bekräfta att ditt serviceavtal för Soprano ICE Platinum just förnyades.

AVTALETS DETALJER:
- Maskin: Soprano ICE Platinum (SN: ABC123456)
- Avtalsnivå: BASIC - 600 kr/månad
- Startdatum: 2026-03-13
- Bindningstid: 12 månader
- Slutdatum: 2027-03-13

INKLUDERAT I DITT AVTAL:
✓ Två schemalagda servicebesök per år
✓ Obegränsade telefonkonsultationer
✓ 15% rabatt på reservdelar
✓ Prioriterad support

Nästa schemalagd service: 2026-04-15

Tack för att du väljer Astomed!

Med vänlig hälsning,
Astomed Service Team`
    });

    // Example 7: Payment Confirmation (if applicable)
    await base44.integrations.Core.SendEmail({
      to: emailTo,
      subject: 'Betalningsbekräftelse - Astomed',
      body: `Hej!

Vi bekräftar mottagandet av din betalning.

BETALNINGSDETALJER:
Betalningsdatum: 2026-03-13
Referens: FAC-2026-0015
Belopp: 7 500 kr (exkl. moms)
Status: Genomförd

Din faktura är bifogad.

Med vänlig hälsning,
Astomed Finansteam`
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