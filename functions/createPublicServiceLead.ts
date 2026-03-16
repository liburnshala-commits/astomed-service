import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const data = await req.json();

        const requiredFields = ["company_name", "contact_person", "email", "phone", "machine_name", "service_description"];
        for (const field of requiredFields) {
            if (!data[field]) {
                return Response.json({ error: `Saknat obligatoriskt fält: ${field}` }, { status: 400 });
            }
        }

        const lead = await base44.asServiceRole.entities.PublicServiceLead.create({
            company_name: data.company_name,
            contact_person: data.contact_person,
            email: data.email,
            phone: data.phone,
            org_number: data.org_number || null,
            address: data.address || null,
            postal_code: data.postal_code || null,
            city: data.city || null,
            machine_name: data.machine_name,
            manufacturer: data.manufacturer || null,
            serial_number: data.serial_number || null,
            service_description: data.service_description,
            service_type: data.service_type || "BAS - Astomed 3.0",
            status: "new"
        });

        // Logga händelsen
        try {
            await base44.asServiceRole.functions.invoke('logAuditEntry', {
                action: 'create',
                entity_type: 'PublicServiceLead',
                entity_id: lead.id,
                entity_label: lead.company_name,
                user_email: data.email,
                user_name: data.contact_person,
                details: `Ny serviceförfrågan via publikt formulär för maskin: ${data.machine_name}`
            });
        } catch (e) {
            console.error('Kunde inte logga audit entry:', e);
        }

        // Skicka bekräftelsemejl till kunden
        try {
            await base44.asServiceRole.integrations.Core.SendEmail({
                to: data.email,
                from_name: "Astomed Service",
                subject: "Bekräftelse: Vi har mottagit din serviceförfrågan",
                body: `Hej ${data.contact_person},

Tack för din serviceförfrågan angående din maskin (${data.machine_name}). Vi har nu tagit emot ditt ärende och kommer att återkoppla till dig så snart som möjligt för att boka in en tid eller ge dig mer information.

Här är en sammanfattning av ditt ärende:
Maskin: ${data.machine_name}
Serienummer: ${data.serial_number || 'Ej angivet'}
Beskrivning: ${data.service_description}

Har du några kompletterande uppgifter kan du höra av dig till oss.

Vänliga hälsningar,
Astomed Service Team`
            });
        } catch (emailError) {
            console.error("Kunde inte skicka bekräftelsemejl:", emailError);
            // Vi fortsätter ändå, leadet är skapat
        }

        return Response.json({ success: true, id: lead.id });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});