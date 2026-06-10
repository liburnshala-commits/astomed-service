import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (user?.role !== 'admin' && user?.role !== 'technician') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { machine_id } = await req.json();
        if (!machine_id) {
             return Response.json({ error: 'machine_id required' }, { status: 400 });
        }

        const machine = await base44.asServiceRole.entities.Machine.get(machine_id);
        if (!machine) throw new Error("Maskinen hittades inte");
        
        const customer = await base44.asServiceRole.entities.Customer.get(machine.customer_id);
        if (!customer || !customer.email) throw new Error("Kunden saknar e-postadress");

        const subject = `Dags för service: ${machine.model}`;
        const body = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Servicepåminnelse från Astomed</h2>
                <p>Hej ${customer.contact_person || customer.company_name},</p>
                <p>Det börjar närma sig dags för service på er maskin <b>${machine.model}</b> (SN: ${machine.serial_number}).</p>
                ${machine.next_service_date ? `<p>Nästa rekommenderade servicedatum är <b>${machine.next_service_date}</b>.</p>` : ''}
                <p>Vänligen kontakta oss för att boka en tid för service, eller logga in på din kundportal om du redan har tillgång.</p>
                <p>Passa även på att spana in vårt senaste utbud av utrustning på <a href="https://astomed.se/maskiner/">astomed.se</a>.</p>
                <br>
                <p>Med vänliga hälsningar,<br><b>Astomed Service</b></p>
            </div>
        `;

        await base44.asServiceRole.functions.invoke('sendSmtpEmail', {
            to: customer.email,
            subject: subject,
            body: body,
            from_name: "Astomed Service"
        });

        await base44.asServiceRole.entities.CustomerInteraction.create({
            customer_id: customer.id,
            interaction_type: 'email',
            interaction_date: new Date().toISOString(),
            notes: `Skickade manuell servicepåminnelse via e-post för maskin ${machine.model} (SN: ${machine.serial_number}).`,
            logged_by: user?.full_name || user?.email || "System"
        });

        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});