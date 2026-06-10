import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user || user.role === 'customer') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { recordId } = await req.json();
        if (!recordId) return Response.json({ error: 'Missing recordId' }, { status: 400 });

        const record = await base44.entities.ServiceRecord.get(recordId);
        if (!record) return Response.json({ error: 'Record not found' }, { status: 404 });
        
        if (!record.protocol_uri) {
            return Response.json({ error: 'Protocol not generated yet' }, { status: 400 });
        }

        const customer = await base44.entities.Customer.get(record.customer_id);
        const machine = await base44.entities.Machine.get(record.machine_id);

        if (!customer || !customer.email) {
            return Response.json({ error: 'Customer has no email address' }, { status: 400 });
        }

        const signedUrlRes = await base44.integrations.Core.CreateFileSignedUrl({
            file_uri: record.protocol_uri,
            expires_in: 86400 * 7 // Valid for 7 days
        });

        const emailBody = `
Hej ${customer.contact_person || customer.company_name},

Här är ert serviceprotokoll för maskinen ${machine.model} (Serienummer: ${machine.serial_number}).

Ni kan ladda ner ert protokoll här:
${signedUrlRes.signed_url}

Länken är giltig i 7 dagar. Ni kan alltid hitta era protokoll inloggade i vår kundportal.

Med vänlig hälsning,
Astomed Service
        `;

        await base44.functions.invoke('sendSmtpEmail', {
            to: customer.email,
            subject: `Serviceprotokoll för ${machine.model}`,
            body: emailBody
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error(error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});