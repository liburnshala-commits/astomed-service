import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'customer') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { machineId, machineName, serialNumber, customerName, customerEmail, message } = await req.json();

    if (!machineId || !customerEmail) {
      return Response.json({ error: 'Maskin och e-post krävs' }, { status: 400 });
    }

    // Create a service record in pending state
    const serviceRecord = await base44.asServiceRole.entities.ServiceRecord.create({
      machine_id: machineId,
      customer_id: (await base44.asServiceRole.entities.Customer.filter({ email: customerEmail }))[0]?.id || '',
      service_type: 'standard',
      service_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      description: message ? `Kundbeställning:\n${message}` : 'Kundbeställning via kundportalen.',
    });

    // Send email notification to Astomed
    const internalSubject = `Ny servicebeställning från ${customerName} – ${machineName}`;
    const internalBody = `Hej,

En ny servicebeställning har inkommit via kundportalen.

Kund: ${customerName}
E-post: ${customerEmail}
Maskin: ${machineName}
Serienummer: ${serialNumber || '–'}
${message ? `\nMeddelande från kunden:\n${message}` : ''}

Ärendet har skapats automatiskt i Astomed Pro (ärende-ID: ${serviceRecord.id}).

Med vänliga hälsningar,
Astomed Pro – Systemmeddelande`;

    await base44.asServiceRole.functions.invoke('sendSmtpEmail', {
      to: 'info@astomed.se',
      subject: internalSubject,
      body: internalBody,
    });

    // Send confirmation to customer
    const confirmSubject = `Servicebeställning mottagen – ${machineName}`;
    const confirmBody = `Hej ${customerName},

Vi har mottagit din servicebeställning för ${machineName}${serialNumber ? ` (SN: ${serialNumber})` : ''}.

${message ? `Ditt meddelande:\n"${message}"\n` : ''}
Vi återkommer inom kort för att boka in en tid.

Med vänliga hälsningar,
Astomed Klinikutrustning Sverige AB
Jägerhorns väg 3-5, 141 75 Kungens Kurva
Tel: 08 – 410 779 00
E-post: info@astomed.se
www.astomed.se`;

    await base44.asServiceRole.functions.invoke('sendSmtpEmail', {
      to: customerEmail,
      subject: confirmSubject,
      body: confirmBody,
    });

    return Response.json({ success: true, serviceRecordId: serviceRecord.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});