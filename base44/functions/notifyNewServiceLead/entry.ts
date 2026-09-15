import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { event, data } = await req.json();

        if (!data || !data.company_name) {
            return Response.json({ error: 'Saknade data' }, { status: 400 });
        }

        const isBooking = data.service_type === 'Servicebokning';
        const title = isBooking ? 'Ny servicebokning inkommen' : 'Ny serviceförfrågan inkomst';
        const descriptionPrefix = isBooking ? 'En ny servicebokning har kommit in:' : 'En ny serviceförfrågan har kommit in:';
        const subject = isBooking ? `Ny servicebokning från ${data.company_name}` : `Ny serviceförfrågan från ${data.company_name}`;

        const emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f6f4;">
                <div style="background: linear-gradient(135deg, #1b3a3a 0%, #254f4f 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">${title}</h1>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
                    <p style="color: #1b3a3a; font-size: 16px; line-height: 1.6;">
                        ${descriptionPrefix}
                    </p>
                    
                    <div style="background: #e8f2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3a9e9e;">
                        <p style="margin: 5px 0; color: #254f4f;"><strong>Företag:</strong> ${data.company_name}</p>
                        <p style="margin: 5px 0; color: #254f4f;"><strong>Kontaktperson:</strong> ${data.contact_person}</p>
                        <p style="margin: 5px 0; color: #254f4f;"><strong>E-post:</strong> ${data.email}</p>
                        <p style="margin: 5px 0; color: #254f4f;"><strong>Telefon:</strong> ${data.phone}</p>
                        <p style="margin: 5px 0; color: #254f4f;"><strong>Maskin:</strong> ${data.machine_name}</p>
                        <p style="margin: 5px 0; color: #254f4f;"><strong>Servicetyp:</strong> ${data.service_type || 'Standard'}</p>
                        ${data.preferred_date ? `<p style="margin: 5px 0; color: #254f4f;"><strong>Önskat datum (preliminärt):</strong> ${data.preferred_date}</p>` : ''}
                    </div>

                    <h3 style="color: #1b3a3a;">Beskrivning:</h3>
                    <p style="color: #254f4f; line-height: 1.6;">${data.service_description}</p>

                    ${data.org_number ? `<p style="color: #254f4f;"><strong>Org.nummer:</strong> ${data.org_number}</p>` : ''}
                    ${data.address ? `<p style="color: #254f4f;"><strong>Adress:</strong> ${data.address}, ${data.postal_code} ${data.city}</p>` : ''}
                </div>
            </div>
        `;

        const recipients = isBooking ? ['liburn@astomed.se', 'elman@astomed.se'] : ['liburn@astomed.se'];

        for (const recipient of recipients) {
            try {
                await base44.asServiceRole.integrations.Core.SendEmail({
                    to: recipient,
                    from_name: 'Astomed Service',
                    subject: subject,
                    body: emailBody
                });
            } catch (err) {
                console.error('Kunde inte skicka e-post till ' + recipient, err);
            }
        }

        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});