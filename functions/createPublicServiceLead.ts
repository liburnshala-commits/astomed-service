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
            service_type: data.service_type || "standard",
            status: "new"
        });

        return Response.json({ success: true, id: lead.id });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});